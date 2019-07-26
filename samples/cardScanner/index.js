let utils = new Utils('errorMessage');

utils.loadOpenCv(() => {
  let cardImg = cv.imread('cardImage');

  // Load the reference OCR-A image from disk, convert it to grayscale,
  // and threshold it, such that the digits appear as *white* on a
  // *black* background and invert it, such that the digits appear
  // as *white* on a *black*.
  let digitsImg = cv.imread('ocrDigitsImage');
  cv.cvtColor(digitsImg, digitsImg, cv.COLOR_BGR2GRAY);
  cv.threshold(digitsImg, digitsImg, 10, 255, cv.THRESH_BINARY_INV);

  let canvas = document.createElement('canvas');
  document.getElementsByTagName('body')[0].append(canvas);
  cv.imshow(canvas, digitsImg);

  // Find contours in the OCR-A image (i.e,. the outlines of the digits).
  // Sort them from left to right, and initialize a dictionary to map
  // digit name to the ROI.
  let ocrContours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let dst = cv.Mat.zeros(digitsImg.rows, digitsImg.cols, cv.CV_8UC3);
  cv.findContours(digitsImg, ocrContours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  //refCnts = ocrContours.sort_contours(refCnts, method="left-to-right")[0]

  for (let i = 0; i < ocrContours.size(); ++i) {
    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
      Math.round(Math.random() * 255));
    cv.drawContours(dst, ocrContours, i, color, 1, cv.LINE_8, hierarchy, 100);
  }
  canvas = document.createElement('canvas');
  document.getElementsByTagName('body')[0].append(canvas);
  cv.imshow(canvas, dst);
  ocrContours.delete(); hierarchy.delete(); dst.delete();


  // Loop over the OCR-A reference contours.
  let digits = {};

//for (i, c) in enumerate(refCnts):
	// Compute the bounding box for the digit, extract it, and resize
	// it to a fixed size.
//	(x, y, w, h) = cv2.boundingRect(c)
//	roi = ref[y:y + h, x:x + w]
//	roi = cv2.resize(roi, (57, 88))

	// Update the digits dictionary, mapping the digit name to the ROI.
	digits[i] = roi

});
