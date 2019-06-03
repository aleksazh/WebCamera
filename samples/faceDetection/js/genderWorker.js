importScripts('../../filters/js/utils.js', '../../../build/wasm/opencv.js')

//let utils = new Utils('errorMessage');

const FPS = 30;
let resolution = 'vga'; // !!!! TODO
let video;

let streaming = false;
let src = null;
let dst = null;
let cap = null;
let faces = null;
let frameBGR = null;

let classifier = null;
let ageNet = null;
let gender;
let age;

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
const prototxtWidth = 227;
const prototxtHeight = 227;
const color = [0, 255, 255, 255];

// listen to messages from main thread
self.onmessage = function (e) {
  serializedVideo = e.data;
  domparser = new DOMParser ();
  video = domparser.parseFromString (serializedVideo, "text/xml");
}

function startVideoProcessing() {
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  frameBGR = new cv.Mat(video.height, video.width, cv.CV_8UC3);
  cap = new cv.VideoCapture(video);
  faces = new cv.RectVector();
  classifier = new cv.CascadeClassifier();

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
      self.postMessage(gender);
      // detect age
      /*ageNet.setInput(blob);
      let agePreds = ageNet.forward();
      let age = ageList[
        agePreds.data32F.indexOf(Math.max(...agePreds.data32F))];
      // add label with gender and age to face
      let label = gender + " " + age;*/

      faceFrame.delete();
      genderPreds.delete();
      //agePreds.delete();
      blob.delete();
    }
    // schedule the next processing
    let delay = 1000 / FPS - (Date.now() - begin);
    setTimeout(processVideo, delay);
  } catch (err) {
    //utils.printError(err);
  }
};


function onVideoStarted() {
  streaming = true;
  video.width = video.videoWidth;
  video.height = video.videoHeight;
  startVideoProcessing();
}

function onVideoStopped(stream) {
  if (video) {
    video.pause();
    video.srcObject = null;
    video.removeEventListener('canplay', onVideoCanPlay);
  }
  if (stream) {
    stream.getVideoTracks()[0].stop();
  }
  streaming = false;
}

function startCamera (resolution) {
  if (!streaming) {
    const constraints = {
      'qvga': { width: { exact: 320 }, height: { exact: 240 } },
      'vga': { width: { exact: 640 }, height: { exact: 480 } }
    };
    let videoConstraint = constraints[resolution];
    if (!videoConstraint) {
      videoConstraint = true;
    }

    navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false })
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
        //self.video = video;
        //self.stream = stream;
        //self.onCameraStartedCallback = callback;
        video.addEventListener('canplay', onVideoCanPlay, false);
      })
      .catch(function (err) {
        //self.printError('Camera Error: ' + err.name + ' ' + err.message);
      });
    onVideoStarted();

  } else {
    onVideoStopped(video.srcObject);
  }
};

function createFileFromUrl (path, url, callback) {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function (ev) {
    if (request.readyState === 4) {
      if (request.status === 200) {
        let data = new Uint8Array(request.response);
        cv.FS_createDataFile('/', path, data, true, false, false);
        callback();
      }
      //else {
      //  self.printError('Failed to load ' + url + ' status: ' + request.status);
      //}
    }
  };
  request.send();
};

createFileFromUrl(genderProtoPath, genderProtoUrl, () => {
  createFileFromUrl(genderModelPath, genderModelUrl, () => {
    // read gender network into genderNet
    genderNet = cv.readNetFromCaffe(genderProtoPath, genderModelPath);
    createFileFromUrl(ageProtoPath, ageProtoUrl, () => {
      createFileFromUrl(ageModelPath, ageModelUrl, () => {
        // read age network into ageNet
        ageNet = cv.readNetFromCaffe(ageProtoPath, ageModelPath);
        createFileFromUrl(faceDetectionPath, faceDetectionUrl, () => {
          startCamera(resolution);
        });
      });
    });
  });
});