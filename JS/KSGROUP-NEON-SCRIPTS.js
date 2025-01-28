const body = document.body;
const imageContainer = document.getElementById('KSGROUP-LOGO-SVG-WEBP');
const STRONADOLNAContainer = document.getElementById('KSGROUP-STRONA-DOLNA');
const liniaElement = document.getElementById('KSGROUP-LINIA');
const napisElement = document.getElementById('KSGROUP-NAPIS');
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
    STRONADOLNAContainer.style.display = 'none';
}
function activateEffect() {
    body.classList.add('hover-active');
    imageContainer.style.filter = 'brightness(0) saturate(100%) invert(24%) sepia(75%) saturate(5815%) hue-rotate(293deg) brightness(111%) contrast(129%)';
    const imageWidth = imageContainer.offsetWidth;
    STRONADOLNAContainer.style.display = 'block';
    liniaElement.style.width = `${imageWidth}px`;
    napisElement.style.width = `${imageWidth}px`;
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