const body = document.body;
const imageContainer = document.getElementById('KSGROUP-LOGO-SVG-WEBP');
function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|ipad|iphone|ipod|blackberry|bb10|windows phone|mobile/i.test(userAgent);
}
function setImage() {
    const isMobile = isMobileDevice();
    const imageUrl = isMobile
        ? "https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-BIALY-WEBP.webp"
        : "https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-BIALY-SVG.svg";
    imageContainer.setAttribute("src", imageUrl);
}
function resetEffect() {
    body.classList.remove('hover-active');
    imageContainer.style.filter = 'brightness(0)';
}
function activateEffect() {
    body.classList.add('hover-active');
    imageContainer.style.filter = 'brightness(1) invert(1)';
}
imageContainer.addEventListener('touchstart', function () {
    if (body.classList.contains('hover-active')) {
        resetEffect();
    } else {
        activateEffect();
    }
});
body.addEventListener('mouseover', function () {
    activateEffect();
});
body.addEventListener('mouseout', function () {
    resetEffect();
});
setImage();