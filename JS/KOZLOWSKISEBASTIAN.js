// KOZLOWSKISEBASTIAN.js — minimal, single-block (no patches)
(function () {
  'use strict';
  const body  = document.body;
  const image = document.getElementById('KSGROUP-LOGO-SVG');
  const canHover = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function setImage() {
    const url = "https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg";
    if (image && image.getAttribute('src') !== url) image.setAttribute('src', url);
  }

  function ensureTheme() {
    const root = document.documentElement;
    const explicit = root.getAttribute('data-theme') || body.getAttribute('data-theme');
    if (explicit) { root.setAttribute('data-theme', explicit); return; }
    const theme = (location.hostname || '').toLowerCase().includes('kozlowskisebastian') ? 'neon' : 'white';
    root.setAttribute('data-theme', theme);
  }

  function on()  { body.classList.add('hover-active'); }
  function off() { body.classList.remove('hover-active'); }
  function toggle(){ body.classList.toggle('hover-active'); }

  function bind() {
    if (!image) return;

    // Mobile: tap only on image (no preventDefault; scroll unaffected)
    let t = 0;
    image.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') { t = Date.now(); toggle(); }
    }, { passive: true });
    image.addEventListener('touchstart', () => { t = Date.now(); toggle(); }, { passive: true });
    image.addEventListener('click', () => { if (!canHover && Date.now() - t > 500) toggle(); }, { passive: true });

    // Desktop: classic hover on body
    if (canHover) {
      body.addEventListener('mouseover', on);
      body.addEventListener('mouseout', off);
    }
  }

  ensureTheme();
  setImage();
  bind();
})();
