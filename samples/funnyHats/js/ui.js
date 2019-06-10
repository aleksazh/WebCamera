let stats = null;
let statsCheckbox = document.getElementById('hideStats');

let hats = [];
let hatSrc = null;
let mask = null;
let currentHat = 0;
let hatsNum = document.getElementsByTagName('img').length;
let smallVanvases = document.getElementsByClassName('small-canvas');


statsCheckbox.addEventListener("change", function () {
  if (statsCheckbox.checked) {
    stats.domElement.classList.add("hidden");
  } else {
    stats.domElement.classList.remove("hidden");
  }
});

function initUI() {
  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.domElement);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.top = '0px';
  stats.domElement.classList.add("hidden");

  let rgbaVector = new cv.MatVector();
  for (let i = 0; i < hatsNum; i++) {
    // load hat and read attributes
    hatSrc = cv.imread(`hat${i}`);
    let img = document.getElementById(`hat${i}`);
    let scale = Number(img.dataset.scaleFactor);
    let yOffset = Number(img.dataset.yOffset);
    let name = img.dataset.name;
    // create mask from alpha channel
    cv.split(hatSrc, rgbaVector);
    mask = rgbaVector.get(3).clone();
    // create hat node in menu
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
    hats.push({name: name, src: hatSrc.clone(), mask: mask.clone(),
      scale: scale, yOffset: yOffset});

    cv.imshow(canvasNode, hatSrc);
  }
  rgbaVector.delete();
  hatSrc.delete(); mask.delete();
  // choose initial hat
  hatSrc = hats[currentHat].src.clone();
  mask = hats[currentHat].mask.clone();
  // now we have canvases and can create menu
  let menuScript = document.createElement('script');
  menuScript.type = 'text/javascript';
  menuScript.src = '../filters/js/menu.js';
  document.body.appendChild(menuScript);
}

function deleteHats() {
  for (let i = 0; i < hats.length; i++) {
    hats[i].src.delete();
    hats[i].mask.delete();
  }
}