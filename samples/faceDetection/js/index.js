let utils = new Utils('errorMessage');

let stats = null;
const FPS = 30;
//let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasWorker = document.getElementById('canvasWorker');
let canvasContext = canvasOutput.getContext('2d');
//let offscreen = canvasOutput.transferControlToOffscreen();
let offscreen;

let streaming = false;
let src = null;
let dst = null;
let cap = null;
let faces = null;
let frameBGR = null;

let classifier = null;
let genderNet = null;
let ageNet = null;
let gender = "";
let age;
let genderWorker;

const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'classifiers/haarcascade_frontalface_default.xml';
const genderProtoPath = 'deploy_gender.prototxt';
const genderProtoUrl = 'classifiers/deploy_gender.prototxt';
const genderModelPath = 'gender_net.caffemodel';
const genderModelUrl = 'classifiers/gender_net.caffemodel';
const ageProtoPath = 'deploy_age.prototxt';
const ageProtoUrl = 'classifiers/deploy_age.prototxt';
const ageModelPath = 'age_net.caffemodel';
const ageModelUrl = 'classifiers/age_net.caffemodel';

const ageList = [
  '(0 - 2)', '(4 - 6)', '(8 - 12)', '(15 - 20)',
  '(25 - 32)', '(38 - 43)', '(48 - 53)', '(60 - 100)'];
const color = [0, 255, 255, 255];

function startVideoProcessing() {
  stats = new Stats();
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  frameBGR = new cv.Mat(video.height, video.width, cv.CV_8UC3);
  cap = new cv.VideoCapture(video);
  faces = new cv.RectVector();
  classifier = new cv.CascadeClassifier();

  stats.showPanel(0);
  document.body.appendChild(stats.domElement);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.top = '0px';
  // load pre-trained classifier for face detection
  classifier.load(faceDetectionPath);
  // schedule the first processing
  setTimeout(processVideo, 0);
}

function processVideo() {
  try {
    if (!streaming) {
      // clean and stop
      src.delete();
      dst.delete();
      frameBGR.delete();
      faces.delete();
      classifier.delete();
      return;
    }
    stats.begin();
    let begin = Date.now();
    // start processing
    cap.read(src);
    src.copyTo(dst);
    cv.cvtColor(dst, frameBGR, cv.COLOR_RGBA2BGR);
    // detect faces
    classifier.detectMultiScale(frameBGR, faces,
      1.1, 3); // scaleFactor=1.1, minNeighbors=3
    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      let label = gender;
      cv.putText(dst, label, { x: face.x, y: face.y - 10 },
        cv.FONT_HERSHEY_SIMPLEX,
        0.6, color, 2, cv.LINE_4); // fontScale=0.6, thickness=2
      // draw face
      let point1 = new cv.Point(face.x, face.y);
      let point2 = new cv.Point(face.x + face.width, face.y + face.height);
      cv.rectangle(dst, point1, point2, color);

    }
    cv.imshow('canvasOutput', dst);
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
  // var canvasWorkerContext = canvasWorker.getContext('2d');
  // canvasWorkerContext.drawImage(canvasOutput, 0, 0);
  // canvasWorkerContext.commit();

  //offscreen = canvasWorker.transferControlToOffscreen();
  //genderWorker.postMessage({ canvas: offscreen }, [offscreen]);
  //let imageData = canvasContext.createImageData(video.width, video.height);
  //genderWorker.postMessage({ image: imageData });

  genderWorker.onmessage = function (e) {
    gender = e.data;
    // var canvasWorkerContext = canvasWorker.getContext('2d');
    // canvasWorkerContext.drawImage(canvasOutput, 0, 0);
    // canvasWorkerContext.commit();

    //offscreen = canvasOutput.transferControlToOffscreen();
    //genderWorker.postMessage({ canvas: offscreen }, [offscreen]);
    let imageData = canvasContext.createImageData(video.width, video.height);
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
  document.getElementById('status').innerHTML =
    'Loading haarcascade_frontalface_default.xml';
  utils.createFileFromUrl(faceDetectionPath, faceDetectionUrl, () => {
    document.getElementById('status').innerHTML = '';
    startCamera();
  });
});