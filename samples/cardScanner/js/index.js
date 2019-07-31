let utils = new Utils('errorMessage');
let controls = {};
let videoConstraint;
let videoTrack = null;
let imageCapturer = null;
let video = document.getElementById('videoInput');
let videoCapturer = null;
let src = null;

let rectWidth = 50;
let rectHeight = 25;
const rectColor = [0, 255, 0, 255]; // Green

function processVideo() {
  videoCapturer.read(src);
  let pointUpperLeft = new cv.Point(50, 50);
  let pointBottomRight = new cv.Point(50 + rectWidth, 50 + rectHeight);
  cv.rectangle(src, pointUpperLeft, pointBottomRight, greenColor);
  // cv.imshow('videoInput', src); // USE CANVAS
  requestAnimationFrame(processVideo);
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

function startCamera() {
  utils.startCamera(videoConstraint, 'videoInput', onCameraStarted);
}

function onCameraStarted() {
  videoTrack = video.srcObject.getVideoTracks()[0];
  imageCapturer = new ImageCapture(videoTrack);
  completeStyling();
  videoCapturer = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  requestAnimationFrame(processVideo);
}

function stopCamera(videoElem) {
  if (videoElem) {
    videoElem.pause();
    videoElem.srcObject = null;
    videoElem.removeEventListener('canplay', utils.onVideoCanPlay);
  }
  if (videoElem.srcObject) {
    videoElem.srcObject.getVideoTracks()[0].stop();
  }
  src.delete();
};

utils.loadOpenCv(() => {
  initUI();
  initCameraSettingsAndStart();
});
