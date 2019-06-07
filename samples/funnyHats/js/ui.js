let stats = null;
let statsCheckbox = document.getElementById('hideStats');

let hats = [];
let currentHat = 0;
let hatsNum = document.getElementsByTagName('img').length;


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
  let hatSrc;
  for (let i = 0; i < hatsNum; i++) {
    // load hat and read attributes
    hatSrc = cv.imread(`hat${i}`);
    let img = document.getElementById(`hat${i}`);
    let scale = Number(img.dataset.scaleFactor);
    let yOffset = Number(img.dataset.yOffset);
    let name = img.dataset.name;
    let hatNode = createHatNode(name, i);
    // split hat source to get mask from alpha channel
    cv.split(hatSrc, rgbaVector);
    hats.push({name: name, src: hatSrc.clone(),
      mask: rgbaVector.get(3).clone(), scale: scale, yOffset: yOffset});
    cv.imshow(hatNode, hatSrc);
  }
  rgbaVector.delete();
  // now we have canvases and can create scolling menu
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
    currentHat = i;
  });
  return canvasNode;
}

function deleteHats() {
  for (let i = 0; i < hats.length; i++) {
    hats[i].src.delete();
    hats[i].mask.delete();
  }
}