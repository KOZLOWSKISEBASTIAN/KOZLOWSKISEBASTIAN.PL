(function () {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  const logo = document.getElementById('KSGROUP-LOGO-SVG');

  const canHover = !!(window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  const isTouch = !!((window.matchMedia &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
    ('ontouchstart' in window));

  function setImage() {
    const imageUrl = 'https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg';
    if (logo && logo.getAttribute('src') !== imageUrl) {
      logo.setAttribute('src', imageUrl);
    }
  }

  function ensureTheme() {
    const explicit = root.getAttribute('data-theme') || body.getAttribute('data-theme');
    if (explicit) {
      root.setAttribute('data-theme', explicit);
      return;
    }
    const host = (location.hostname || '').toLowerCase();
    const theme = host.includes('kozlowskisebastian') ? 'neon' : 'white';
    root.setAttribute('data-theme', theme);
  }

  function activateEffect() { body.classList.add('hover-active'); }
  function resetEffect() { body.classList.remove('hover-active'); }
  function toggleEffect() { body.classList.toggle('hover-active'); }

  function bindDesktop() {
    body.addEventListener('mouseover', activateEffect);
    body.addEventListener('mouseout', resetEffect);
  }

  function bindMobile() {
    let lastTouchTime = 0;

    body.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        lastTouchTime = Date.now();
        e.preventDefault();
        toggleEffect();
      }
    }, { passive: false });

    body.addEventListener('touchstart', function (e) {
      lastTouchTime = Date.now();
      e.preventDefault();
      toggleEffect();
    }, { passive: false });

    body.addEventListener('click', function () {
      if (Date.now() - lastTouchTime > 500) {
        toggleEffect();
      }
    });
  }

  function init() {
    ensureTheme();
    setImage();

    if (canHover) {
      bindDesktop();
    } else if (isTouch) {
      bindMobile();
    } else {
      bindDesktop();
    }

    try {
      root.style.setProperty('--tap-hl', 'transparent');
      document.body.style.webkitTapHighlightColor = 'transparent';
      if (typeof document.body.style.touchAction !== 'undefined') {
        document.body.style.touchAction = 'manipulation';
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
