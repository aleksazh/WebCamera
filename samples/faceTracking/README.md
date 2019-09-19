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

1. [Tensorflow faca detection model (pb and pbtxt files)](https://github.com/spmallick/learnopencv/tree/master/FaceDetectionComparison/models)
2. [Face Detection with OpenCV using DNN](http://datahacker.rs/j-face-detection-with-opencv/)
3. [readNetFromTensorflow() example for MobileNet model](https://github.com/opencv/opencv/issues/12075#issuecomment-420191142)
4. [OpenCV tutorial 'How to run deep networks in browser'](https://docs.opencv.org/master/d5/d86/tutorial_dnn_javascript.html)
5. [Example of Face landmark detection in Intel's webml-polyfill project](https://github.com/intel/webml-polyfill/issues/373)
6. [Landmark Detection Model from Intel's webml-polyfill project](https://github.com/intel/webml-polyfill/blob/master/examples/facial_landmark_detection/model/README.md)
7. [Dataset for face alignment](http://www.cbsr.ia.ac.cn/users/xiangyuzhu/projects/3DDFA/main.htm)
8. [Convert mat file to json](https://gist.github.com/pgoeser/1392506)
9.[Optimizing TensorFlow Models for Serving](https://medium.com/google-cloud/optimizing-tensorflow-models-for-serving-959080e9ddbf)
10.[Check implemented tensorflow model operations in tf_importer.cpp OpenCV source file](https://github.com/opencv/opencv/blob/a7b954f6551e62ead3b5ac4ab5b34da3da6b3b43/modules/dnn/src/tensorflow/tf_importer.cpp)
11.[Unsupported operations in model import from tensorflow to OpenCV](https://github.com/opencv/opencv/issues/14312#issuecomment-483627453)
12.[Custom deep learning layers support in OpenCV](https://docs.opencv.org/master/dc/db1/tutorial_dnn_custom_layers.html)