const constraints_general = {
  "video": {
    width: {
      exact: 640
    }
  }
};

const constraints_mobile = {
  video: {
    facingMode: { exact: "environment" },
    width: {
      exact: 640
    }
  }
};

const NUMBER_OF_PHOTOS = 4;

var videoTag = document.getElementById('video-tag');

var takePhotoCanvas1 = document.getElementById('takePhotoCanvas1');
var takePhotoCanvas2 = document.getElementById('takePhotoCanvas2');
var takePhotoCanvas3 = document.getElementById('takePhotoCanvas3');
var takePhotoCanvas4 = document.getElementById('takePhotoCanvas4');
var takePhotoCanvasArray = new Array(takePhotoCanvas1, takePhotoCanvas2,
  takePhotoCanvas3, takePhotoCanvas4);
var images_list = new Array(NUMBER_OF_PHOTOS);
var imageHDR = document.getElementById('imageHDR');

var exposureTimeSlider = document.getElementById("exposureTime-slider");
var exposureTimeSliderValue = document.getElementById(
  "exposureTime-slider-value");
var takePhotoButton = document.getElementById('takePhotoButton');
var imageCapturer;
var counter = 0;
var exposureTimeArray = new Float32Array(NUMBER_OF_PHOTOS);
//var exposureTimeArray = new Uint8Array(3);

// Assume there is a list of 4 images at various exposure time.

function startCamera() {
  document.querySelector('#start').style.display = 'none';
  //Right now only chrome on Android and Chrome on Linux/CrOS will work.

  if (navigator.userAgent.match(/Android/i)) {
    navigator.mediaDevices.getUserMedia(constraints_mobile)
      .then(gotMedia)
      .catch(e => {
        console.error('getUserMedia() failed: ', e);
      });
  } else {
    navigator.mediaDevices.getUserMedia(constraints_general)
      .then(gotMedia)
      .catch(e => {
        console.error('getUserMedia() failed: ', e);
      });
  }
}

function gotMedia(mediastream) {
  videoTag.srcObject = mediastream;
  document.getElementById('start').disabled = true;

  var videoTrack = mediastream.getVideoTracks()[0];
  imageCapturer = new ImageCapture(videoTrack);

  // Timeout needed in Chrome, see https://crbug.com/711524
  setTimeout(() => {
    const capabilities = videoTrack.getCapabilities()
    // Check whether exposureTime is supported or not.
    if (!capabilities.exposureTime) {
      return;
    }

    exposureTimeSlider.min = capabilities.exposureTime.min;
    exposureTimeSlider.max = 200;
    exposureTimeSlider.step = 1;

    exposureTimeSlider.value = exposureTimeSliderValue.value =
      videoTrack.getSettings().exposureTime;
    exposureTimeSliderValue.value = exposureTimeSlider.value;

    exposureTimeSlider.oninput = function () {
      exposureTimeSliderValue.value = exposureTimeSlider.value;
      videoTrack.applyConstraints({
        advanced: [{
          exposureMode: "manual",
          exposureTime: exposureTimeSlider.value
        }]
      });
    }

  }, 500);
}

// TODO: process HDR in a dedicated worker to not block the main thread
// process HDR
function createHDR() {
  if (counter < NUMBER_OF_PHOTOS) {
    console.log(`${NUMBER_OF_PHOTOS}`, " pictures are needed");
    return;
  }

  console.log("createHDR is called !");

  // STEP 1. Capture multiple images with various exposure levels.
  let src1 = cv.imread(takePhotoCanvas1);
  let src2 = cv.imread(takePhotoCanvas2);
  let src3 = cv.imread(takePhotoCanvas3);
  let src4 = cv.imread(takePhotoCanvas4);
  console.log('image width: ' + src1.cols + '\n' +
    'image height: ' + src1.rows + '\n' +
    'image size: ' + src1.size().width + '*' + src1.size().height +
    '\n' +
    'image depth: ' + src1.depth() + '\n' +
    'image channels ' + src1.channels() + '\n' +
    'image type: ' + src1.type() + '\n');

  let srcArray = new cv.MatVector();
  srcArray.push_back(src1);
  srcArray.push_back(src2);
  srcArray.push_back(src3);
  srcArray.push_back(src4);

  // STEP 2. Align images , need to expose properly in Photo module JS bindings.
  /*
  let alignMTB = new cv.AlignMTB();
  alignMTB.process(srcArray, srcArray);
  console.log("Aligning the images are done !");
  */

  // STEP 3. Estimate Camera Response Function (CRF).
  let response = new cv.Mat();
  let calibration = new cv.CalibrateDebevec();
  // let times = exposureTimeArray.slice();
  let times = new cv.matFromArray(exposureTimeArray.length, 1, cv.CV_32F,
    exposureTimeArray);
  exposureTimeArray.forEach(function (element) {
    console.log(element);
  });

  // process (InputArrayOfArrays src, OutputArray dst, InputArray times)
  console.log("call calibration.process");
  var t0 = performance.now();
  calibration.process(srcArray, response, times);
  var t1 = performance.now();
  console.log("calibration.process took " + (t1 - t0) + " milliseconds.");

  // STEP 4. Merge exposures to HDR image.
  console.log("MergeDebevec is called");
  let hdr_debevec = new cv.Mat();
  let merge_debevec = new cv.MergeDebevec();
  t0 = performance.now();
  merge_debevec.process(srcArray, hdr_debevec, times, response);
  t1 = performance.now();
  console.log("merge_debevec.process took " + (t1 - t0) + " milliseconds.");
  console.log("HDR done !! woooo ");

  let dst = new cv.Mat();
  cv.cvtColor(hdr_debevec, dst, cv.COLOR_BGRA2RGBA, 0);

  // STEP 5. Tonemap HDR image if you don't have HDR screen to display.
  console.log("TonemapReinhard is called");
  let ldr = new cv.Mat();
  let tonemap_reinhard = new cv.TonemapReinhard(gamma = 2.2);
  t0 = performance.now();
  let hdr_debevec_dst = new cv.Mat();
  cv.cvtColor(hdr_debevec, hdr_debevec_dst, cv.COLOR_BGRA2BGR);
  tonemap_reinhard.process(hdr_debevec_dst, ldr);
  t1 = performance.now();
  console.log("tonemap_reinhard took " + (t1 - t0) + " milliseconds.");
  console.log("Tonemapping done !! woooo ");
  // STEP 6. Display
  cv.imshow('outputCanvasLDR', ldr);

  // Fusion : First align and then merge.
  // Align not properly exposed in JS, so ignore the align call now.
  //console.log("MergeMertens is called");
  //let fusion = new cv.Mat();
  //let merge_mertens = new cv.MergeMertens();
  //merge_mertens.process(srcArray, fusion);

  // Convert the tye to cv.CV_8UC4
  let dest = new cv.Mat();

  // Display in canvas.
  /*
  let output_canvas = document.getElementById(outputCanvas);
  let ctx = output_canvas.getContext('2d');

  ctx.clearRect(0, 0, output_canvas.width, output_canvas.height);
  output_canvas.width = imgData.width;
  output_canvas.height = imgData.height;
  ctx.putImageData(imgData, 0, 0);
  */
  // https://github.com/opencv/opencv/issues/13459
  //cv.imwrite('fusion.png', fusion * 255);
  /*
  cv.imwrite('ldr.png', ldr * 255);
  cv.imwrite('hdr.png', hdr * 255);
  cv.imshow('outputCanvas', ldr);
  */
  /* Fix colorspace
   https://docs.opencv.org/3.1.0/d7/d1b/group__imgproc__misc.html
   data read from canvas is a Uint8ClampedArray.
   Mat used here is CV_32F
   */

  //cv.imwrite("hdr.png", hdr_debevec);

  // Cleanup.
  src1.delete();
  src2.delete();
  src3.delete();
  src4.delete();
  srcArray.delete();
  dest.delete();
  hdr_debevec.delete();
  merge_debevec.delete();
  //merge_mertens.delete();
  //fusion.delete();
  ldr.delete();
  tonemap_reinhard.delete();
  dst.delete();
}

function checkCounter() {
  if (counter > NUMBER_OF_PHOTOS) {
    takePhotoButton.text(`${NUMBER_OF_PHOTOS}`, ' pictures taken!');
    takePhotoButton.disabled = true;
    document.getElementById('createHDRButton').disabled = false;
    return false;
  }

  counter++;
  return true;
}

function takePhoto() {
  imageCapturer.takePhoto()
    // https://developers.google.com/web/updates/2016/03/createimagebitmap-in-chrome-50
    .then(blob => createImageBitmap(blob))
    .then((imageBitmap) => {
      if (checkCounter()) {
        drawCanvas(takePhotoCanvasArray[counter - 1], imageBitmap);
        // exposure time values are in 100 µs units.
        exposureTimeArray[counter - 1] = exposureTimeSlider.value / 10000;
        console.log("exposure Time Slider value = ", exposureTimeSlider.value);
        console.log("exposure Time Calculated = ", exposureTimeArray[counter - 1]);
      }
    })
    .catch((err) => {
      console.error("takePhoto() failed: ", err);
    });
}

function initUI() {
  stats = new Stats();
  stats.showPanel(0);
}

function opencvIsReady() {
  console.log('OpenCV.js is ready');
  if (!featuresReady) {
    console.log('Requred features are not ready.');
    return;
  }
  initUI();
  startCamera();
}

/* Utils */

function drawCanvas(canvas, img) {
  canvas.width = getComputedStyle(canvas).width.split('px')[0];
  canvas.height = getComputedStyle(canvas).height.split('px')[0];
  let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
  let x = (canvas.width - img.width * ratio) / 2;
  let y = (canvas.height - img.height * ratio) / 2;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
    x, y, img.width * ratio, img.height * ratio);
}

function addTextToCanvas(text, canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  ctx.font = "14px Arial";
  ctx.fillStyle = "gray";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}