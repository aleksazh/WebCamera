let width = 0;
let height = 0;

// whether streaming video from the camera.
let streaming = false;

let video = document.getElementById('video');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');
let stream = null;
let vc = null;

let sharedBuffer;

function startCamera() {
  if (streaming) return;
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function (s) {
      stream = s;
      video.srcObject = s;
      video.play();
    })
    .catch(function (err) {
      console.log("An error occured! " + err);
    });

  video.addEventListener("canplay", function (ev) {
    if (!streaming) {
      width = video.videoWidth;
      height = video.videoHeight;
      video.width = width;
      video.height = height;
      canvasOutput.width = width;
      canvasOutput.height = height;
      sharedBuffer = new SharedArrayBuffer(width * height * 4);
      streaming = true;
    }
    startVideoProcessing();
  }, false);
}

let profileFaceClassifier = null;
let eyeClassifier = null;
let faces = 0;

let src = null;
let worker = null;

function startVideoProcessing() {
  if (!streaming) { console.warn("Please startup your webcam"); return; }
  stopVideoProcessing();
  vc = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  vc.read(src);
  cv.imshow('canvasOutput', src);
  //sharedBuffer = canvasContext.getImageData(0, 0, video.width, video.height).data.buffer;
  let arr = new Uint8Array(sharedBuffer);
  let imageData = canvasContext.getImageData(0, 0, video.width, video.height).data.buffer;
  for (let i = 0; i < imageData.byteLength; ++i) {
    arr[i] = imageData[i];
  }
  worker.postMessage({ cmd: 'init', width: width, height: height, buffer: sharedBuffer });
  requestAnimationFrame(processVideo);
}

function processVideo() {
  stats.begin();
  vc.read(src);
  for (let i = 0; i < faces.length; ++i) {
    let face = faces[i];
    // Draw face.
    let facePointUpperLeft = new cv.Point(face.x, face.y);
    let facePointBottomRight =
      new cv.Point(face.x + face.width, face.y + face.height);
    cv.rectangle(src, facePointUpperLeft, facePointBottomRight, [255, 0, 0, 255]);
  }
  cv.imshow('canvasOutput', src);
  requestAnimationFrame(processVideo);
}

function onVideoProcessed(msg) {
  switch (msg.data.response) {
    case 'detect': {
      faces = msg.data.objects;
      console.log('main thread ' + faces.length);
      let arr = new Uint8Array(sharedBuffer);
      let imageData = canvasContext.getImageData(0, 0, video.width, video.height).data.buffer;
      for (let i = 0; i < imageData.byteLength; ++i) {
        arr[i] = imageData[i];
      }
      worker.postMessage({ cmd: 'detect' });
      break;
    }
    default:
      throw ('invalid command from worker');
  }
  stats.end();
  requestAnimationFrame(processVideo);
}

function stopVideoProcessing() {
  if (src != null && !src.isDeleted()) src.delete();
}

function stopCamera() {
  if (!streaming) return;
  stopVideoProcessing();
  document.getElementById("canvasOutput").getContext("2d").clearRect(0, 0, width, height);
  video.pause();
  video.srcObject = null;
  stream.getVideoTracks()[0].stop();
  streaming = false;
}

function initUI() {
  stats = new Stats();
  stats.showPanel(0);
  document.getElementById('container').appendChild(stats.dom);
}

function initWorkers() {
  let blob = new Blob(
    Array.prototype.map.call(
      document.querySelectorAll('script[type="text\/js-worker"]'),
      function (script) { return script.textContent; }
    ),
    { type: 'text/javascript' }
  );

  worker = new Worker(window.URL.createObjectURL(blob));

  worker.addEventListener('message', (msg) => { onWorkerMessage(msg); }, false);
}

function onWorkerMessage(msg) {
  if (msg.data.response === 'init_ok')
    startCamera();
  else {
    onVideoProcessed(msg);
  }
}

function opencvIsReady() {
  console.log('OpenCV.js is ready for main thread');
  initUI();
  initWorkers();
}
