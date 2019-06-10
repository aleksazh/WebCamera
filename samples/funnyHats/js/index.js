let utils = new Utils('errorMessage');
//let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let resolution = 'qvga';
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
let hatFrame = []; // last drawn hat frame for each face

const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';
const JITTER_LIMIT = 5;


const FPS = 30;
function startVideoProcessing() {
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
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

function calculateHatCoordinates(width, height, i) {
  console.log(width, height);
  cv.resize(hatSrc, hatDst, new cv.Size(width, height), 0, 0, cv.INTER_LINEAR);
  cv.resize(mask, maskDst, new cv.Size(width, height), 0, 0, cv.INTER_LINEAR);
  if (hatFrame[i].y1 > 0 && hatFrame[i].x2 < video.width && hatFrame[i].x1 >= 0) {
    console.log("clone");
    hatFrame[i].src = hatDst.clone();
    hatFrame[i].mask = maskDst.clone();
  } else if (hatFrame[i].y1 === 0) {
    console.log("roi");
    hatFrame[i].src = hatDst.roi(new cv.Rect(0, height - hatFrame[i].y2, width, hatFrame[i].y2));
    hatFrame[i].mask = maskDst.roi(new cv.Rect(0, height - hatFrame[i].y2, width, hatFrame[i].y2));
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
    if (hatFrame.length > faces.size() && faces.size() > 0) {
      console.log("delete", hatFrame.length, faces.size());
      for (let i = faces.size(); i < hatFrame.length; ++i) {
        hatFrame[i].src.delete();
        hatFrame[i].mask.delete();
      }
      hatFrame.length = faces.size();
      console.log("delete2", hatFrame.length, faces.size());
    }
    // draw hats
    for (let i = 0; i < faces.size(); ++i) {
      console.log("i", i, hatFrame.length, faces.size());
      let face = faces.get(i);
      let scaledWidth = parseInt(hats[currentHat].scale * face.width);
      let scaledHeight = parseInt(hats[currentHat].scale * face.height);
      let yOffset = Number(hats[currentHat].yOffset);
      let y2 = face.y + Math.round(yOffset * face.height);
      let y1 = y2 - scaledHeight;
      let x1 = face.x + parseInt(face.width / 2 - scaledWidth / 2);
      let x2 = x1 + scaledWidth;
      if (y1 < 0) y1 = 0;
      if (!hatFrame[i]) {
        hatFrame.push({ x1: x1, x2: x2, y1: y1, y2: y2 });
        calculateHatCoordinates(scaledWidth, scaledHeight, i);
      } else if (hatFrame[i].x1 > x1 + JITTER_LIMIT ||
        hatFrame[i].x1 < x1 - JITTER_LIMIT ||
        hatFrame[i].y1 > y1 + JITTER_LIMIT ||
        hatFrame[i].y1 < y1 - JITTER_LIMIT ||
        hatFrame[i].x2 > x2 + JITTER_LIMIT ||
        hatFrame[i].x2 < x2 - JITTER_LIMIT ||
        hatFrame[i].y2 > y2 + JITTER_LIMIT ||
        hatFrame[i].y2 < y2 - JITTER_LIMIT) {

        console.log("resize");
        hatFrame[i].src.delete();
        hatFrame[i].mask.delete();
        hatFrame.splice(i, 1, { x1: x1, x2: x2, y1: y1, y2: y2 });
        calculateHatCoordinates(scaledWidth, scaledHeight, i);
      }
      console.log(hatFrame[i]);
      hatFrame[i].src.copyTo(src.rowRange(hatFrame[i].y1, hatFrame[i].y2)
        .colRange(hatFrame[i].x1, hatFrame[i].x2), hatFrame[i].mask);
    }
    // draw output video
    cv.imshow('canvasOutput', src);

    // schedule the next processing
    let delay = 1000 / FPS - (Date.now() - begin);
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