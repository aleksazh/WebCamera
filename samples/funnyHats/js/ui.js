let stats = null;

let hats = [];
let hatSrc = null;
let mask = null;
let currentHat = 0;
let hatsNum = document.getElementsByTagName('img').length;


function initUI() {
  initStats ();
  let rgbaVector = new cv.MatVector();
  for (let i = 0; i < hatsNum; i++) {
    // load hat and read attributes
    let img = document.getElementById(`hat${i}`);
    hatSrc = cv.imread(img);
    let scale = Number(img.dataset.scaleFactor);
    let yOffset = Number(img.dataset.yOffset);
    let name = img.dataset.name;
    let hatNode = createHatNode(name, i);
    // create mask from alpha channel
    cv.split(hatSrc, rgbaVector);
    // push hat to array of hats
    hats.push({
      name: name, src: hatSrc.clone(),
      mask: rgbaVector.get(3).clone(), scale: scale, yOffset: yOffset
    });
    cv.imshow(hatNode, hatSrc);
  }
  rgbaVector.delete();
  // choose initial hat
  hatSrc = hats[currentHat].src.clone();
  mask = hats[currentHat].mask.clone();
  // now we have canvases and can create menu
  let menuScript = document.createElement('script');
  menuScript.type = 'text/javascript';
  menuScript.src = '../filters/js/menu.js';
  document.body.appendChild(menuScript);
}

function createHatNode(name, i) {
  let liNode = document.createElement("li");
  liNode.classList.add("card");
  liNode.setAttribute('data-target', 'card');
  let divNode = document.createElement("div");
  let canvasNode = document.createElement("canvas");
  canvasNode.classList.add("small-canvas");
  divNode.appendChild(canvasNode);
  liNode.appendChild(divNode);
  let liText = document.createTextNode(name);
  liNode.appendChild(liText);
  document.getElementsByClassName('carousel')[0].appendChild(liNode);
  // add event listener to menu canvas
  canvasNode.addEventListener("click", function () {
    hatSrc.delete(); mask.delete();
    currentHat = i;
    hatSrc = hats[currentHat].src.clone();
    mask = hats[currentHat].mask.clone();
  });
  return canvasNode;
}

function deleteHats() {
  for (let i = 0; i < hats.length; i++) {
    hats[i].src.delete();
    hats[i].mask.delete();
  }
}
