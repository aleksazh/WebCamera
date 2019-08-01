let utils = new Utils('errorMessage');
let controls = {};
let videoConstraint;
let streaming = false;
let videoTrack = null;
let imageCapturer = null;
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let videoCapturer = null;
let src = null;

let rectWidth = 50;
let rectHeight = 25;
const rectColor = [0, 255, 0, 255]; // Green


function initOpencvObjects() {
  videoCapturer = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
}

function completeStyling() {
  let cameraBar = document.querySelector('.camera-bar-wrapper');
  cameraBar.style.width = `${video.videoWidth}px`;

  let mainContent = document.getElementById('mainContent');
  mainContent.style.width = `${video.videoWidth}px`;
  mainContent.classList.remove('hidden');

  document.querySelector('.canvas-wrapper').style.height =
    `${video.videoHeight}px`;

  document.getElementById('takePhotoButton').disabled = false;
  document.getElementById('facingModeButton').disabled = true;
}

function processVideo() {
  try {
    if (!streaming) {
      src.delete();
      return;
    }
    videoCapturer.read(src);
    let pointUpperLeft = new cv.Point(50, 50);
    let pointBottomRight = new cv.Point(50 + rectWidth, 50 + rectHeight);
    cv.rectangle(src, pointUpperLeft, pointBottomRight, rectColor, 3);
    cv.imshow('canvasOutput', src);
    requestAnimationFrame(processVideo);
  } catch (err) {
    utils.printError(err);
  }
}

function initUI() {
  getVideoConstraint();

  // TakePhoto event by clicking takePhotoButton.
  let takePhotoButton = document.getElementById('takePhotoButton');
  takePhotoButton.addEventListener('click', function () {
    imageCapturer.takePhoto()
      .then(blob => createImageBitmap(blob))
      .then(imageBitmap => {
        const canvas = document.getElementById('gallery');
        drawCanvas(canvas, imageBitmap);
        startCardProcessing();
      })
      .catch((err) => console.error("takePhoto() failed: ", err));
  });

  controls = {
    frontCamera: null,
    backCamera: null,
    facingMode: '',
  };
}

function startCamera() {
  utils.startCamera(videoConstraint, 'videoInput', onVideoStarted);
}

function stopCamera(videoElem) {
  if (!streaming) {
    utils.clearError();
    utils.startCamera(videoConstraint, 'videoInput', onVideoStarted);
  } else {
    utils.stopCamera();
    onVideoStopped();
  }
};

utils.loadOpenCv(() => {
  initUI();
  initCameraSettingsAndStart();
});
