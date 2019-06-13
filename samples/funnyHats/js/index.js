let utils = new Utils('errorMessage');
let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
//let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');
let streaming = false;
let src = null;
let cap = null;
let hatDst = null;
let maskDst = null;
let faces = null;
let classifier = null;
let hatFrames = []; // last drawn hat frame for each face
let width = 0;
let height = 0;

const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';
const JITTER_LIMIT = 3;


const FPS = 30;
function startVideoProcessing() {
  src = new cv.Mat(height, width, cv.CV_8UC4);
  gray = new cv.Mat();
  cap = new cv.VideoCapture(video);
  hatDst = new cv.Mat();
  maskDst = new cv.Mat();
  faces = new cv.RectVector();
  classifier = new cv.CascadeClassifier();

  // load pre-trained classifier for face detection
  classifier.load(faceDetectionPath);
  // schedule the first processing
  setTimeout(processVideo, 0);
}

function resizeHat(scaledWidth, scaledHeight, i) {
  cv.resize(hatSrc, hatDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
  cv.resize(mask, maskDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
  if (hatFrames[i].y1 > 0 && hatFrames[i].x2 < width && hatFrames[i].x1 >= 0) {
    hatFrames[i].src = hatDst.clone();
    hatFrames[i].mask = maskDst.clone();
  } else if (hatFrames[i].y1 === 0 && hatFrames[i].x2 < width && hatFrames[i].x1 >= 0) {
    hatFrames[i].src = hatDst.roi(new cv.Rect(0, scaledHeight - hatFrames[i].y2, scaledWidth, hatFrames[i].y2));
    hatFrames[i].mask = maskDst.roi(new cv.Rect(0, scaledHeight - hatFrames[i].y2, scaledWidth, hatFrames[i].y2));
  } else {
    hatFrames[i].show = false;
    hatFrames[i].src = new cv.Mat();
    hatFrames[i].mask = new cv.Mat();
  }
}

function processVideo() {
  try {
    if (!streaming) {
      // clean and stop
      src.delete(); gray.delete();
      hatDst.delete(); maskDst.delete();
      faces.delete(); classifier.delete();
      return;
    }
    stats.begin();
    let begin = Date.now();
    // start processing
    cap.read(src);
    // detect faces
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    classifier.detectMultiScale(gray, faces,
      1.1, 3); // scaleFactor=1.1, minNeighbors=3
    // delete hats for old faces from hatFrame
    if (hatFrames.length > faces.size() && faces.size() > 0) {
      for (let i = faces.size(); i < hatFrames.length; ++i) {
        hatFrames[i].src.delete();
        hatFrames[i].mask.delete();
      }
      hatFrames.length = faces.size();
    }
    // draw hat for each face
    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      let scaledWidth = parseInt(hats[currentHat].scale * face.width);
      let scaledHeight = parseInt(hats[currentHat].scale * face.height);
      let yOffset = Number(hats[currentHat].yOffset);
      let y2 = face.y + Math.round(yOffset * face.height);
      let y1 = y2 - scaledHeight;
      let x1 = face.x + parseInt(face.width / 2 - scaledWidth / 2);
      let x2 = x1 + scaledWidth;
      if (y1 < 0) y1 = 0;
      if (!hatFrames[i]) {
        // create new hat frame
        hatFrames.splice(i, 0, { x1: x1, x2: x2, y1: y1, y2: y2,
          show: true });
        resizeHat(scaledWidth, scaledHeight, i);
      } else if (hatFrames[i].x1 > x1 + JITTER_LIMIT ||
                 hatFrames[i].x1 < x1 - JITTER_LIMIT ||
                 hatFrames[i].y1 > y1 + JITTER_LIMIT ||
                 hatFrames[i].y1 < y1 - JITTER_LIMIT ||
                 hatFrames[i].x2 > x2 + JITTER_LIMIT ||
                 hatFrames[i].x2 < x2 - JITTER_LIMIT ||
                 hatFrames[i].y2 > y2 + JITTER_LIMIT ||
                 hatFrames[i].y2 < y2 - JITTER_LIMIT) {
        // replace old hat frame
        hatFrames[i].src.delete();
        hatFrames[i].mask.delete();
        hatFrames.splice(i, 1, { x1: x1, x2: x2, y1: y1, y2: y2,
          show: true });
        resizeHat(scaledWidth, scaledHeight, i);
      }
      if (hatFrames[i].show) {
        hatFrames[i].src.copyTo(src.rowRange(hatFrames[i].y1, hatFrames[i].y2)
          .colRange(hatFrames[i].x1, hatFrames[i].x2), hatFrames[i].mask);
      }
    }
    cv.imshow('canvasOutput', src);

    // schedule the next processing
    let delay = 1000 / FPS - (Date.now() - begin);
    stats.end();
    setTimeout(processVideo, delay);
  } catch (err) {
    utils.printError(err);
  }
};

function setWidthAndHeight() {
  height = video.videoHeight;
  width = video.videoWidth;
  video.setAttribute('width', width);
  video.setAttribute('height', height);
  let canvas = document.getElementById("canvasOutput");
  canvas.style.height = `${height}px`;
  canvas.style.width = `${width}px`;
  document.getElementsByClassName("canvas-wrapper")[0].style.height =
    `${height}px`;
}

function startCamera() {
  if (!streaming) {
    utils.clearError();
    utils.startCamera(resolution, onVideoStarted, 'videoInput');
  } else {
    utils.stopCamera();
    onVideoStopped();
  }
}

function onVideoStarted() {
  streaming = true;
  setWidthAndHeight();
  resizeMenu();
  //canvasOutput.width = video.videoWidth;
  //canvasOutput.height = video.videoHeight;
  startVideoProcessing();
}

function onVideoStopped() {
  streaming = false;
  canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
  deleteHats();
}

utils.loadOpenCv(() => {
  utils.createFileFromUrl(faceDetectionPath, faceDetectionUrl, () => {
    initUI();
    startCamera();
  });
});