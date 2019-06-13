const carousel = document.querySelector("[data-target='carousel']");
const card = carousel.querySelector("[data-target='card']");
const leftButton = document.querySelector("[data-action='slideLeft']");
const rightButton = document.querySelector("[data-action='slideRight']");
const cardCount = carousel.querySelectorAll("[data-target='card']").length;
let offset = 0; // offset will always be negative or zero

leftButton.addEventListener("click", function () {
  const carouselWidth = carousel.offsetWidth;
  if (offset < 0) {
    let remainedWidth = 0 - offset;
    if (remainedWidth <= carouselWidth) {
      offset += remainedWidth;
    } else {
      offset += carouselWidth - carouselWidth / 4;
    }
    carousel.style.transform = `translateX(${offset}px)`;
  }
})
rightButton.addEventListener("click", function () {
  const maxX = cardCount * card.offsetWidth;
  const carouselWidth = carousel.offsetWidth;
  if (offset > -maxX) {
    let remainedWidth = maxX + offset - carouselWidth;
    if (remainedWidth <= carouselWidth) {
      offset -= remainedWidth;
    } else {
      offset -= carouselWidth - carouselWidth / 4;
    }
    carousel.style.transform = `translateX(${offset}px)`;
  }
})

// resize carousel on window resizing
window.onresize = function () {
  const VGA_WIDTH = 640;
  const GVGA_WIDTH = 320;
  let buttonWidth =
    document.querySelector("[data-action='slideRight']").offsetWidth;
  let windowConstraintVGA = VGA_WIDTH + 2 * buttonWidth;
  let windowConstraintGVGA = GVGA_WIDTH + 2 * buttonWidth;
  if (window.innerWidth < windowConstraintVGA && width == VGA_WIDTH) { // vga
    document.getElementsByClassName("carousel")[0].style.width =
      `${window.innerWidth - 3 * buttonWidth}px`;
  } else if (window.innerWidth > windowConstraintVGA &&
             width == VGA_WIDTH) { // vga
    document.getElementsByClassName("carousel")[0].style.width =
      `${width - 2 * buttonWidth}px`;
  } else if (window.innerWidth < windowConstraintGVGA &&
             width == GVGA_WIDTH) {// gvga
    document.getElementsByClassName("carousel")[0].style.width =
      `${window.innerWidth - 3 * buttonWidth}px`;
  } else if (window.innerWidth > windowConstraintGVGA &&
             width == GVGA_WIDTH) {// gvga
    document.getElementsByClassName("carousel")[0].style.width =
      `${width - 2 * buttonWidth}px`;
  }
};

// resize menu for current canvas size
function resizeMenu() {
  const VGA_WIDTH = 640;
  // carousel
  let buttonWidth =
    document.querySelector("[data-action='slideRight']").offsetWidth;
  document.getElementsByClassName("carousel")[0].style.width =
    `${width - 2 * buttonWidth}px`;
  // small canvases and cards
  let smallCanvases = document.getElementsByClassName("small-canvas");
  let scProperties = document.querySelector(".small-canvas");
  let scPadding = parseInt(getComputedStyle(scProperties).padding);
  let cards = document.getElementsByClassName("card");
  for (let i = 0; i < smallCanvases.length; i++) {
    smallCanvases[i].style.height = `${parseInt(height / 5)}px`;
    smallCanvases[i].style.width = `${parseInt(width / 5)}px`;
    cards[i].style.width = `${parseInt(width / 5 + 2 * scPadding)}px`;
    if (width < VGA_WIDTH) {
      cards[i].style.fontSize = `16px`;
    }
  }
  // buttons
  let buttons = document.getElementsByClassName("menu-button");
  buttons[0].style.height = `${scProperties.scrollHeight}px`;
  buttons[1].style.height = `${scProperties.scrollHeight}px`;
}