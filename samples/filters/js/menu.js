
var leftPaddle = document.getElementsByClassName('left-paddle');
var rightPaddle = document.getElementsByClassName('right-paddle');
var itemElement = document.getElementsByClassName('item');
var menuElement = document.getElementsByClassName('menu');
var menuWrapperElement = document.getElementsByClassName('menu-wrapper');

var itemSize = itemElement[0].offsetWidth;
var scrollDuration = 100;
var currentPosition = 0;
var menuWrapperSize = menuWrapperElement[0].offsetWidth;
var menuSize = itemElement.length * itemSize;

window.addEventListener('resize', function () {
	menuWrapperSize = menuWrapperElement[0].offsetWidth;
});

rightPaddle[0].addEventListener('click', function () {
	currentPosition += menuWrapperSize - menuWrapperSize / 3;
	$('.menu').animate({ scrollLeft: currentPosition }, scrollDuration);
});
leftPaddle[0].addEventListener('click', function () {
	currentPosition -= menuWrapperSize - menuWrapperSize / 3;
	$('.menu').animate({ scrollLeft: currentPosition }, scrollDuration);
});