# Goal

Demonstrate face and eyes detection using Haar-cascade classifier in OpenCV.

## Steps to detect face and eyes

**1. Initialize opencv objects**

```javascript
let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
let gray = new cv.Mat();
let faces = new cv.RectVector();
let eyes = new cv.RectVector();
faceCascade = new cv.CascadeClassifier();
eyeCascade = new cv.CascadeClassifier();
```

**2. Load classifiers**

```javascript
faceCascade.load('haarcascade_frontalface_default.xml');
eyeCascade.load('haarcascade_eye.xml');
```

`haarcascade_frontalface_default.xml` file is pre-trained classifier for face detection which uses Haar Cascade model.
Similarly, 'haarcascade_eye.xml' file is pre-trained classifier for eye detection.


**3. Detect faces**

```javascript
cap.read(src);
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
faceCascade.detectMultiScale(gray, faces, 1.1, 3);
```

OpenCV function `detectMultiScale(...)` detects faces. Arguments of the function:

* `gray` is a matrix of the type CV_8U containing an image where objects are detected.
* `faces` is a	vector of rectangles where each rectangle contains the detected object. The rectangles may be partially outside the original image.
* `1.1` is a scaleFactor specifying how much the image size is reduced at each image scale.
* `3` is a parameter specifying how many neighbors each candidate rectangle should have to retain it.

**4. Detect eyes**

For each face we copy face rectangle and pass it to eye detection classifier:

```javascript
let faceGray = gray.roi(face);
eyeCascade.detectMultiScale(faceGray, eyes, 1.1, 3);
faceGray.delete();
```


## References

1. [](https://github.com/spmallick/learnopencv/tree/master/FaceDetectionComparison/models)
2. [](http://datahacker.rs/j-face-detection-with-opencv/)
3. [](https://github.com/opencv/opencv/issues/12075)
4. [](https://docs.opencv.org/master/d5/d86/tutorial_dnn_javascript.html)
5. [](https://github.com/intel/webml-polyfill/issues/373)
6. [Simple CNN .pb file](https://drive.google.com/file/d/1Nvzu5A9CjP70sDhiRbMzuIwFLnrq2Qpw/view)
7. [](https://github.com/intel/webml-polyfill/blob/master/examples/facial_landmark_detection/model/README.md)
8. [](https://github.com/tensorflow/models/blob/master/research/object_detection/models/ssd_mobilenet_v1_feature_extractor.py)
9. [Dataset for face alignment](http://www.cbsr.ia.ac.cn/users/xiangyuzhu/projects/3DDFA/main.htm)
