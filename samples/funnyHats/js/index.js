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
let classifier = null;
let faces = null;

let yOfsset = 0;
let xOffset = 0;

const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';

const FPS = 30;
function startVideoProcessing() {
  cap = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  gray = new cv.Mat();
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
    hatSrc = hats[currentHat].src.clone();
    mask = hats[currentHat].mask.clone();

    // detect faces
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    classifier.detectMultiScale(gray, faces,
      1.1, 3); // scaleFactor=1.1, minNeighbors=3

    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      // resize hat and mask
      let scaledWidth = parseInt(hats[currentHat].scale * face.width);
      let scaledHeight = parseInt(hats[currentHat].scale * face.width);
      cv.resize(hatSrc, hatSrc, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
      cv.resize(mask, mask, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
      // copy hat to output video
      let y2 = face.y + Math.round(Number(hats[currentHat].yOffset) * face.height);
      let y1 = y2 - hatSrc.rows;
      let x1 = face.x + parseInt(face.width / 2 - hatSrc.cols / 2);
      let x2 = x1 + hatSrc.cols;
      // if the hat is inside canvas window
      if (x1 > 0 && x2 < video.width && y1 >= 0) {
        hatSrc.copyTo(src.rowRange(y1, y2).colRange(x1, x2), mask);
      // if the hat is above of the upper border
      } else if (x1 > 0 && x2 < video.width && y1 < 0) {
        let hatRoi = hatSrc.roi(new cv.Rect(0, -y1, scaledWidth, hatSrc.cols + y1));
        let maskRoi = mask.roi(new cv.Rect(0, -y1, scaledWidth, mask.cols + y1));
        hatRoi.copyTo(src.rowRange(0, y2).colRange(x1, x2), maskRoi);
        hatRoi.delete(); maskRoi.delete();
      } // draw nothing if the hat extends beyond the right or left border
    }
    hatSrc.delete(); mask.delete();
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