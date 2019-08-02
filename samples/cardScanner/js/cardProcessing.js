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

function getReferenceDigits(imgId, refSize) {
  let src = cv.imread(imgId);
  cv.cvtColor(src, src, cv.COLOR_BGR2GRAY);
  cv.threshold(src, src, 10, 255, cv.THRESH_BINARY_INV);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE);
  let rectangles = getSortedRectangles(contours);
  contours.delete(); hierarchy.delete();

  let digits = [];
  for (let i = 0; i < rectangles.length; ++i) {
    let digit = new cv.Mat();
    digit = src.roi(rectangles[i]);
    cv.resize(digit, digit, refSize);
    digits[i] = digit;
    // outputToCanvas(digit);
  }
  src.delete();
  return digits;
}

function loadCardImg(src, grayCard, rectPointUpperLeft, rectPointBottomRight) {
  // Extract card area from source image.
  let cardImg = new cv.Mat();
  let rect = new cv.Rect(rectPointUpperLeft.x, rectPointUpperLeft.y,
    rectPointBottomRight.x - rectPointUpperLeft.x,
    rectPointBottomRight.y - rectPointUpperLeft.y);
  cardImg = src.roi(rect);

  // Resize card and convert it to grayscale.
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
   // outputToCanvas(tophat);

  // Compute the Sobel gradient of the tophat image.
  // Set the order of the derivative in x direction.
  let gradX = new cv.Mat();
  let kernel = 1, xOrder = 1, yOrder = 0;
  cv.Sobel(tophat, gradX, cv.CV_32F, xOrder, yOrder, kernel);
  // Scale image back into the range [0, 255].
  // See about this matter:
  // https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_imgproc/py_gradients/py_gradients.html#one-important-matter
  cv.convertScaleAbs(gradX, gradX, 1, 0);
  gradX.convertTo(gradX, cv.CV_8U);
   // outputToCanvas(gradX);

  // Apply a closing operation using the rectangular kernel to help
  // close gaps between credit card number regions.
  let thresh = new cv.Mat();
  cv.morphologyEx(gradX, gradX, cv.MORPH_CLOSE, rectKernel);

  // Apply Otsu's thresholding method to binarize the image.
  cv.threshold(gradX, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

  // Apply a second closing operation to the binary image, again
  // to help close gaps between credit card number regions.
  cv.morphologyEx(thresh, filteredCard, cv.MORPH_CLOSE, squareKernel);
  // outputToCanvas(filteredCard);

  rectKernel.delete(); squareKernel.delete();
  tophat.delete(); gradX.delete(); thresh.delete();
}

function findDigitGroups(filteredCard) {
  // Find contours in the filtered card image.
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(filteredCard, contours, hierarchy, cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE);
  let groupRectangles = getSortedRectangles(contours);

  let digitGroups = [];
  for (let i = 0; i < groupRectangles.length; ++i) {
    let rect = groupRectangles[i];
    let ratio = rect.width / rect.height;
    // Since credit cards used a fixed size fonts with 4 groups
    // of 4 digits, we can prune potential contours based on the
    // aspect ratio.
    // TODO(sasha): detect also longer groups (not only 4 digits in a group).
    if (ratio > 2.5 && ratio < 4.0)
      // Contours can further be pruned on min/max width and height.
      if ((rect.width > 40 && rect.width < 55)
        && (rect.height > 10 && rect.height < 20))
        digitGroups.push(rect);
  }
  contours.delete(); hierarchy.delete();
  return digitGroups;
}

function detectDigit(group, digitRect, refDigits, refSize) {
  let cardDigit = new cv.Mat();
  cardDigit = group.roi(digitRect);
  // Resize digit to have the same fixed size as the reference digits.
  cv.resize(cardDigit, cardDigit, refSize);
  // outputToCanvas(cardDigit);

  scores = []; // Initialize a list of template matching scores.
  let cardDigitDst = new cv.Mat();
  let mask = new cv.Mat();
  // Loop over the reference digits.
  for (let i = 0; i < refDigits.length; ++i) {
    // Apply correlation-based template matching and take the score.
    cv.matchTemplate(cardDigit, refDigits[i], cardDigitDst, cv.TM_CCOEFF, mask);
    let score = cv.minMaxLoc(cardDigitDst, mask).maxVal;
    console.log(score);
    scores.push(score);
  }
  console.log('nextDigit');
  cardDigit.delete(); cardDigitDst.delete(); mask.delete();
  // Take the *largest* template matching score.
  return scores.indexOf(Math.max(...scores));
}

function detectDigitsInGroup(groupRect, grayCard, refDigits, refSize) {
  // Extract the group of 4 digits from the grayscale image, then apply
  // thresholding to segment the digits from the background of the credit card.
  let groupSrc = new cv.Mat();
  // TODO(sasha): Try without newRect.
  //let newRect = new cv.Rect(groupRect.x - 2, groupRect.y - 2, groupRect.width + 4, groupRect.height + 4);
  //groupSrc = grayCard.roi(newRect);
  groupSrc = grayCard.roi(groupRect);
  cv.threshold(groupSrc, groupSrc, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
  // outputToCanvas(groupSrc);

  // Detect the contours of each individual digit in the group,
  // then sort the digit contours from left to right.
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(groupSrc, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  let digitRectangles = getSortedRectangles(contours);
  contours.delete(); hierarchy.delete();

  // Initialize the list of group digits.
  groupOutput = [];
  // Loop over the digit contours
  for (let i = 0; i < digitRectangles.length; ++i) {
    let detectedDigit =
      detectDigit(groupSrc, digitRectangles[i], refDigits, refSize);
    groupOutput.push(detectedDigit);
  }
  groupSrc.delete();
  return groupOutput;
}

function showOutput(output) {
  document.getElementById('cardType').innerText = CARD_TYPE[output[0][0]];
  document.getElementById('cardNumber').innerText = output.join(' ');
}

function deleteMatObjects(refDigits, grayCard, filteredCard) {
  for (let i = 0; i < refDigits.length; ++i) {
    refDigits[i].delete();
  }
  grayCard.delete(); filteredCard.delete();
}

function startCardProcessing(src, rectPointUpperLeft, rectPointBottomRight) {
  let refSize = new cv.Size(57, 88);
  let refDigits = getReferenceDigits('ocrFont', refSize);

  let grayCard = new cv.Mat();
  loadCardImg(src, grayCard, rectPointUpperLeft, rectPointBottomRight);

  let filteredCard = new cv.Mat();
  applyFiltersToCard(grayCard, filteredCard);

  let groupRectangles = findDigitGroups(filteredCard);

  output = [];
  // Loop over the 4 groupings of 4 digits.
  for (let i = 0; i < groupRectangles.length; ++i) {
    let groupOutput =
      detectDigitsInGroup(groupRectangles[i], grayCard, refDigits, refSize);
    output.push(groupOutput.join('')); // Update the output digits list.

    // let rect = groupRectangles[i];
    // const redColor = [255, 0, 0, 255];
    // cv.rectangle(grayCard, new cv.Point(rect.x - 5, rect.y - 5),
    //   new cv.Point(rect.x + rect.width + 5, rect.y + rect.height + 5), redColor, 2);
  }
  // outputToCanvas(grayCard);
  cv.imshow('outputImage', grayCard);

  if (output[0]) {
    showOutput(output);
  } else {
    document.getElementById('cardNumber').innerText =
      'Please take a more accurate photo.';
  }

  deleteMatObjects(refDigits, grayCard, filteredCard);
}
