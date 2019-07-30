let utils = new Utils('errorMessage');

// Define a dictionary that maps the first digit of a credit card
// Number to the credit card type.
FIRST_NUMBER = {
  "3": "American Express",
  "4": "Visa",
  "5": "MasterCard",
  "6": "Discover Card"
}
const color = [255, 0, 0, 255];

function resize(image, width = 'undefined', height = 'undefined', inter = cv.INTER_AREA) {
  // Initialize the dimensions of the image to be resized and
  // grab the image size.
  let dim;

  // If both the width and height are undefined, then return the
  // original image.
  if (width == 'undefined' && height == 'undefined')
    return image;

  let ratio;
  if (width == 'undefined') {
    // Calculate the ratio of the height and construct the
    // dimensions.
    ratio = height / image.rows;
    dim = new cv.Size(parseInt(image.cols * ratio), height);
  }
  else {
    // calculate the ratio of the width and construct the
    // dimensions
    ratio = width / image.cols;
    dim = new cv.Size(width, parseInt(image.rows * ratio));
  }

  // resize the image
  cv.resize(image, image, dim, interpolation = inter);
}

utils.loadOpenCv(() => {
  // Load the reference OCR-A image from disk, convert it to grayscale,
  // and threshold it, such that the digits appear as *white* on a
  // *black* background and invert it, such that the digits appear
  // as *white* on a *black*.
  let digitsImg = cv.imread('ocrDigitsImage');
  cv.cvtColor(digitsImg, digitsImg, cv.COLOR_BGR2GRAY);
  cv.threshold(digitsImg, digitsImg, 10, 255, cv.THRESH_BINARY_INV);

  // Find contours in the OCR-A image (i.e,. the outlines of the digits).
  // Sort them from left to right, and initialize a dictionary to map
  // digit name to the ROI.
  let ocrContours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let dst = cv.Mat.zeros(digitsImg.rows, digitsImg.cols, cv.CV_8UC3);
  cv.findContours(digitsImg, ocrContours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < ocrContours.size(); ++i) {
    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
      Math.round(Math.random() * 255));
    cv.drawContours(dst, ocrContours, i, color, 1, cv.LINE_8, hierarchy, 100);
  }

  // Loop over the OCR-A reference contours.
  let digits = [];

  for (let i = 0; i < ocrContours.size(); ++i) {
    // Compute the bounding box for the digit, extract it, and resize
    // it to a fixed size.
    let rect = cv.boundingRect(ocrContours.get(i));
    let roi = new cv.Mat();
    let roiSize = new cv.Size(57, 88);
    roi = digitsImg.roi(rect);
    cv.resize(roi, roi, roiSize);
    // Update the digits dictionary, mapping the digit name to the ROI.
    digits[i] = roi;
  }
  console.log(digits);
  digits.reverse();

  // Initialize a rectangular (wider than it is tall) and square
  // structuring kernel.
  let rectKernel = new cv.Mat();
  let sqKernel = new cv.Mat();
  let rectSize = new cv.Size(9, 3);
  let squareSize = new cv.Size(5, 5);
  rectKernel = cv.getStructuringElement(cv.MORPH_RECT, rectSize);
  sqKernel = cv.getStructuringElement(cv.MORPH_RECT, squareSize);

  // Load the input image, resize it, and convert it to grayscale.
  let cardImg = cv.imread('cardImage');
  resize(cardImg, width = 300);
  let grayCard = new cv.Mat();
  cv.cvtColor(cardImg, grayCard, cv.COLOR_BGR2GRAY);

  // Apply a tophat (whitehat) morphological operator to find light
  // regions against a dark background (i.e., the credit card numbers).
  let tophat = new cv.Mat();
  cv.morphologyEx(grayCard, tophat, cv.MORPH_TOPHAT, rectKernel)

  canvas = document.createElement('canvas');
  document.getElementsByTagName('body')[0].append(canvas);
  cv.imshow(canvas, tophat);

  // Compute the Scharr gradient of the tophat image, then scale
  // the rest back into the range [0, 255].
  let gradX = new cv.Mat();
  let kernel = 1;
  cv.Sobel(tophat, gradX, cv.CV_32F, 1, 0, kernel);
  cv.convertScaleAbs(gradX, gradX, 1, 0);
  // gradX = np.absolute(gradX);
  //(minVal, maxVal) = (np.min(gradX), np.max(gradX));
  //gradX = (255 * ((gradX - minVal) / (maxVal - minVal)));
  //gradX = gradX.astype("uint8");
  gradX.convertTo(gradX, cv.CV_8U);

  canvas = document.createElement('canvas');
  document.getElementsByTagName('body')[0].append(canvas);
  cv.imshow(canvas, gradX);

  // Apply a closing operation using the rectangular kernel to help
  // cloes gaps in between credit card number digits, then apply
  // Otsu's thresholding method to binarize the image.
  let thresh = new cv.Mat();
  cv.morphologyEx(gradX, thresh, cv.MORPH_CLOSE, rectKernel);
  cv.threshold(thresh, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
  // Apply a second closing operation to the binary image, again
  // to help close gaps between credit card number regions.
  cv.morphologyEx(thresh, thresh, cv.MORPH_CLOSE, sqKernel);

  canvas = document.createElement('canvas');
  document.getElementsByTagName('body')[0].append(canvas);
  cv.imshow(canvas, thresh);

  // Find contours in the thresholded image, then initialize the
  // list of digit locations.
  let cardContours = new cv.MatVector();
  cv.findContours(thresh, cardContours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let groups = [];
  // Loop over the contours.
  for (let i = 0; i < cardContours.size(); ++i) {
    // Compute the bounding box of the contour, then use the
    // bounding box coordinates to derive the aspect ratio.
    let rect = cv.boundingRect(cardContours.get(i));
    let ratio = rect.width / rect.height;
    //console.log('ratio', ratio.toFixed(1), 'w', rect.width, 'h', rect.height, 'x', rect.x, 'y', rect.y);
    // Since credit cards used a fixed size fonts with 4 groups
    // of 4 digits, we can prune potential contours based on the
    // aspect ratio.
    if (ratio > 2.5 && ratio < 4.0) {
      // Contours can further be pruned on minimum/maximum width
      // and height
      if ((rect.width > 40 && rect.width < 55) && (rect.height > 10 && rect.height < 20)) {
        // append the bounding box region of the digits group
        // to our locations list
        groups.push(rect);
      }
    }
  }
  console.log(groups);
  groups.reverse();

  output = [];
  // Loop over the 4 groupings of 4 digits.
  for (let i = 0; i < groups.length; ++i) {
    // Initialize the list of group digits.
    groupOutput = [];

    // Extract the group ROI of 4 digits from the grayscale image,
    // then apply thresholding to segment the digits from the
    // background of the credit card.
    let group = new cv.Mat();
    let rect = new cv.Rect(groups[i].x - 5, groups[i].y - 5, groups[i].width + 5, groups[i].height + 5);
    //group = grayCard[y - 5:y + h + 5, x - 5:x + w + 5];
    group = grayCard.roi(rect);
    cv.threshold(group, group, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

    canvas = document.createElement('canvas');
    document.getElementsByTagName('body')[0].append(canvas);
    cv.imshow(canvas, group);

    let digitContours = new cv.MatVector();
    // Detect the contours of each individual digit in the group,
    // then sort the digit contours from left to right.
    cv.findContours(group, digitContours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    //digitContours = contours.sort_contours(digitContours, method="left-to-right")[0];

    // Loop over the digit contours
    for (let i = 0; i < digitContours.size(); ++i) {
      // Compute the bounding box of the individual digit, extract
      // the digit, and resize it to have the same fixed size as
      // the reference OCR-A images.
      let rect = cv.boundingRect(digitContours.get(i));
      let roi = new cv.Mat();
      let roiSize = new cv.Size(57, 88);
      roi = group.roi(rect);
      cv.resize(roi, roi, roiSize);

      canvas = document.createElement('canvas');
      document.getElementsByTagName('body')[0].append(canvas);
      cv.imshow(canvas, roi);

      // Initialize a list of template matching scores.
      scores = [];

      // Loop over the reference digit name and digit ROI.
      for (let i = 0; i < digits.length; ++i) {
        // Apply correlation-based template matching, take the
        // score, and update the scores list.
        let mask = new cv.Mat();
        let dstRoi = new cv.Mat();
        cv.matchTemplate(roi, digits[i], dstRoi, cv.TM_CCOEFF, mask);
        let result = cv.minMaxLoc(dstRoi, mask);
        let score = result.maxVal;
        scores.push(score);
        mask.delete(); dstRoi.delete();
      }

      // The classification for the digit ROI will be the reference
      // Digit name with the *largest* template matching score.
      groupOutput.push(scores.indexOf(Math.max(...scores)));
      roi.delete();
    }
    console.log(groupOutput);
    groupOutput.reverse();

    cv.rectangle(cardImg, new cv.Point(groups[i].x - 5, groups[i].y - 5),
      new cv.Point(groups[i].x + groups[i].width + 5,
        groups[i].y + groups[i].height + 5), color, 2);
    // Update the output digits list.
    output.push(groupOutput.join(''));
  }

  canvas = document.createElement('canvas');
  document.getElementsByTagName('body')[0].append(canvas);
  cv.imshow(canvas, cardImg);

  if (output[0]) {
    let text = document.createElement('p');
    text.innerText = FIRST_NUMBER[output[0][0]];
    document.getElementsByTagName('body')[0].append(text);
    text = document.createElement('p');
    text.innerText = output.join(' ');
    document.getElementsByTagName('body')[0].append(text);
  }


  ocrContours.delete(); hierarchy.delete(); dst.delete();
  rectKernel.delete(); sqKernel.delete();
  grayCard.delete(); tophat.delete(); gradX.delete(); thresh.delete();
  cardContours.delete();
  for (let i = 0; i < digits.length; ++i) {
    digits[i].delete();
  }

});
