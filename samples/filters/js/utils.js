function Utils(errorOutputId) { // eslint-disable-line no-unused-vars
  let self = this;
  this.errorOutput = document.getElementById(errorOutputId);

  const OPENCV_URL = '../../build/wasm/opencv.js';
  this.loadOpenCv = function(onloadCallback) {
    let script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('type', 'text/javascript');
    script.addEventListener('load', () => {
      if (cv.getBuildInformation)
      {
        console.log(cv.getBuildInformation());
        onloadCallback();
      }
      else
      {
        // WASM
        cv['onRuntimeInitialized']=()=>{
          console.log(cv.getBuildInformation());
          onloadCallback();
        }
      }
    });
    script.addEventListener('error', () => {
      self.printError('Failed to load ' + OPENCV_URL);
    });
    script.src = OPENCV_URL;
    let node = document.getElementsByTagName('script')[0];
    node.parentNode.insertBefore(script, node);
  };

  this.clearError = function() {
    this.errorOutput.innerHTML = '';
  };

  this.printError = function(err) {
    if (typeof err === 'undefined') {
      err = '';
    } else if (typeof err === 'number') {
      if (!isNaN(err)) {
        if (typeof cv !== 'undefined') {
          err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
        }
      }
    } else if (typeof err === 'string') {
      let ptr = Number(err.split(' ')[0]);
      if (!isNaN(ptr)) {
        if (typeof cv !== 'undefined') {
          err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
        }
      }
    } else if (err instanceof Error) {
      err = err.stack.replace(/\n/g, '<br>');
    }
    this.errorOutput.innerHTML = err;
  };

  function onVideoCanPlay() {
    if (self.onCameraStartedCallback) {
      self.onCameraStartedCallback(self.stream, self.video);
    }
  };

  this.startCamera = function(callback, videoId) {
    const constraints = {
      'vga': {width: {exact: 640}, height: {exact: 480}}};
    let video = document.getElementById(videoId);
    if (!video) {
      video = document.createElement('video');
    }
    
    navigator.mediaDevices.getUserMedia({video: constraints['vga'], audio: false})
      .then(function(stream) {
        video.srcObject = stream;
        video.play();
        self.video = video;
        self.stream = stream;
        self.onCameraStartedCallback = callback;
        video.addEventListener('canplay', onVideoCanPlay, false);
      })
      .catch(function(err) {
        self.printError('Camera Error: ' + err.name + ' ' + err.message);
      });
  };

  this.stopCamera = function() {
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video.removeEventListener('canplay', onVideoCanPlay);
    }
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop();
    }
  };
};
