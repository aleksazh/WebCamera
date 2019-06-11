importScripts('../../../build/wasm/opencv.js')

let canvas;
let image;
let canvasContext = null;

let streaming = false;
let src = null;
let faces = null;
let frameBGR = null;

let classifier = null;
let ageNet = null;
let gender = "";
let age;

const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = '../classifiers/haarcascade_frontalface_default.xml';
const genderProtoPath = 'deploy_gender.prototxt';
const genderProtoUrl = '../classifiers/deploy_gender.prototxt';
const genderModelPath = 'gender_net.caffemodel';
const genderModelUrl = '../classifiers/gender_net.caffemodel';
const ageProtoPath = 'deploy_age.prototxt';
const ageProtoUrl = '../classifiers/deploy_age.prototxt';
const ageModelPath = 'age_net.caffemodel';
const ageModelUrl = '../classifiers/age_net.caffemodel';

const genderList = ['Male', 'Female'];
const ageList = [
  '(0 - 2)', '(4 - 6)', '(8 - 12)', '(15 - 20)',
  '(25 - 32)', '(38 - 43)', '(48 - 53)', '(60 - 100)'];
const MODEL_MEAN_VALUES = [78.4263377603, 87.7689143744, 114.895847746, 0];
const prototxtWidth = 227;
const prototxtHeight = 227;

self.onmessage = function (e) {
  // try {
  //   if (!streaming) {
  //     // clean and stop
  //     src.delete();
  //     frameBGR.delete();
  //     faces.delete();
  //     classifier.delete();
  //     return;
  //   }
  // get image from canvas
  //canvas = e.data.canvas;
  image = e.data.image;
  //canvasContext = canvas.getContext('2d');
  //let imgData = canvasContext.getImageData(0, 0,
  //  canvas.width, canvas.height);
  src = cv.matFromImageData(image);
  //src = cv.imread(image);
  cv.cvtColor(src, frameBGR, cv.COLOR_RGBA2BGR);
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
    gender = genderList[
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
  if (faces.size() == 0) {
    self.postMessage("");
  }
  // } catch (err) {
  // }
};

function createFileFromUrl(path, url, callback) {
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
        frameBGR = new cv.Mat(240, 320, cv.CV_8UC3);
        faces = new cv.RectVector();
        classifier = new cv.CascadeClassifier();
        classifier.load(faceDetectionPath);
        self.postMessage("");
      });
    });
  });
});
