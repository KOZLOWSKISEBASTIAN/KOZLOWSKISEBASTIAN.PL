(function () {
  const body = document.body;
  const image = document.getElementById('KSGROUP-LOGO-SVG');
  const bottom = document.getElementById('KSGROUP-STRONA-DOLNA');
  const linia = document.getElementById('KSGROUP-LINIA');
  const napis = document.getElementById('KSGROUP-NAPIS');

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
    if (bottom) bottom.style.display = 'none';
  }

  function activateEffect() {
    body.classList.add('hover-active');
    if (bottom) {
      bottom.style.display = 'block';
      const w = image ? image.offsetWidth : 0;
      if (linia) linia.style.width = w + "px";
      if (napis) napis.style.width = w + "px";
    }
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