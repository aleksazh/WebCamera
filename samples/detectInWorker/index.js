let width = 0;
let height = 0;

// whether streaming video from the camera.
let streaming = false;

let video = document.getElementById('video');
let canvasOutput = document.getElementById('canvasOutput');
let canvasOutputCtx = canvasOutput.getContext('2d');
let stream = null;
let vc = null;

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
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      canvasOutput.width = width;
      canvasOutput.height = height;
      streaming = true;
    }
    startVideoProcessing();
  }, false);
}

let = null;
let profileFaceClassifier = null;
let eyeClassifier = null;

let src = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;

let canvasInput = null;
let canvasInputCtx = null;

let worker = null;

function startVideoProcessing() {
  if (!streaming) { console.warn("Please startup your webcam"); return; }
  stopVideoProcessing();
  canvasInput = document.createElement('canvas');
  canvasInput.width = width;
  canvasInput.height = height;
  canvasInputCtx = canvasInput.getContext('2d');
  requestAnimationFrame(processVideo);
}

function processVideo() {
  stats.begin();
  canvasInputCtx.drawImage(video, 0, 0, video.width, video.height);
  let buffer = canvasInputCtx.getImageData(0, 0, canvasInput.width, canvasInput.height).data.buffer;
  worker.postMessage({ cmd: 'detect', buf: buffer, width: canvasInput.width, height: canvasInput.height }, [buffer]);
}

function onVideoProcessed(msg) {
  switch (msg.data.response) {
    case 'passthrough': {
      //let buffer = msg.data.buf;
      //let imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
      //canvasOutputCtx.putImageData(imageData, 0, 0);
      break;
    }
    case 'detect': {
      let objects = msg.data.objects;
      console.log('main thread ' + objects.length);
      //let buffer = msg.data.buf;
      //let imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
      //canvasOutputCtx.putImageData(imageData, 0, 0);
      break;
    }
    default:
      throw ('invalid command from worker');
  }
  stats.end();
  requestAnimationFrame(processVideo);
}

function drawResults(gray, results, dst) {
  for (let i = 0; i < results.size(); ++i) {
    let roiGray = gray.getRoiRect(results.get(i));
    let roiDst = dst.getRoiRect(results.get(i));
    cv.rectangle(dst, { x: results.get(i).x, y: results.get(i).y },
      {
        x: results.get(i).x + results.get(i).width,
        y: results.get(i).y + results.get(i).height
      },
      [255, 0, 0, 255]);
  }
}

function stopVideoProcessing() {
  if (src != null && !src.isDeleted()) src.delete();
  if (dstC1 != null && !dstC1.isDeleted()) dstC1.delete();
  if (dstC3 != null && !dstC3.isDeleted()) dstC3.delete();
  if (dstC4 != null && !dstC4.isDeleted()) dstC4.delete();
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
