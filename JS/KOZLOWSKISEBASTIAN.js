/**
 * KOZLOWSKISEBASTIAN.js
 * Wersja: 2025-08-15 r3
 * Cel: Na urządzeniach mobilnych tap = efekt jak hover na desktopie.
 *      Desktop bez zmian. Zero blokowania scrolla. Eliminacja duplikatów.
 */
(function () {
  'use strict';

  var body = document.body;
  var root = document.documentElement;
  var logo = document.getElementById('KSGROUP-LOGO-SVG');

  // Wykrywanie środowiska
  var canHover = false;
  try {
    canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (_) {}

  var isTouch = ('ontouchstart' in window) ||
    (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches);

  // Pomocnicze
  function setImage() {
    var imageUrl = 'https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg';
    if (logo && logo.getAttribute('src') !== imageUrl) {
      logo.setAttribute('src', imageUrl);
    }
  }
  function ensureTheme() {
    var explicit = root.getAttribute('data-theme') || body.getAttribute('data-theme');
    if (explicit) { root.setAttribute('data-theme', explicit); return; }
    var host = (location.hostname || '').toLowerCase();
    root.setAttribute('data-theme', host.includes('kozlowskisebastian') ? 'neon' : 'white');
  }
  function activateEffect(){ body.classList.add('hover-active'); }
  function resetEffect()   { body.classList.remove('hover-active'); }
  function toggleEffect()  { body.classList.toggle('hover-active'); }

  // Zachowanie desktop (bez zmian)
  function bindDesktop() {
    body.addEventListener('mouseover', activateEffect);
    body.addEventListener('mouseout', resetEffect);
  }

  // Zachowanie mobile (tap = toggle)
  function bindMobile() {
    var lastTouchTs = 0;
    var touchedRecently = function(){ return (Date.now() - lastTouchTs) < 600; };

    // touchstart – iOS/Android
    document.addEventListener('touchstart', function () {
      lastTouchTs = Date.now();
      toggleEffect();
    }, { passive: true });

    // pointerdown – nowe przeglądarki
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        if (!touchedRecently()) {
          lastTouchTs = Date.now();
          toggleEffect();
        }
      }
    }, { passive: true });

    // Fallback click (stare WebView) – tylko gdy nie było dotyku
    document.addEventListener('click', function () {
      if (!touchedRecently()) toggleEffect();
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

    // UX: brak podświetlenia tapu, bez wymuszania preventDefault
    try {
      body.style.webkitTapHighlightColor = 'transparent';
      if (typeof body.style.touchAction !== 'undefined') {
        body.style.touchAction = 'manipulation';
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
