(function(){
  const BASE    = "https://kozlowskisebastian.pl/GRAFIKA/";
  const ICON_H  = 44;
  const MIN_W   = 28;

  function applyIcon(btn){
    let file = (btn.dataset.ikon || "").trim();
    if (!file) return;
    if (!/\.(svg)(\?|#|$)/i.test(file)) file += ".svg";
    const url = BASE + encodeURIComponent(file);

    btn.style.setProperty('--mask', `url("${url}")`);
    btn.textContent = "";

    const img = new Image();
    img.onload = () => {
      const nh = img.naturalHeight || ICON_H;
      const nw = img.naturalWidth  || ICON_H;
      const width = Math.max(MIN_W, Math.round(ICON_H * (nw / nh)));
      btn.style.setProperty('--w', width + 'px');
      btn.style.width = width + 'px';

      const row = btn.closest('.WIERSZ');
      if (row) adjustGhost(row);
    };
    img.onerror = () => {
      btn.style.setProperty('--w', ICON_H + 'px');
      btn.style.width = ICON_H + 'px';
      const row = btn.closest('.WIERSZ');
      if (row) adjustGhost(row);
    };
    img.src = url;
  }

  function getGapPx(row){
    const cs = getComputedStyle(row);
    const g = parseFloat(cs.columnGap || cs.gap || '7') || 7;
    return Math.max(0, g);
  }

  function adjustGhost(row){
    const ghost = row.querySelector('.PRZYCISK.PUSTY');
    if (!ghost) return;

    const others = Array.from(row.children).filter(el => !el.classList.contains('PUSTY'));

    if (!others.length) { ghost.style.width = '0px'; return; }

    const gap = getGapPx(row);
    const sumWidths = others.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0);
    const gapsCount = others.length;
    const gapsTotal = gapsCount * gap;
    const rowW = row.getBoundingClientRect().width;

    let W = Math.floor(rowW - sumWidths - gapsTotal);
    if (W < 0) W = 0;

    ghost.style.width = W + 'px';
  }

  function adjustAllGhosts(){
    document.querySelectorAll('.WIERSZ').forEach(adjustGhost);
  }

  function layoutAll(){
    document.querySelectorAll('.PRZYCISK.IKONA').forEach(applyIcon);
    requestAnimationFrame(adjustAllGhosts);
  }

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

  function bindRelayout(){
    const relayout = () => { adjustAllGhosts(); };
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout).catch(()=>{});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      layoutAll(); initSingleClicks(); initOpenAll(); bindRelayout();
    }, { once:true });
  } else {
    layoutAll(); initSingleClicks(); initOpenAll(); bindRelayout();
  }
})();
