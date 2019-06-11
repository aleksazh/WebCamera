let utils = new Utils('errorMessage');

//let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');

let streaming = false;
let cap = null;
let src = null;
let gray = null;
let hatDst = null;
let maskDst = null;
let faces = null;
let classifier = null;

let yOfsset = 0;
let xOffset = 0;

const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';

const FPS = 30;
function startVideoProcessing() {
  cap = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  gray = new cv.Mat();
  cap = new cv.VideoCapture(video);
  hatDst = new cv.Mat();
  maskDst = new cv.Mat();
  classifier = new cv.CascadeClassifier();
  faces = new cv.RectVector();

  classifier.load(faceDetectionPath);
  setTimeout(processVideo, 0); // schedule the first processing
}

function processVideo() {
  try {
    if (!streaming) { // clean and stop
      src.delete(); gray.delete();
      classifier.delete(); faces.delete();
      return;
    }
    stats.begin();
    let begin = Date.now();
    cap.read(src);
    // detect faces
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    classifier.detectMultiScale(gray, faces,
      1.1, 3); // scaleFactor=1.1, minNeighbors=3

    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      // resize hat and mask
      let scaledWidth = parseInt(hats[currentHat].scale * face.width);
      let scaledHeight = parseInt(hats[currentHat].scale * face.height);
      let yOffset = Number(hats[currentHat].yOffset);
      cv.resize(hatSrc, hatDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
      cv.resize(mask, maskDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
      let y2 = face.y + Math.round(yOffset * face.height);
      let y1 = y2 - scaledHeight;
      let x1 = face.x + parseInt(face.width / 2 - scaledWidth / 2);
      let x2 = x1 + scaledWidth;
      if (x1 > 0 && x2 < video.width && y1 >= 0) {
        hatDst.copyTo(src.rowRange(y1, y2).colRange(x1, x2), maskDst);
      } else if (x1 > 0 && x2 < video.width && y1 < 0) {
        let hatRoi = hatDst.roi(new cv.Rect(0, -y1, scaledWidth, scaledHeight + y1));
        let maskRoi = maskDst.roi(new cv.Rect(0, -y1, scaledWidth, scaledHeight + y1));
        hatRoi.copyTo(src.rowRange(0, y2).colRange(x1, x2), maskRoi);
        hatRoi.delete(); maskRoi.delete();
      }
    }
    // draw output video
    cv.imshow('canvasOutput', src);
    let delay = 1000 / FPS - (Date.now() - begin); // schedule the next
    stats.end();
    setTimeout(processVideo, delay);
  } catch (err) {
    utils.printError(err);
  }
};

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
  video.width = video.videoWidth;
  video.height = video.videoHeight;
  //canvasOutput.width = video.videoWidth;
  //canvasOutput.height = video.videoHeight;
  //canvasOutput.style.width = `${video.videoWidth}px`;
  //canvasOutput.style.height = `${video.videoHeight}px`;
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