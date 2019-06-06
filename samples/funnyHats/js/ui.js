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

  // load hats
  let rgbaVector = new cv.MatVector();
  for (let i = 0; i < hatsNum; i++) {
    hatSrc = cv.imread(`hat${i}`);
    // create mask from alpha channel
    cv.split(hatSrc, rgbaVector);
    mask = rgbaVector.get(3).clone();
    hats.push({name: i, src: hatSrc.clone(), mask: mask.clone()});

    cv.resize(hatSrc, hatSrc, new cv.Size(320, 240), 0, 0, cv.INTER_LINEAR);
    cv.imshow(smallVanvases[i], hatSrc);
    hatSrc.delete(); mask.delete();
  }
  rgbaVector.delete();

}

// add onclick event listeners for menu canvases
for (let i = 0; i < hatsNum; i++) {
  smallVanvases[i].addEventListener("click", function () {
    currentHat = i;
  });
}

function deleteHats() {
  for (let i = 0; i < hats.length; i++) {
    hats[i].src.delete();
    hats[i].mask.delete();
  }
}