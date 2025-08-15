
(function () {
  'use strict';

  var body = document.body;
  var root = document.documentElement;
  var logo = document.getElementById('KSGROUP-LOGO-SVG');
  var container = document.getElementById('KSGROUP-STRONA') || document;

  // Wykrywanie środowiska
  var canHover = false;
  try {
    canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (_) {}

  var isTouch = ('ontouchstart' in window) ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  // Pomocnicze
  function setImage() {
    // Jeżeli logo istnieje i nie ma src, ustaw domyślne (nie zmieniaj jeśli już jest)
    var imageUrl = 'https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg';
    if (logo && !logo.getAttribute('src')) {
      logo.setAttribute('src', imageUrl);
    }
  }

  function activateEffect(){ body.classList.add('hover-active'); }
  function resetEffect()   { body.classList.remove('hover-active'); }
  function toggleEffect()  { body.classList.toggle('hover-active'); }

  // Desktop
  function bindDesktop() {
    body.addEventListener('mouseenter', activateEffect);
    body.addEventListener('mouseleave', resetEffect);
    // dla pewności klasyczny hover
    body.addEventListener('mouseover', activateEffect);
    body.addEventListener('mouseout', function (e) {
      if (!body.contains(e.relatedTarget)) resetEffect();
    });
  }

  // Mobile
  function bindMobile() {
    var lastTouchTs = 0;
    var recent = function(){ return (Date.now() - lastTouchTs) < 600; };

    function onTouchLike() {
      lastTouchTs = Date.now();
      toggleEffect();
    }

    // Global
    document.addEventListener('touchstart', onTouchLike, { passive: true });
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        onTouchLike();
      }
    }, { passive: true });

    // Lokalne (logo / kontener), na wypadek dziwnych WebView
    if (logo) {
      logo.addEventListener('touchstart', onTouchLike, { passive: true });
      logo.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') onTouchLike();
      }, { passive: true });
      logo.addEventListener('click', function () {
        if (!recent()) toggleEffect();
      }, { passive: true });
    }
    if (container && container !== document) {
      container.addEventListener('touchstart', onTouchLike, { passive: true });
      container.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') onTouchLike();
      }, { passive: true });
      container.addEventListener('click', function () {
        if (!recent()) toggleEffect();
      }, { passive: true });
    }

    // Fallback click globalnie
    document.addEventListener('click', function () {
      if (!recent()) toggleEffect();
    }, { passive: true });
  }

  function init() {
    setImage();

    if (canHover && !isTouch) {
      bindDesktop();
    } else {
      bindMobile();
    }

    // UX: nie ingerujemy w theme; tylko kosmetyka tap-highlight
    try {
      body.style.webkitTapHighlightColor = 'transparent';
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
