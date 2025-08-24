/* ODSYLACZ.js — desktop: ikony SVG, TYLKO mobile: napisy z aria-label (bez ładowania SVG) + tablet wrap-fillers */

(function(){
  const BASE    = "https://kozlowskisebastian.pl/GRAFIKA/";
  const ICON_H  = 44;
  const MIN_W   = 28;
  const MQ_MOBILE = window.matchMedia('(max-width: 1000px)');
  const MQ_TABLET_WRAP = window.matchMedia('(min-width: 1001px) and (max-width: 1578px)');
  const IS_MOBILE = () => MQ_MOBILE.matches;
  const IS_TABLET_WRAP = () => MQ_TABLET_WRAP.matches;

  /* ——— DESKTOP: ustaw maskę i szerokość ikony ——— */
  function applyIcon(btn){
    // Na mobile nie ustawiamy masek i nie ładujemy SVG
    if (IS_MOBILE()) return;

    let file = (btn.dataset.ikon || "").trim();
    if (!file) return;
    if (!/\.(svg)(\?|#|$)/i.test(file)) file += ".svg";
    const url = BASE + encodeURIComponent(file);

    btn.style.setProperty('--mask', `url("${url}")`);
    btn.textContent = ""; // desktop: same ikony (tekst ukryty w CSS)

    const img = new Image();
    img.onload = () => {
      const nh = img.naturalHeight || ICON_H;
      const nw = img.naturalWidth  || ICON_H;
      const width = Math.max(MIN_W, Math.round(ICON_H * (nw / nh)));
      btn.style.setProperty('--w', width + 'px');
      btn.style.width = width + 'px';
      const row = btn.closest('.WIERSZ'); if (row) adjustGhosts(row);
    };
    img.onerror = () => {
      btn.style.setProperty('--w', ICON_H + 'px');
      btn.style.width = ICON_H + 'px';
      const row = btn.closest('.WIERSZ'); if (row) adjustGhosts(row);
    };
    img.src = url;
  }

  function getGapPx(row){
    const cs = getComputedStyle(row);
    const g = parseFloat(cs.columnGap || cs.gap || '7') || 7;
    return Math.max(0, g);
  }

  /* ——— TABLET: dodaj wypełniacze per rząd ——— */
  function adjustGhosts(row){
    if (!row) return;

    // Usuń wcześniej dodane fillery
    row.querySelectorAll('.PRZYCISK.PUSTY[data-filler="1"]').forEach(n => n.remove());

    // mobile: zero wypełniaczy, desktop duży: klasyczny jeden (zostawiony w HTML)
    if (IS_MOBILE()) return;

    const children = Array.from(row.children).filter(el => !el.classList.contains('PUSTY'));
    if (!children.length) return;

    if (IS_TABLET_WRAP()) {
      // podział na linie
      const lines = [];
      let currentTop = null;
      let line = [];
      children.forEach(el => {
        const r = el.getBoundingClientRect();
        const top = Math.round(r.top);
        if (currentTop === null) currentTop = top;
        if (Math.abs(top - currentTop) <= 2) {
          line.push(el);
        } else {
          lines.push(line);
          line = [el];
          currentTop = top;
        }
      });
      if (line.length) lines.push(line);

      const gap = getGapPx(row);
      const rowW = row.getBoundingClientRect().width;

      lines.forEach(items => {
        const sumW = items.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0);
        const gapsTotal = Math.max(0, (items.length - 1)) * gap;
        let W = Math.floor(rowW - sumW - gapsTotal);
        if (W < 0) W = 0;

        // wstaw filler za ostatnim elementem w linii
        const filler = document.createElement(items[0].tagName === 'A' ? 'a' : 'button');
        filler.className = 'PRZYCISK PUSTY';
        filler.setAttribute('aria-hidden', 'true');
        filler.setAttribute('data-filler', '1');
        filler.style.width = W + 'px';

        const last = items[items.length - 1];
        last.after(filler);
      });
    } else {
      // duży desktop: przelicz klasyczny pierwszy wierszowy wypełniacz, jeśli istnieje
      const ghost = row.querySelector('.PRZYCISK.PUSTY:not([data-filler="1"])');
      if (!ghost) return;

      const gap = getGapPx(row);
      const sumWidths = children.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0);
      const gapsTotal = children.length * gap;
      const rowW = row.getBoundingClientRect().width;
      let W = Math.floor(rowW - sumWidths - gapsTotal);
      if (W < 0) W = 0;
      ghost.style.width = W + 'px';
    }
  }

  function adjustAllGhosts(){
    document.querySelectorAll('.WIERSZ').forEach(adjustGhosts);
  }

  function layoutAll(){
    document.querySelectorAll('.PRZYCISK.IKONA').forEach(applyIcon);
    requestAnimationFrame(adjustAllGhosts);
  }

  /* ——— Klik chrome:// (desktop) ——— */
  function handleChromeUrl(url){
    try { navigator.clipboard?.writeText(url); } catch(e) {}
    try { window.open('about:blank', '_blank', 'noopener'); } catch(e) {}
  }
  function initSingleClicks(){
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a.PRZYCISK.IKONA');
      if (!a) return;
      const href = a.getAttribute('href') || "";
      if (/^chrome:\/\//i.test(href)) {
        e.preventDefault();
        handleChromeUrl(href);
      }
    }, { passive: false });
  }

  function initOpenAll(){
    document.querySelectorAll('[data-open-all]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.WIERSZ');
        if (!row) return;
        const links = Array.from(row.querySelectorAll('a.PRZYCISK.IKONA')).map(a => a.href);
        links.forEach((href, i) => {
          setTimeout(() => {
            if (/^chrome:\/\//i.test(href)) handleChromeUrl(href);
            else window.open(href, "_blank", "noopener");
          }, i * 120);
        });
      });
    });
  }

  /* ——— TYLKO MOBILE: wymuś napisy z aria‑label i usuń pozostałości po SVG ——— */
  function convertIconsToText() {
    if (!IS_MOBILE()) return;

    document.querySelectorAll('.PRZYCISK.IKONA').forEach(btn => {
      // 1) Tekst z aria-label (priorytet)
      let label = btn.getAttribute('aria-label') || btn.dataset.label || '';
      if (!label) {
        const href = btn.getAttribute('href') || '';
        try { label = new URL(href).hostname.replace(/^www\./,''); } catch(e){ label = 'LINK'; }
      }
      btn.textContent = label;

      // 2) Usuń ewentualne pozostałości po desktopie
      btn.style.removeProperty('--mask');
      btn.style.removeProperty('--w');
      btn.style.removeProperty('width');
      btn.style.webkitMaskImage = 'none';
      btn.style.maskImage = 'none';
      btn.style.backgroundImage = 'none';
    });
  }

  function syncMode(){
    if (IS_MOBILE()) {
      convertIconsToText();     // mobile: tylko napisy
      adjustAllGhosts();
    } else {
      layoutAll();              // tablet + desktop: ikony
    }
  }

  function bindRelayout(){
    const relayout = () => syncMode();
    MQ_MOBILE.addEventListener ? MQ_MOBILE.addEventListener('change', relayout) : MQ_MOBILE.addListener(relayout);
    MQ_TABLET_WRAP.addEventListener ? MQ_TABLET_WRAP.addEventListener('change', relayout) : MQ_TABLET_WRAP.addListener(relayout);
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout).catch(()=>{});
  }

  function init(){
    syncMode();
    initSingleClicks();
    initOpenAll();
    bindRelayout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();