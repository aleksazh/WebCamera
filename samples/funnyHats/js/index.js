let utils = new Utils('errorMessage');
let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
//let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');
let streaming = false;
let src = null;
let cap = null;
let faces = null;
let eyes = null;
let faceCascade = null;
let eyeCascade = null;
let hatDst = null;
let hatMaskDst = null;
let hatFrames = []; // last drawn hat frame for each face
let glassesDst = null;
let glassesMaskDst = null;
let glassesFrames = []; // last drawn glasses frame for each face
let width = 0;
let height = 0;

const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';
const eyeDetectionPath = 'haarcascade_eye.xml';
const eyeDetectionUrl = 'resources/haarcascade_eye.xml';
const JITTER_LIMIT = 3;


const FPS = 30;
function startVideoProcessing() {
  src = new cv.Mat(height, width, cv.CV_8UC4);
  gray = new cv.Mat();
  cap = new cv.VideoCapture(video);
  faces = new cv.RectVector();
  faceCascade = new cv.CascadeClassifier();
  faceCascade.load(faceDetectionPath);
  eyes = new cv.RectVector();
  eyeCascade = new cv.CascadeClassifier();
  eyeCascade.load(eyeDetectionPath);
  hatDst = new cv.Mat();
  hatMaskDst = new cv.Mat();
  glassesDst = new cv.Mat();
  glassesMaskDst = new cv.Mat();
  setTimeout(processVideo, 0);
}

function deleteObjectsForOldFaces() {
  if (hatFrames.length > faces.size() && faces.size() > 0) {
    for (let i = faces.size(); i < hatFrames.length; ++i) {
      hatFrames[i].src.delete();
      hatFrames[i].mask.delete();
      glassesFrames[i].src.delete();
      glassesFrames[i].mask.delete();
    }
    hatFrames.length = faces.size();
    glassesFrames.length = faces.size();
  }
}

function replaceOldHatFrame(i, coords) {
  hatFrames[i].src.delete();
  hatFrames[i].mask.delete();
  hatFrames.splice(i, 1, coords);
}

function getHatCoords(face) {
  let scaledWidth = parseInt(hatsData[currentHat].scale * face.width);
  let scaledHeight = parseInt(scaledWidth *
    (hatsData[currentHat].src.rows / hatsData[currentHat].src.cols));
  let yOffset = Number(hatsData[currentHat].yOffset);
  let y2 = face.y + Math.round(yOffset * face.height);
  let y1 = y2 - scaledHeight;
  let x1 = face.x + parseInt(face.width / 2 - scaledWidth / 2);
  let x2 = x1 + scaledWidth;
  if (y1 < 0) y1 = 0;
  return {
    width: scaledWidth, height: scaledHeight,
    coords: { x1: x1, x2: x2, y1: y1, y2: y2, show: true }
  };
}

function resizeHat(scaledWidth, scaledHeight, i) {
  cv.resize(hatSrc, hatDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
  cv.resize(hatMask, hatMaskDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
  let hat = hatFrames[i];
  if (hat.y1 > 0 && hat.y2 < height && hat.x2 < width && hat.x1 >= 0) {
    // copy full image of hat
    hat.src = hatDst.clone();
    hat.mask = hatMaskDst.clone();
  } else if (hat.y1 == 0 && hat.y2 < height && hat.x2 < width && hat.x1 >= 0) {
    // copy the part of the hat that is below y=0
    hat.src = hatDst.roi(new cv.Rect(0, scaledHeight - hat.y2, scaledWidth, hat.y2));
    hat.mask = hatMaskDst.roi(new cv.Rect(0, scaledHeight - hat.y2, scaledWidth, hat.y2));
  } else {
    // notify not to draw hat
    hat.show = false;
    hat.src = new cv.Mat();
    hat.mask = new cv.Mat();
  }
}

function exceedJitterLimit(i, coords) {
  if (hatFrames[i].x1 > coords.x1 + JITTER_LIMIT ||
    hatFrames[i].x1 < coords.x1 - JITTER_LIMIT ||
    hatFrames[i].y1 > coords.y1 + JITTER_LIMIT ||
    hatFrames[i].y1 < coords.y1 - JITTER_LIMIT ||
    hatFrames[i].x2 > coords.x2 + JITTER_LIMIT ||
    hatFrames[i].x2 < coords.x2 - JITTER_LIMIT ||
    hatFrames[i].y2 > coords.y2 + JITTER_LIMIT ||
    hatFrames[i].y2 < coords.y2 - JITTER_LIMIT)
    return true;
  else return false;
}

function detectEyes(face) {
  let faceGray = gray.roi(face);
  eyeCascade.detectMultiScale(faceGray, eyes);
  faceGray.delete();
}

function resizeGlasses(scaledWidth, scaledHeight, i) {
  cv.resize(glassesSrc, glassesDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
  cv.resize(glassesMask, glassesMaskDst, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
  glassesFrames[i].src = glassesDst.clone();
  glassesFrames[i].mask = glassesMaskDst.clone();
}

function getGlassesCoords(leftEye, rightEye,face) {
  let eyesWidth = eyes.get(rightEye).x + eyes.get(rightEye).width - eyes.get(leftEye).x;
  let scaledWidth = parseInt(glassesData[currentGlasses].scale * eyesWidth);
  let scaledHeight = parseInt(scaledWidth *
    (glassesData[currentGlasses].src.rows / glassesData[currentGlasses].src.cols));
  let yOffset = Number(glassesData[currentGlasses].yOffset);
  let y1 = face.y + eyes.get(leftEye).y - Math.round(yOffset * eyes.get(leftEye).height);
  let y2 = y1 + scaledHeight;
  let x1 = face.x + eyes.get(leftEye).x + parseInt(eyesWidth / 2 - scaledWidth / 2);
  let x2 = x1 + scaledWidth;
  return {
    width: scaledWidth, height: scaledHeight,
    coords: { x1: x1, x2: x2, y1: y1, y2: y2, show: true }
  };
}

function processGlasses(i, face, option) {
  detectEyes(face);
  let show = true;
  if (eyes.size() < 2)
    show = false;
  else {
    let leftEye = 0;
    let rightEye = 1;
    if (eyes.get(0).x > eyes.get(1).x)
      leftEye = 1; rightEye = 0;
    let glasses = getGlassesCoords(leftEye, rightEye, face);
    // check that glasses coords are in the canvas window
    if (glasses.coords.y1 > 0 && glasses.coords.y2 < height &&
      glasses.coords.x2 < width && glasses.coords.x1 >= 0) {
      if (option == "new")
        glassesFrames.splice(i, 0, glasses.coords);
      else { // replace if not new
        glassesFrames[i].src.delete();
        glassesFrames[i].mask.delete();
        glassesFrames.splice(i, 1, glasses.coords);
      }
      resizeGlasses(glasses.width, glasses.height, i);
    } else
      show = false;
  }
  if (!show) {
    if (option == "new")
      glassesFrames.splice(i, 0, { show: show });
    else { // replace if not new
      glassesFrames[i].src.delete();
      glassesFrames[i].mask.delete();
      glassesFrames.splice(i, 1, { show: show });
    }
    glassesFrames[i].src = new cv.Mat();
    glassesFrames[i].mask = new cv.Mat();
  }
}

function processVideo() {
  try {
    if (!streaming) {
      // clean and stop
      src.delete(); gray.delete();
      hatDst.delete(); hatMaskDst.delete();
      glassesDst.delete(); glassesMaskDst.delete();
      faces.delete(); faceCascade.delete();
      eyes.delete(); eyeCascade.delete();
      deleteHats(); deleteGlasses();
      return;
    }
    stats.begin();
    let begin = Date.now();
    cap.read(src);
    // detect faces
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    let scaleFactor = 1.1;
    let minNeighbors = 3;
    faceCascade.detectMultiScale(gray, faces, scaleFactor, minNeighbors);
    deleteObjectsForOldFaces();
    // draw hat for each face
    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      let hat = getHatCoords(face);
      if (!hatFrames[i]) {
        // create new hat frame and glasses frame
        hatFrames.splice(i, 0, hat.coords);
        resizeHat(hat.width, hat.height, i);
        processGlasses(i, face, "new");
      } else if (exceedJitterLimit(i, hat.coords) || objectChanged) {
        objectChanged = false;
        replaceOldHatFrame(i, hat.coords);
        resizeHat(hat.width, hat.height, i);
        if (!glassesFrames[i])
          processGlasses(i, face, "new");
        else
          processGlasses(i, face, "replace");
      }
      if (hatFrames[i].show)
        hatFrames[i].src.copyTo(src.rowRange(hatFrames[i].y1, hatFrames[i].y2)
          .colRange(hatFrames[i].x1, hatFrames[i].x2), hatFrames[i].mask);
      if (glassesFrames[i].show)
        glassesFrames[i].src.copyTo(src.rowRange(glassesFrames[i].y1, glassesFrames[i].y2)
          .colRange(glassesFrames[i].x1, glassesFrames[i].x2), glassesFrames[i].mask);
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
  resizeTabSet();
  // remove "disabled" attr from the second input tab
  document.getElementById("glassesTab").removeAttribute("disabled");
  startVideoProcessing();
}

function onVideoStopped() {
  streaming = false;
  canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
}

utils.loadOpenCv(() => {
  utils.createFileFromUrl(faceDetectionPath, faceDetectionUrl, () => {
    utils.createFileFromUrl(eyeDetectionPath, eyeDetectionUrl, () => {
      initUI();
      startCamera();
    });
  });
});