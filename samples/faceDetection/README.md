# Goal



```javascript
  let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let gray = new cv.Mat();
  let faces = new cv.RectVector();
  let classifier = new cv.CascadeClassifier();

  classifier.load('haarcascade_frontalface_default.xml');
  cap.read(src);
  src.copyTo(dst);
  cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
  classifier.detectMultiScale(gray, faces, 1.1, 3, 0);
```

`haarcascade_frontalface_default.xml` file is pre-trained classifiers for face.

Function `detectMultiScale(...)` detects faces. Parameters of the function:

* `gray` is a matrix of the type CV_8U containing an image where objects are detected.
* `faces` is a	vector of rectangles where each rectangle contains the detected object. The rectangles may be partially outside the original image.
* `1.1` is a scaleFactor specifying how much the image size is reduced at each image scale.
* `3` is a parameter specifying how many neighbors each candidate rectangle should have to retain it.
* `0` is a flags parameter with the same meaning for an old cascade as in the function cvHaarDetectObjects. It is not used for a new cascade.