let utils = new Utils('errorMessage');
let controls = {};
let videoConstraint;
let videoTrack = null;
let imageCapturer = null;
let video = document.getElementById('videoInput');

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
}

function startCamera() {
  utils.startCamera(videoConstraint, 'videoInput', onCameraStarted);
}

function onCameraStarted() {
  videoTrack = video.srcObject.getVideoTracks()[0];
  imageCapturer = new ImageCapture(videoTrack);
  completeStyling();
}

utils.loadOpenCv(() => {
  initUI();
  initCameraSettingsAndStart();
});
