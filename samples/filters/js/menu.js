const carousels = document.querySelectorAll("[data-target='carousel']");
const leftButtons = document.querySelectorAll("[data-action='slideLeft']");
const rightButtons = document.querySelectorAll("[data-action='slideRight']");
let offset = 0; // offset will always be negative or zero

// for showing 1/4 part of previous menu window after scrolling
const menuParts = 4;

leftButtons.forEach(function (button, i) {
  button.addEventListener("click", function () {
    const carouselWidth = carousels[i].offsetWidth;
    if (offset < 0) {
      let remainedWidth = 0 - offset;
      if (remainedWidth <= carouselWidth) {
        offset += remainedWidth;
      } else {
        offset += carouselWidth - carouselWidth / menuParts;
      }
      carousels[i].style.transform = `translateX(${offset}px)`;
    }
  });
});

rightButtons.forEach(function (button, i) {
  button.addEventListener("click", function () {
    const cardCount = carousels[i].querySelectorAll("[data-target='card']").length;
    const card = carousels[i].querySelector("[data-target='card']");
    const maxX = cardCount * card.offsetWidth;
    const carouselWidth = carousels[i].offsetWidth;
    if (offset > -maxX) {
      let remainedWidth = maxX + offset - carouselWidth;
      if (remainedWidth <= carouselWidth) {
        offset -= remainedWidth;
      } else {
        offset -= carouselWidth - carouselWidth / menuParts;
      }
      carousels[i].style.transform = `translateX(${offset}px)`;
    }
  });
});

// resize carousel on window resizing
window.onresize = function () {
  const VGA_WIDTH = 640;
  const GVGA_WIDTH = 320;
  let buttonWidth = leftButtons[0].offsetWidth;
  let windowConstraintVGA = VGA_WIDTH + 2 * buttonWidth;
  let windowConstraintGVGA = GVGA_WIDTH + 2 * buttonWidth;
  carousels.forEach(function (carousel) {
    if (window.innerWidth < windowConstraintVGA && width == VGA_WIDTH) { // vga
      carousel.style.width =
        `${window.innerWidth - 3 * buttonWidth}px`;
    } else if (window.innerWidth > windowConstraintVGA &&
      width == VGA_WIDTH) { // vga
      carousel.style.width =
        `${width - 2 * buttonWidth}px`;
    } else if (window.innerWidth < windowConstraintGVGA &&
      width == GVGA_WIDTH) {// gvga
      carousel.style.width =
        `${window.innerWidth - 3 * buttonWidth}px`;
    } else if (window.innerWidth > windowConstraintGVGA &&
      width == GVGA_WIDTH) {// gvga
      carousel.style.width =
        `${width - 2 * buttonWidth}px`;
    }
  });
};

// resize menu for current canvas size
function resizeMenu() {
  const VGA_WIDTH = 640;
  // carousel
  let buttonWidth = leftButtons[0].offsetWidth;
  carousels.forEach(function (carousel) {
    carousel.style.width = `${width - 2 * buttonWidth}px`;
  });
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
  rightButtons.forEach(function (button) {
    button.style.height = `${scProperties.scrollHeight}px`;
  });
  leftButtons.forEach(function (button) {
    button.style.height = `${scProperties.scrollHeight}px`;
  });
}