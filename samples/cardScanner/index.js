let utils = new Utils('errorMessage');

const color = [255, 0, 0, 255]; // Red

CARD_TYPE = {
  "3": "American Express",
  "4": "Visa",
  "5": "MasterCard",
  "6": "Discover Card"
}

function resize(image, width = 'undefined', height = 'undefined') {
  let dim;

  if (width == 'undefined' && height == 'undefined')
    return image;

  let ratio;
  if (width == 'undefined') {
    ratio = height / image.rows;
    dim = new cv.Size(parseInt(image.cols * ratio), height);
  } else {
    ratio = width / image.cols;
    dim = new cv.Size(width, parseInt(image.rows * ratio));
  }

  cv.resize(image, image, dim, cv.INTER_AREA);
}

// Sort rectangles according to x coordinate.
function compareRect(a, b) {
  if (a.x > b.x) return 1;
  if (b.x > a.x) return -1;
  return 0;
}

function getSortedRectangles(contours) {
  let rectangles = [];
  // Extract rectangle from each contour.
  for (let i = 0; i < contours.size(); ++i) {
    rectangles.push(cv.boundingRect(contours.get(i)));
  }
  return rectangles.sort(compareRect);
}

function outputToCanvas(image) {
  let canvas = document.createElement('canvas');
  document.getElementsByTagName('body')[0].append(canvas);
  cv.imshow(canvas, image);
}

function getReferenceDigits(imgId) {
  let src = cv.imread(imgId);
  cv.cvtColor(src, src, cv.COLOR_BGR2GRAY);
  cv.threshold(src, src, 10, 255, cv.THRESH_BINARY_INV);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE);
  let rectangles = getSortedRectangles(contours);

  let digits = [];
  for (let i = 0; i < rectangles.length; ++i) {
    let digit = new cv.Mat();
    let digitSize = new cv.Size(57, 88);
    digit = src.roi(rectangles[i]);
    cv.resize(digit, digit, digitSize);
    digits[i] = digit;
  }

  src.delete(); contours.delete(); hierarchy.delete();

  return digits;
}

function loadCardImg(cardImgId, grayCard) {
  // Load the input image, resize it, and convert it to grayscale.
  let cardImg = cv.imread(cardImgId);
  resize(cardImg, width = 300);
  cv.cvtColor(cardImg, grayCard, cv.COLOR_BGR2GRAY);
  cardImg.delete();
}

function applyFiltersToCard(grayCard, filteredCard) {
  // Initialize rectangular and square structuring kernels.
  let rectKernel = new cv.Mat();
  let squareKernel = new cv.Mat();
  //TODO(sasha): Maybe adjust size of the kernels.
  rectKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(9, 3));
  squareKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));

  // Apply a tophat (whitehat) morphological operator to find light
  // regions against a dark background (i.e., the credit card numbers).
  let tophat = new cv.Mat();
  cv.morphologyEx(grayCard, tophat, cv.MORPH_TOPHAT, rectKernel)
  outputToCanvas(tophat);

  // Compute the Sobel gradient of the tophat image.
  // Set the order of the derivative in x direction.
  let gradX = new cv.Mat();
  let kernel = 1, xOrder = 1, yOrder = 0;
  cv.Sobel(tophat, gradX, cv.CV_32F, xOrder, yOrder, kernel);
  // Scale image back into the range [0, 255],
  // see about this matter:
  // https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_imgproc/py_gradients/py_gradients.html#one-important-matter
  cv.convertScaleAbs(gradX, gradX, 1, 0);
  gradX.convertTo(gradX, cv.CV_8U);
  outputToCanvas(gradX);

  // Apply a closing operation using the rectangular kernel to help
  // close gaps between credit card number regions.
  let thresh = new cv.Mat();
  cv.morphologyEx(gradX, gradX, cv.MORPH_CLOSE, rectKernel);

  // Apply Otsu's thresholding method to binarize the image.
  cv.threshold(gradX, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

  // Apply a second closing operation to the binary image, again
  // to help close gaps between credit card number regions.
  cv.morphologyEx(thresh, filteredCard, cv.MORPH_CLOSE, squareKernel);
  outputToCanvas(filteredCard);

  rectKernel.delete(); squareKernel.delete();
  tophat.delete(); gradX.delete(); thresh.delete();
}

function findDigitGroups(filteredCard) {
  // Find contours in the filtered card image.
  let groupsContours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(filteredCard, groupsContours, hierarchy, cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE);
  let groupsRectangles = getSortedRectangles(groupsContours);

  let groups = [];
  for (let i = 0; i < groupsRectangles.length; ++i) {
    let rect = groupsRectangles[i];
    let ratio = rect.width / rect.height;
    // Since credit cards used a fixed size fonts with 4 groups
    // of 4 digits, we can prune potential contours based on the
    // aspect ratio.
    // TODO(sasha): detect also longer groups of numbers (not only 4).
    if (ratio > 2.5 && ratio < 4.0) {
      // Contours can further be pruned on min/max width and height.
      if ((rect.width > 40 && rect.width < 55) && (rect.height > 10 && rect.height < 20)) {
        groups.push(rect);
      }
    }
  }
  groupsContours.delete(); hierarchy.delete();

  return groups;
}

utils.loadOpenCv(() => {
  let referenceDigits = getReferenceDigits('ocrFont');

  let grayCard = new cv.Mat();
  loadCardImg('cardImage', grayCard);

  let filteredCard = new cv.Mat();
  applyFiltersToCard(grayCard, filteredCard);

  let digitGroups = findDigitGroups(filteredCard);

  let hierarchy = new cv.Mat();
  output = [];
  // Loop over the 4 groupings of 4 digits.
  for (let i = 0; i < digitGroups.length; ++i) {
    // Initialize the list of group digits.
    groupOutput = [];

    // Extract the group ROI of 4 digits from the grayscale image,
    // then apply thresholding to segment the digits from the
    // background of the credit card.
    let group = new cv.Mat();
    let rect = new cv.Rect(digitGroups[i].x - 2, digitGroups[i].y - 2, digitGroups[i].width + 4, digitGroups[i].height + 4);
    group = grayCard.roi(rect);
    cv.threshold(group, group, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    outputToCanvas(group);

    let digitsContours = new cv.MatVector();
    // Detect the contours of each individual digit in the group,
    // then sort the digit contours from left to right.
    cv.findContours(group, digitsContours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    let digitsRectangles = getSortedRectangles(digitsContours);

    // Loop over the digit contours
    for (let i = 0; i < digitsRectangles.length; ++i) {
      // Compute the bounding box of the individual digit, extract
      // the digit, and resize it to have the same fixed size as
      // the reference OCR-A images.
      let roi = new cv.Mat();
      let roiSize = new cv.Size(57, 88);
      roi = group.roi(digitsRectangles[i]);
      cv.resize(roi, roi, roiSize);
      outputToCanvas(roi);

      // Initialize a list of template matching scores.
      scores = [];

      // Loop over the reference digit name and digit ROI.
      for (let i = 0; i < referenceDigits.length; ++i) {
        // Apply correlation-based template matching, take the
        // score, and update the scores list.
        let mask = new cv.Mat();
        let dstRoi = new cv.Mat();
        cv.matchTemplate(roi, referenceDigits[i], dstRoi, cv.TM_CCOEFF, mask);
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

    cv.rectangle(grayCard, new cv.Point(digitGroups[i].x - 5, digitGroups[i].y - 5),
      new cv.Point(digitGroups[i].x + digitGroups[i].width + 5,
        digitGroups[i].y + digitGroups[i].height + 5), color, 2);
    // Update the output digits list.
    output.push(groupOutput.join(''));

    digitsContours.delete();
  }
  outputToCanvas(grayCard);

  if (output[0]) {
    let text = document.createElement('p');
    text.innerText = CARD_TYPE[output[0][0]];
    document.getElementsByTagName('body')[0].append(text);
    text = document.createElement('p');
    text.innerText = output.join(' ');
    document.getElementsByTagName('body')[0].append(text);
  }


  hierarchy.delete();
  grayCard.delete();
  filteredCard.delete();
  for (let i = 0; i < referenceDigits.length; ++i) {
    referenceDigits[i].delete();
  }

});
