let utils = new Utils('errorMessage');

let stats = null;
const FPS = 30;
let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');

let streaming = false;
let src = null;
let dst = null;
let cap = null;
let faces = null;
let frameBGR = null;

let classifier = null;
let ageNet = null;
let genderNet = null;

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

const genderList = ['Male', 'Female'];
const ageList = [
  '(0 - 2)', '(4 - 6)', '(8 - 12)', '(15 - 20)',
  '(25 - 32)', '(38 - 43)', '(48 - 53)', '(60 - 100)'];
const MODEL_MEAN_VALUES = [78.4263377603, 87.7689143744, 114.895847746, 0];
const color = [0, 255, 255, 255];
const prototxtWidth = 227;
const prototxtHeight = 227;


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
      let faceRect = new cv.Rect(face.x, face.y, face.width, face.height);
      let faceFrame = frameBGR.roi(faceRect);
      let blob = cv.blobFromImage(faceFrame, 1.0, // scalefactor=1.0
        { width: prototxtWidth, height: prototxtHeight },
        MODEL_MEAN_VALUES, false, false); // swapRB=false, crop=false
      // detect gender
      genderNet.setInput(blob);
      let genderPreds = genderNet.forward();
      let gender = genderList[
        genderPreds.data32F.indexOf(Math.max(...genderPreds.data32F))];
      // detect age
      ageNet.setInput(blob);
      let agePreds = ageNet.forward();
      let age = ageList[
        agePreds.data32F.indexOf(Math.max(...agePreds.data32F))];
      // add label with gender and age to face
      let label = gender + " " + age;
      cv.putText(dst, label, { x: face.x, y: face.y - 10 },
        cv.FONT_HERSHEY_SIMPLEX,
        0.6, color, 2, cv.LINE_4); // fontScale=0.6, thickness=2
      // draw face
      let point1 = new cv.Point(face.x, face.y);
      let point2 = new cv.Point(face.x + face.width, face.y + face.height);
      cv.rectangle(dst, point1, point2, color);

      faceFrame.delete();
      genderPreds.delete();
      agePreds.delete();
      blob.delete();
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
  startVideoProcessing();
}

function onVideoStopped() {
  streaming = false;
  canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
}

utils.loadOpenCv(() => {
  utils.createFileFromUrl(genderProtoPath, genderProtoUrl, () => {
    document.getElementById('status').innerHTML =
      'Loading deploy_gender.prototxt';
    utils.createFileFromUrl(genderModelPath, genderModelUrl, () => {
      document.getElementById('status').innerHTML =
        'Loading gender_net.caffemodel';
      // read gender network into genderNet
      genderNet = cv.readNetFromCaffe(genderProtoPath, genderModelPath);
      utils.createFileFromUrl(ageProtoPath, ageProtoUrl, () => {
        document.getElementById('status').innerHTML =
          'Loading deploy_age.prototxt';
        utils.createFileFromUrl(ageModelPath, ageModelUrl, () => {
          document.getElementById('status').innerHTML =
            'Loading age_net.caffemodel';
          // read age network into ageNet
          ageNet = cv.readNetFromCaffe(ageProtoPath, ageModelPath);
          utils.createFileFromUrl(faceDetectionPath, faceDetectionUrl, () => {
            document.getElementById('status').innerHTML =
              'Loading haarcascade_frontalface_default.xml';
            startCamera();
            document.getElementById('status').innerHTML = '';
          });
        });
      });
    });
  });
});