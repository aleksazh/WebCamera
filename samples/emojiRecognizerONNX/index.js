let utils = new Utils('errorMessage');
let stats = null;
let controls = {};
let videoConstraint;
let streaming = false;
let videoTrack = null;

let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasInput = null;
let canvasInputCtx = null;

let src = null;
let gray = null;
let faceVec = null;
let faceCascade = null;
let emotionNet = null;

const faceModelPath = 'haarcascade_frontalface_default.xml';
const faceModelUrl = '../../data/classifiers/haarcascade_frontalface_default.xml';
const emojiModelPath = 'emotion_recognizer.onnx';
const emojiModelUrl = '../../data/classifiers/emotion_recognizer.onnx';

let emoticons = [];
const emotions = ['neutral', 'happiness', 'surprise', 'sadness', 'anger', 'disgust', 'fear', 'contempt'];

let nImagesLoaded = 0;
const N_IMAGES = emotions.length;


function initOpencvObjects() {
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  gray = new cv.Mat();

  faceVec = new cv.RectVector();
  faceCascade = new cv.CascadeClassifier();
  // TODO(sasha): Use Web Workers to load files.
  faceCascade.load(faceModelPath);

  emotions.forEach(emotion => {
    let emoticonImg = createImgNode(emotion + '-emoticon');

    emoticonImg.onload = function () {
      ++nImagesLoaded;
    };
    emoticonImg.src = '../../data/emoticons/' + emotion + '.png';
  });
  emotionNet = cv.readNetFromONNX(emojiModelPath);
}

function createImgNode(id) {
  let imgNode = document.createElement('img');
  imgNode.id = id;
  imgNode.classList.add('hidden');
  document.getElementsByTagName('body')[0].appendChild(imgNode);
  return imgNode;
}

function deleteOpencvObjects() {
  src.delete(); gray.delete();
  faceVec.delete(); faceCascade.delete();

  emoticons.forEach(emoticon => {
    emoticon.src.delete();
    emoticon.mask.delete();
  });
}

function completeStyling() {
  let cameraBar = document.querySelector('.camera-bar-wrapper');
  cameraBar.style.width = `${video.width}px`;
  document.getElementById('takePhotoButton').disabled = false;

  // Extra canvas to get source image from video element
  // (instead of cv.VideoCapture).
  canvasInput = document.createElement('canvas');
  canvasInput.width = video.width;
  canvasInput.height = video.height;
  canvasInputCtx = canvasInput.getContext('2d');

  canvasOutput.width = video.width;
  canvasOutput.height = video.height;
}

function waitForResources() {
  if (nImagesLoaded == N_IMAGES) {
    emotions.forEach(emotion => {
      let emoticonImg = document.getElementById(emotion + '-emoticon');
      let rgbaVector = new cv.MatVector();
      let emoticon = {};
      emoticon.src = cv.imread(emoticonImg);
      cv.split(emoticon.src, rgbaVector); // Create mask from alpha channel.
      emoticon.mask = rgbaVector.get(3);
      emoticon.name = emotion;
      emoticons.push(emoticon);
      rgbaVector.delete();
    });

    requestAnimationFrame(processVideo);
    return;
  }
  setTimeout(waitForResources, 50);
}

function processVideo() {
  try {
    if (!streaming) {
      cleanupAndStop();
      return;
    }
    stats.begin();
    canvasInputCtx.drawImage(video, 0, 0, video.width, video.height);
    let imageData = canvasInputCtx.getImageData(0, 0, video.width, video.height);
    src.data.set(imageData.data);

    // Detect faces.
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    faceCascade.detectMultiScale(gray, faceVec);

    for (let i = 0; i < faceVec.size(); ++i) {
      let face = faceVec.get(i);
      // Recognize emotion.

      // Detect eyes in face ROI.
      let faceGray = gray.roi(face);
      //cv.resize(faceGray, faceGray, new cv.Size(64, 64));
      let blob = cv.blobFromImage(faceGray, 1.0, new cv.Size(64, 64));
      emotionNet.setInput(blob);
      let predictions = emotionNet.forward();
      let index = predictions.data32F.indexOf(Math.max(...predictions.data32F));
      let emoticon = emoticons[index];
      let newEmoticonSize = new cv.Size(face.width, face.height);
      let resizedEmoticon = new cv.Mat();
      let resizedMask = new cv.Mat();
      cv.resize(emoticon.src, resizedEmoticon, newEmoticonSize);
      cv.resize(emoticon.mask, resizedMask, newEmoticonSize);
      resizedEmoticon.copyTo(src.rowRange(face.y, face.y + face.height)
        .colRange(face.x, face.x + face.width), resizedMask);

      faceGray.delete();
    }
    cv.imshow(canvasOutput, src);

    stats.end();
    requestAnimationFrame(processVideo);
  } catch (err) {
    utils.printError(err);
  }
};

function startCamera() {
  if (!streaming) {
    utils.clearError();
    utils.startCamera(videoConstraint, 'videoInput', onVideoStartedCustom);
  } else {
    utils.stopCamera();
    onVideoStopped();
  }
}

function onVideoStartedCustom() {
  streaming = true;
  setMainCanvasProperties(video);
  videoTrack = video.srcObject.getVideoTracks()[0];
  imageCapturer = new ImageCapture(videoTrack);
  document.getElementById('mainContent').classList.remove('hidden');
  completeStyling();
  initOpencvObjects();
  requestAnimationFrame(waitForResources);
}

function cleanupAndStop() {
  deleteOpencvObjects();
  utils.stopCamera(); onVideoStopped();
}

function initUI() {
  let menuHeight = parseInt(getComputedStyle(
    document.querySelector('.camera-bar-wrapper')).height);
  getVideoConstraint(menuHeight);
  initStats();

  // TakePhoto event by clicking takePhotoButton.
  let takePhotoButton = document.getElementById('takePhotoButton');
  takePhotoButton.addEventListener('click', function () {
    // Here we are not using takePhoto() per se.
    // new ImageCapture(videoTrack) gives image without applied filter.
    let dstCanvas = document.getElementById('gallery');
    drawCanvas(dstCanvas, canvasOutput);
  });

  // TODO(sasha): move to utils.js.
  let facingModeButton = document.getElementById('facingModeButton');
  // Switch to face or environment mode by clicking facingModeButton.
  facingModeButton.addEventListener('click', function () {
    if (controls.facingMode == 'user') {
      controls.facingMode = 'environment';
      videoConstraint.deviceId = { exact: controls.backCamera.deviceId };
      facingModeButton.innerText = 'camera_front';
    } else if (controls.facingMode == 'environment') {
      controls.facingMode = 'user';
      videoConstraint.deviceId = { exact: controls.frontCamera.deviceId };
      facingModeButton.innerText = 'camera_rear';
    }
    utils.clearError();
    utils.stopCamera();
    utils.startCamera(videoConstraint, 'videoInput', startVideoProcessing);
  });

  if (!isMobileDevice()) {
    // Init threads number.
    let threadsControl = document.getElementsByClassName('threads-control')[0];
    threadsControl.classList.remove('hidden');
    let threadsNumLabel = document.getElementById('threadsNumLabel');
    let threadsNum = document.getElementById('threadsNum');
    threadsNum.max = navigator.hardwareConcurrency;
    threadsNumLabel.innerHTML = `Number of threads (1 - ${threadsNum.max}):&nbsp;`;
    if (3 <= threadsNum.max) threadsNum.value = 3;
    else threadsNum.value = 1;
    cv.parallel_pthreads_set_threads_num(parseInt(threadsNum.value));
    threadsNum.addEventListener('change', () => {
      cv.parallel_pthreads_set_threads_num(parseInt(threadsNum.value));
    });
  }
}

utils.loadOpenCv(() => {
  utils.createFileFromUrl(faceModelPath, faceModelUrl, () => {
    utils.createFileFromUrl(emojiModelPath, emojiModelUrl, () => {
      initUI();
      initCameraSettingsAndStart();
    });
  });
});
