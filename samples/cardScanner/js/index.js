let utils = new Utils('errorMessage');
let controls = {};
let videoConstraint;
let streaming = false;
let videoTrack = null;
let imageCapturer = null;
let photoSettings = null;
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let videoCapturer = null;
let src = null;

// We draw rectangle for card on video stream.
let rectPointUpperLeft;
let rectPointBottomRight;
const rectColor = [0, 255, 0, 255]; // Green


function calculateRectCoordinates() {
  const rectRatio = 1.586;
  let xLeft = parseInt(video.width * 0.1);
  let xRight = parseInt(video.width * 0.9);
  let width = xRight - xLeft;
  let height = width / rectRatio;
  let yUpper = parseInt(video.height / 2 - height / 2);
  let yBottom = parseInt(yUpper + height);
  rectPointUpperLeft = new cv.Point(xLeft, yUpper);
  rectPointBottomRight = new cv.Point(xRight, yBottom);
}

function initOpencvObjects() {
  videoCapturer = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  calculateRectCoordinates();
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

  // Use the same size of the photo as the video source.
  photoSettings = setPhotoSettings();
}

function processVideo() {
  try {
    if (!streaming) {
      src.delete();
      return;
    }
    videoCapturer.read(src);
    cv.rectangle(src, rectPointUpperLeft, rectPointBottomRight, rectColor, 3);
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
    imageCapturer.takePhoto(photoSettings)
      .then(blob => createImageBitmap(blob))
      .then(imageBitmap => {
        // Draw photo to small gallery canvas.
        const canvas = document.getElementById('gallery');
        drawCanvas(canvas, imageBitmap);
        // Extract card photo and process it.
        startCardProcessing(imageBitmap);
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
