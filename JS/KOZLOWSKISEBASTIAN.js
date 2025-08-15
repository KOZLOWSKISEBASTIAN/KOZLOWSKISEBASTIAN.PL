(function () {
  const body = document.body;
  const image = document.getElementById('KSGROUP-LOGO-SVG');
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function setImage() {
    const imageUrl = "https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg";
    if (image && image.getAttribute('src') !== imageUrl) {
      image.setAttribute("src", imageUrl);
    }
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

  function toggleEffect() {
    if (body.classList.contains('hover-active')) resetEffect();
    else activateEffect();
  }

  function bindEvents() {
    if (!image) return;

    image.addEventListener('touchstart', function (e) {
      e.preventDefault();
      toggleEffect();
    }, { passive: false });

    if (canHover) {
      body.addEventListener('mouseover', activateEffect);
      body.addEventListener('mouseout', resetEffect);
    }
  }

  ensureTheme();
  setImage();
  bindEvents();
})();
(function () {
  const body = document.body;
  const image = document.getElementById('KSGROUP-LOGO-SVG');
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function setImage() {
    const imageUrl = "https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg";
    if (image && image.getAttribute('src') !== imageUrl) {
      image.setAttribute("src", imageUrl);
    }
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

  function toggleEffect() {
    if (body.classList.contains('hover-active')) resetEffect();
    else activateEffect();
  }

  function bindEvents() {
    if (!image) return;

    // Mobile / touch: sterujemy tylko dotykiem, bez zdarzeń myszy
    image.addEventListener('touchstart', function (e) {
      e.preventDefault(); // zapobiega syntetycznym kliknięciom/mouseover
      toggleEffect();
    }, { passive: false });

    // Desktop: klasyczny hover
    if (canHover) {
      body.addEventListener('mouseover', activateEffect);
      body.addEventListener('mouseout', resetEffect);
    }
  }

  // Init
  ensureTheme();
  setImage();
  bindEvents();
})();


/* === MOBILE TOUCH PATCH (non-destructive) r5 ===
   Nie zmienia motywu/kolorów. Desktop hover bez zmian.
   Mobile: tap = ten sam efekt co hover (klasa 'hover-active').
*/
(function () {
  'use strict';
  try {
    var body = document.body;
    var logo = document.getElementById('KSGROUP-LOGO-SVG');
    var container = document.getElementById('KSGROUP-STRONA') || document;

    var canHover = false;
    try {
      canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (e) {}

    var isTouch = ('ontouchstart' in window) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    function activate(){ body.classList.add('hover-active'); }
    function reset()  { body.classList.remove('hover-active'); }
    function toggle() { body.classList.toggle('hover-active'); }

    function bindDesktop() {
      // Nie dotykamy istniejących handlerów, tylko uzupełniamy
      body.addEventListener('mouseenter', activate);
      body.addEventListener('mouseleave', reset);
    }

    function bindMobile() {
      var lastTs = 0;
      function onTouchLike() { lastTs = Date.now(); toggle(); }

      // Global – działa w iOS/Android + nowe WebView
      document.addEventListener('touchstart', onTouchLike, { passive: true });
      document.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') onTouchLike();
      }, { passive: true });

      // Fallback na klik (stare webview), ale ignoruj po świeżym dotyku
      document.addEventListener('click', function () {
        if (Date.now() - lastTs > 600) toggle();
      }, { passive: true });

      // Dodatkowo lokalnie na logo/kontener
      if (logo) {
        logo.addEventListener('touchstart', onTouchLike, { passive: true });
        logo.addEventListener('pointerdown', function (e) {
          if (e.pointerType === 'touch' || e.pointerType === 'pen') onTouchLike();
        }, { passive: true });
      }
      if (container && container !== document) {
        container.addEventListener('touchstart', onTouchLike, { passive: true });
        container.addEventListener('pointerdown', function (e) {
          if (e.pointerType === 'touch' || e.pointerType === 'pen') onTouchLike();
        }, { passive: true });
      }
    }

    if (canHover && !isTouch) { bindDesktop(); } else { bindMobile(); }

    try { body.style.webkitTapHighlightColor = 'transparent'; } catch (e) {}
  } catch (e) {}
})();
// === END PATCH r5 ===
