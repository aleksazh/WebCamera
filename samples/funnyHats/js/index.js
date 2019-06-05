let utils = new Utils('errorMessage');
let stats = null;
//let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');
let statsCheckbox = document.getElementById('hideStats');
let streaming = false;
let src = null;
let cap = null;
let faces = null;
let classifier = null;
let imgHat;
let mask = null;
let rgbaVector = null;
const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';

statsCheckbox.addEventListener("change", function () {
  statsCheckbox.checked
  if (document.getElementById('hideStats').checked) {
    stats.domElement.classList.add("hidden");
  } else {
    stats.domElement.classList.remove("hidden");
  }
});

const FPS = 30;
function startVideoProcessing() {
  stats = new Stats();
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  gray = new cv.Mat();
  cap = new cv.VideoCapture(video);
  faces = new cv.RectVector();
  classifier = new cv.CascadeClassifier();
  rgbaVector = new cv.MatVector();

  stats.showPanel(0);
  document.body.appendChild(stats.domElement);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.top = '0px';
  stats.domElement.classList.add("hidden");
  // load pre-trained classifier for face detection
  classifier.load(faceDetectionPath);

  // load hat
  imgHat = cv.imread('hat1');
  cv.resize(imgHat, imgHat, new cv.Size(100, 100), 0, 0, cv.INTER_LINEAR);
  // create mask from alpha channel
  cv.split(imgHat, rgbaVector);
  mask = rgbaVector.get(3).clone();
  rgbaVector.delete();

  // schedule the first processing
  setTimeout(processVideo, 0);
}

function processVideo() {
  try {
    if (!streaming) {
      // clean and stop
      src.delete();
      gray.delete();
      faces.delete();
      classifier.delete();
      mask.delete();
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
    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      // draw hat
      imgHat.copyTo(src.rowRange(face.y-imgHat.rows, face.y).colRange(face.x, imgHat.cols+face.x), mask);
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
}

utils.loadOpenCv(() => {
  utils.createFileFromUrl(faceDetectionPath, faceDetectionUrl, () => {
    startCamera();
  });
});