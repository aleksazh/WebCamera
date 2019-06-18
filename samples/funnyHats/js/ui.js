let stats = null;

let hats = [];
let hatSrc = null;
let hatMask = null;
let currentHat = 0;
let hatsNum = document.getElementsByClassName('hat-image').length;

let glasses = [];
let glassesSrc = null;
let glassesMask = null;
let currentGlasses = 0;
let glassesNum = document.getElementsByClassName('glasses-image').length;

let objectChanged = false;


function initUI() {
  initStats();
  let rgbaVector = new cv.MatVector();
  // hats initialization
  for (let i = 0; i < hatsNum; i++) {
    // load hat and read attributes
    let img = document.getElementById(`hat${i}`);
    hatSrc = cv.imread(img);
    let scale = Number(img.dataset.scaleFactor);
    let yOffset = Number(img.dataset.yOffset);
    let name = img.dataset.name;
    let hatNode = createNode(name, 'hatsCarousel');
    // add event listener to menu canvas
    hatNode.addEventListener('click', function () {
      hatSrc.delete(); hatMask.delete();
      currentHat = i;
      hatSrc = hats[currentHat].src.clone();
      hatMask = hats[currentHat].mask.clone();
      objectChanged = true;
    });
    // create mask from alpha channel
    cv.split(hatSrc, rgbaVector);
    // push hat to array of hats
    hats.push({
      name: name, src: hatSrc.clone(),
      mask: rgbaVector.get(3).clone(), scale: scale, yOffset: yOffset
    });
    cv.imshow(hatNode, hatSrc);
  }
  // glassess initialization
  for (let i = 0; i < glassesNum; i++) {
    // load glasses and read attributes
    let img = document.getElementById(`glasses${i}`);
    glassesSrc = cv.imread(img);
    let scale = Number(img.dataset.scaleFactor);
    let yOffset = Number(img.dataset.yOffset);
    let name = img.dataset.name;
    let glassesNode = createNode(name, 'glassesCarousel');
    // add event listener to menu canvas
    glassesNode.addEventListener('click', function () {
      glassesSrc.delete(); glassesMask.delete();
      currentGlasses = i;
      glassesSrc = glasses[currentGlasses].src.clone();
      glassesMask = glasses[currentGlasses].mask.clone();
      objectChanged = true;
    });
    // create mask from alpha channel
    cv.split(glassesSrc, rgbaVector);
    // push glasses to array of glasses
    glasses.push({
      name: name, src: glassesSrc.clone(),
      mask: rgbaVector.get(3).clone(), scale: scale, yOffset: yOffset
    });
    cv.imshow(glassesNode, glassesSrc);
  }
  rgbaVector.delete();
  // choose initial hat and glasses
  hatSrc = hats[currentHat].src.clone();
  hatMask = hats[currentHat].mask.clone();
  glassesSrc = glasses[currentGlasses].src.clone();
  glassesMask = glasses[currentGlasses].mask.clone();
  // now we have canvases and can create menu
  let menuScript = document.createElement('script');
  menuScript.type = 'text/javascript';
  menuScript.src = '../filters/js/menu.js';
  document.body.appendChild(menuScript);
}

function createNode(name, carouselName) {
  let liNode = document.createElement('li');
  liNode.classList.add('card');
  liNode.setAttribute('data-target', 'card');
  let divNode = document.createElement('div');
  let canvasNode = document.createElement('canvas');
  canvasNode.classList.add('small-canvas');
  divNode.appendChild(canvasNode);
  liNode.appendChild(divNode);
  let liText = document.createTextNode(name);
  liNode.appendChild(liText);
  document.getElementById(carouselName).appendChild(liNode);
  return canvasNode;
}

function deleteHats() {
  for (let i = 0; i < hats.length; i++) {
    if (hats[i].src != null && !hats[i].src.isDeleted())
      hats[i].src.delete();
    if (hats[i].mask != null && !hats[i].mask.isDeleted())
      hats[i].mask.delete();
  }
}

function deleteGlasses() {
  for (let i = 0; i < glasses.length; i++) {
    if (glasses[i].src != null && !glasses[i].src.isDeleted())
    glasses[i].src.delete();
    if (glasses[i].mask != null && !glasses[i].mask.isDeleted())
    glasses[i].mask.delete();
  }
}
