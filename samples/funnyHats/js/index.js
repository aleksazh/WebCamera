let utils = new Utils('errorMessage');
//let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');
let streaming = false;
let src = null;
let cap = null;
let faces = null;
let classifier = null;
const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';


const FPS = 30;
function startVideoProcessing() {
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  gray = new cv.Mat();
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
      gray.delete();
      faces.delete();
      classifier.delete();
      return;
    }
    stats.begin();
    let begin = Date.now();
    // start processing
    cap.read(src);
    hatSrc = hats[currentHat].src.clone();
    mask = hats[currentHat].mask.clone();
    // detect faces
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    classifier.detectMultiScale(gray, faces,
      1.1, 3); // scaleFactor=1.1, minNeighbors=3
    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      // draw hat
      let scaledWidth = parseInt(hats[currentHat].scale * face.width);
      let scaledHeight = parseInt(hats[currentHat].scale * face.width);
      let yOffset = Number(hats[currentHat].yOffset);
      cv.resize(hatSrc, hatSrc, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
      cv.resize(mask, mask, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_LINEAR);
      let y2 = face.y + Math.round(yOffset * face.height);
      let y1 = y2 - hatSrc.rows;
      let x1 = face.x + parseInt(face.width / 2 - hatSrc.cols / 2);
      let x2 = x1 + hatSrc.cols;
      console.log(face.width, face.height);
      if (x2 < video.width && y1 >= 0) {
        hatSrc.copyTo(src.rowRange(y1, y2).colRange(x1, x2), mask);
      } else if (y1 < 0) {
        let hatRoi = hatSrc.roi(new cv.Rect(0, -y1, scaledWidth, hatSrc.cols + y1));
        let maskRoi = mask.roi(new cv.Rect(0, -y1, scaledWidth, mask.cols + y1));
        hatRoi.copyTo(src.rowRange(0, y2).colRange(x1, x2), maskRoi);
        hatRoi.delete(); maskRoi.delete();
      }
      //hatSrc.copyTo(src.rowRange(0, hatSrc.rows).colRange(0, hatSrc.cols), mask);
      let point1 = new cv.Point(face.x, face.y);
      let point2 = new cv.Point(face.x + face.width, face.y + face.height);
      cv.rectangle(src, point1, point2, [0, 255, 0, 255]);
    }
    hatSrc.delete();
    mask.delete();
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