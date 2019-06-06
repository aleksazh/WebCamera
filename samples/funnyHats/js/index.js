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
    hatSrc = hats[currentHat].src;
    mask = hats[currentHat].mask;
    // detect faces
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    classifier.detectMultiScale(gray, faces,
      1.1, 3); // scaleFactor=1.1, minNeighbors=3
    for (let i = 0; i < faces.size(); ++i) {
      let face = faces.get(i);
      // draw hat
      cv.resize(hatSrc, hatSrc, new cv.Size(100, 100), 0, 0, cv.INTER_LINEAR);
      cv.resize(mask, mask, new cv.Size(100, 100), 0, 0, cv.INTER_LINEAR);
      let y1 = face.y - hatSrc.rows + Math.round(0.2 * face.height);
      let y2 = face.y + Math.round(0.2 * face.height);
      let x = hatSrc.cols + face.x;
      if (x < video.width && y1 >= 0) {
        hatSrc.copyTo(src.rowRange(y1, y2).colRange(face.x, x), mask);
      } else if (y1 < 0) {
        let hatRoi = hatSrc.roi(new cv.Rect(0, -y1, 100, hatSrc.cols + y1));
        let maskRoi = mask.roi(new cv.Rect(0, -y1, 100, mask.cols + y1));
        hatRoi.copyTo(src.rowRange(0, y2).colRange(face.x, x), maskRoi);
        hatRoi.delete(); maskRoi.delete();
      }
      //hatSrc.copyTo(src.rowRange(0, hatSrc.rows).colRange(0, hatSrc.cols), mask);
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