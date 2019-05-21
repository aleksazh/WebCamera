
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

var paddleMargin = 20;
var menuVisibleSize = menuWrapperSize;
var menuInvisibleSize = menuSize - menuWrapperSize;

window.addEventListener('resize', function () {
	menuWrapperSize = menuWrapperElement[0].offsetWidth;
});

menuElement[0].addEventListener('scroll', function () {
	menuInvisibleSize = menuSize - menuWrapperSize;
	var menuPosition = currentPosition;
	var menuEndOffset = menuInvisibleSize - paddleMargin;
	if (menuPosition <= paddleMargin) {
		$(leftPaddle).addClass('hidden');
		$(rightPaddle).removeClass('hidden');
		//leftPaddle.classList.add('hidden');
		//rightPaddle.classList.remove('hidden');
	} else if (menuPosition < menuEndOffset) {
		$(leftPaddle).removeClass('hidden');
		$(rightPaddle).removeClass('hidden');
		//leftPaddle.classList.remove('hidden');
		//rightPaddle.classList.remove('hidden');
	} else if (menuPosition >= menuEndOffset) {
		$(leftPaddle).removeClass('hidden');
		$(rightPaddle).addClass('hidden');
		//leftPaddle.classList.remove('hidden');
		//rightPaddle.classList.add('hidden');
	}
});

rightPaddle[0].addEventListener('click', function () {
	currentPosition += menuWrapperSize - menuWrapperSize / 3;
	$('.menu').animate({ scrollLeft: currentPosition }, scrollDuration);
});
leftPaddle[0].addEventListener('click', function () {
	currentPosition -= menuWrapperSize - menuWrapperSize / 3;
	$('.menu').animate({ scrollLeft: currentPosition }, scrollDuration);
});