(function () {
  const body = document.body;
  const image = document.getElementById('KSGROUP-LOGO-SVG');

  function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|ipad|iphone|ipod|blackberry|bb10|windows phone|mobile/i.test(userAgent);
  }

  function setImage() {
    const imageUrl = "https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg";
    if (image) image.setAttribute("src", imageUrl);
  }

  function ensureTheme() {
    const root = document.documentElement;
    const explicit = root.getAttribute('data-theme') || body.getAttribute('data-theme');
    if (explicit) {
      root.setAttribute('data-theme', explicit);
      return;
    }
    const host = (location.hostname || "").toLowerCase();
    const theme = host.includes("kozlowskisebastian") ? "neon" : "white";
    root.setAttribute('data-theme', theme);
  }

  function resetEffect() {
    body.classList.remove('hover-active');
  }

  function activateEffect() {
    body.classList.add('hover-active');
  }

  function bindEvents() {
    if (!image) return;
    image.addEventListener('touchstart', function () {
      if (body.classList.contains('hover-active')) {
        resetEffect();
      } else {
        activateEffect();
      }
    });
    body.addEventListener('mouseover', activateEffect);
    body.addEventListener('mouseout', resetEffect);
  }

  ensureTheme();
  setImage();
  bindEvents();
})();