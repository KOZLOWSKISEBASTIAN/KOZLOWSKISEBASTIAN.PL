(function () {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  const logo = document.getElementById('KSGROUP-LOGO-SVG');

  const canHover = !!(window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  const isTouch = 'ontouchstart' in window ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  function setImage() {
    const imageUrl = 'https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg';
    if (logo && logo.getAttribute('src') !== imageUrl) {
      logo.setAttribute('src', imageUrl);
    }
  }

  function ensureTheme() {
    const explicit = root.getAttribute('data-theme') || body.getAttribute('data-theme');
    if (explicit) { root.setAttribute('data-theme', explicit); return; }
    const host = (location.hostname || '').toLowerCase();
    root.setAttribute('data-theme', host.includes('kozlowskisebastian') ? 'neon' : 'white');
  }

  function activateEffect() { body.classList.add('hover-active'); }
  function resetEffect()    { body.classList.remove('hover-active'); }
  function toggleEffect()   { body.classList.toggle('hover-active'); }

  function bindDesktop() {
    body.addEventListener('mouseover', activateEffect);
    body.addEventListener('mouseout', resetEffect);
  }

  function bindMobile() {
    let lastTouchAt = 0;

    document.addEventListener('touchstart', function () {
      lastTouchAt = Date.now();
      toggleEffect();
    }, { passive: true });

    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        lastTouchAt = Date.now();
        toggleEffect();
      }
    }, { passive: true });

    document.addEventListener('click', function () {
      if (Date.now() - lastTouchAt > 500) {
        toggleEffect();
      }
    }, { passive: true });
  }

  function init() {
    ensureTheme();
    setImage();
    if (canHover && !isTouch) {
      bindDesktop();
    } else {
      bindMobile();
    }

    try {
      document.body.style.webkitTapHighlightColor = 'transparent';
      if (typeof document.body.style.touchAction !== 'undefined') {
        document.body.style.touchAction = 'manipulation';
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
