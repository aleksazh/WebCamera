let utils = new Utils('errorMessage');

let stats = null;
const FPS = 30;
//let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');

let streaming = false;
let src = null;
let cap = null;

let faceData = { gender: "", age: "", rectangle: { x: 0, y: 0, width: 0, height: 0} };

const ageList = [
  '(0 - 2)', '(4 - 6)', '(8 - 12)', '(15 - 20)',
  '(25 - 32)', '(38 - 43)', '(48 - 53)', '(60 - 100)'];
const color = [0, 255, 255, 255];

function startVideoProcessing() {
  stats = new Stats();
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  cap = new cv.VideoCapture(video);

  stats.showPanel(0);
  document.body.appendChild(stats.domElement);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.top = '0px';
  // schedule the first processing
  setTimeout(processVideo, 0);
}

function processVideo() {
  try {
    if (!streaming) {
      // clean and stop
      src.delete();
      return;
    }
    stats.begin();
    let begin = Date.now();
    // start processing
    cap.read(src);
    // add label with gender and age to a face
    let label = faceData.gender + " " + faceData.age;
    cv.putText(src, label, { x: faceData.rectangle.x, y: faceData.rectangle.y - 10 },
      cv.FONT_HERSHEY_SIMPLEX,
      0.4, color, 1, cv.LINE_4); // fontScale=0.6, thickness=2
    // draw face
    let point1 = new cv.Point(faceData.rectangle.x, faceData.rectangle.y);
    let point2 = new cv.Point(faceData.rectangle.x + faceData.rectangle.width, faceData.rectangle.y + faceData.rectangle.height);
    cv.rectangle(src, point1, point2, color);
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

  // create worker for gender detection
  genderWorker = new Worker("js/genderWorker.js");
  genderWorker.onmessage = function (e) {
    if (e.data.msg != "empty") {
      faceData.gender = e.data.gender;
      faceData.age = e.data.age;
      faceData.rectangle = e.data.rectangle;
    } else {
      faceData.gender = "";
      faceData.age = "";
      faceData.rectangle = { x: 0, y: 0, width: 0, height: 0};
    }
    let imageData = canvasContext.getImageData(0, 0, video.width, video.height);
    genderWorker.postMessage({ image: imageData });
  }

  startVideoProcessing();
}

function onVideoStopped() {
  streaming = false;
  canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
  genderWorker.terminate();
}

document.getElementById('status').innerHTML = 'Loading OpenCV...';
utils.loadOpenCv(() => {
  document.getElementById('status').innerHTML = '';
  startCamera();
});