let utils = new Utils('errorMessage');
let stats = null;
let controls = {};
let videoConstraint;
let streaming = false;
let videoTrack = null;
let imageCapturer = null;
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let videoCapturer = null;
let src = null;
let dst = null;

// We draw rectangle for card on video stream.
let rectPointUpperLeft;
let rectPointBottomRight;
let edgeRect;
const rectColor = [0, 255, 0, 255]; // Green

const contourColor = [255, 0, 0, 255];
const CARD_MIN_AREA = 145000;
const CARD_MAX_AREA = 165000;


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
  edgeRect = new cv.Rect(xLeft - 5, yUpper - 5, xRight - xLeft + 10, yBottom - yUpper + 10);
}

function initOpencvObjects() {
  videoCapturer = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
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
}

function processVideo() {
  try {
    if (!streaming) {
      cleanupAndStop();
      return;
    }
    stats.begin();
    videoCapturer.read(src);

    cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY, 0);
    //let roi = new cv.Mat();
    //roi = dst.roi(edgeRect);
    cv.GaussianBlur(dst, dst, { width: 5, height: 5 }, 0, 0, cv.BORDER_DEFAULT);
    cv.Canny(dst, dst, controls.tr1, controls.tr2, 3, false);
    //cv.threshold(dst, dst, 10, 255, cv.THRESH_BINARY);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let dstDraw = cv.Mat.zeros(dst.rows, dst.cols, cv.CV_8UC3);
    cv.findContours(dst, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contours.size(); ++i) {
      let tmp = new cv.Mat();
      let cnt = contours.get(i);
      let size = cv.contourArea(cnt);
      let peri = cv.arcLength(cnt, true);
      cv.approxPolyDP(cnt, tmp, 0.01 * peri, true);

      if (size > CARD_MIN_AREA && size < CARD_MAX_AREA && tmp.rows == 4) {
        console.log('size', size, 'peri', peri);
        cv.drawContours(dstDraw, contours, i, contourColor, 1, cv.LINE_8, hierarchy, 100);
        cv.imshow('outputImage2', dstDraw);
        startCardProcessing(src, rectPointUpperLeft, rectPointBottomRight);
        document.getElementById('retryButton').disabled = false;
        //cleanupAndStop();
        return;
      }
      tmp.delete(); cnt.delete();
    }
    cv.imshow('outputImage2', dstDraw);

    dstDraw.delete();
    contours.delete(); hierarchy.delete();
    //roi.delete();



    cv.rectangle(src, rectPointUpperLeft, rectPointBottomRight, rectColor, 3);
    cv.imshow('canvasOutput', src);
    stats.end();
    requestAnimationFrame(processVideo);
  } catch (err) {
    utils.printError(err);
  }
}

function initUI() {
  getVideoConstraint();
  initStats();

  // TakePhoto event by clicking takePhotoButton.
  // let takePhotoButton = document.getElementById('takePhotoButton');
  // takePhotoButton.addEventListener('click', function () {
  //   takePhoto();
  // });

  controls = {
    frontCamera: null,
    backCamera: null,
    facingMode: '',
    tr1: parseInt(document.getElementById('cannyThreshold1').value),
    tr2: parseInt(document.getElementById('cannyThreshold2').value),
  };
  document.getElementById('cannyThreshold1Output').value = controls.tr1;
  document.getElementById('cannyThreshold2Output').value = controls.tr2;

  let tr1 = document.getElementById('cannyThreshold1');
  tr1.oninput = function () {
    document.getElementById('cannyThreshold1Output').value =
      controls.tr1 = parseInt(tr1.value);
  };
  let tr2 = document.getElementById('cannyThreshold2');
  tr2.oninput = function () {
    document.getElementById('cannyThreshold2Output').value =
      controls.tr2 = parseInt(tr2.value);
  };

  let retryButton = document.getElementById('retryButton');
  retryButton.addEventListener('click', function () {
    document.getElementById('retryButton').disabled = true;
    startVideoProcessing();
  });
}

function startCamera() {
  utils.startCamera(videoConstraint, 'videoInput', onVideoStarted);
}

function cleanupAndStop() {
  src.delete(); dst.delete();
  utils.stopCamera(); onVideoStopped();
}

utils.loadOpenCv(() => {
  initUI();
  initCameraSettingsAndStart();
});
