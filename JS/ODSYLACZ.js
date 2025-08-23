// ODSYLACZ.js — ikony jako maski, rozciąganie kafelków (z min-width), „otwórz wszystkie”, ciche chrome://
(function(){
  const BASE   = "https://kozlowskisebastian.pl/GRAFIKA/";
  const ICON_H = 44; // px – stała wysokość kafelka/ikony
  const MIN_W  = 44; // px – minimalna szerokość, żeby kafelki nie znikały

  function applyIcon(btn){
    let file = (btn.dataset.ikon || "").trim();
    if (!file) return;

    // dopnij .svg, jeśli brak
    if (!/\.(svg)(\?|#|$)/i.test(file)) file += ".svg";

    const url = BASE + encodeURIComponent(file);

    // maska w ::before + stała wysokość
    btn.style.setProperty('--mask', `url("${url}")`);
    btn.style.setProperty('--h', ICON_H + 'px');

    // ukryj ewentualny tekst (zostaje aria-label)
    btn.textContent = "";

    const isOpenAll = btn.classList.contains('OTWORZ');

    if (!isOpenAll) {
      // Rozciągane kafelki: niech rosną, ale mają minimum 44px,
      // oraz startowy flex-basis ~120px (ładne „wyjustowanie”).
      btn.style.width    = 'auto';
      btn.style.flex     = '1 1 120px';
      btn.style.minWidth = MIN_W + 'px';
    } else {
      // ŁAPA – kompaktowa szerokość wg naturalnych proporcji SVG
      const img = new Image();
      img.onload = () => {
        const nh = img.naturalHeight || ICON_H;
        const nw = img.naturalWidth  || ICON_H;
        const width = Math.max(MIN_W, Math.round(ICON_H * (nw / nh)));
        btn.style.removeProperty('flex');
        btn.style.minWidth = MIN_W + 'px';
        btn.style.width    = width + 'px';
      };
      img.onerror = () => {
        btn.style.removeProperty('flex');
        btn.style.minWidth = MIN_W + 'px';
        btn.style.width    = ICON_H + 'px';
      };
      img.src = url;
    }
  }

  function initIcons(){
    document.querySelectorAll('.PRZYCISK.IKONA').forEach(applyIcon);
  }

  // — chrome:// obsługa: kopiuj do schowka + spróbuj otworzyć nową kartę (bez komunikatów) —
  function handleChromeUrl(url){
    try { navigator.clipboard?.writeText(url); } catch(e) {}
    try { window.open(url, "_blank", "noopener"); } catch(e) {}
  }

  // Delegacja kliknięć na ikony (pojedyncze)
  function initClicks(){
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a.PRZYCISK.IKONA');
      if (!a) return;
      const href = a.getAttribute('href') || "";
      if (/^chrome:\/\//i.test(href)) {
        e.preventDefault();
        handleChromeUrl(href);
      }
    }, { passive: false });

    // „Otwórz wszystkie” – w obrębie wiersza
    document.querySelectorAll('[data-open-all]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('[data-wiersz]');
        if (!row) return;
        const links = Array.from(row.querySelectorAll('a.PRZYCISK.IKONA')).map(a => a.href);
        links.forEach((href, i) => setTimeout(() => {
          if (/^chrome:\/\//i.test(href)) handleChromeUrl(href);
          else window.open(href, "_blank", "noopener");
        }, i * 120));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initIcons(); initClicks(); }, { once:true });
  } else {
    initIcons(); initClicks();
  }

  // Przy zmianie orientacji przelicz tylko ŁAPĘ (reszta rozciąga się z flexem)
  window.addEventListener('orientationchange', () => {
    document.querySelectorAll('.PRZYCISK.IKONA.OTWORZ').forEach(btn => {
      let file = (btn.dataset.ikon || "").trim();
      if (!file) return;
      if (!/\.(svg)(\?|#|$)/i.test(file)) file += ".svg";
      const url = BASE + encodeURIComponent(file);

      const img = new Image();
      img.onload = () => {
        const nh = img.naturalHeight || ICON_H;
        const nw = img.naturalWidth  || ICON_H;
        const width = Math.max(MIN_W, Math.round(ICON_H * (nw / nh)));
        btn.style.removeProperty('flex');
        btn.style.minWidth = MIN_W + 'px';
        btn.style.width    = width + 'px';
      };
      img.onerror = () => {
        btn.style.removeProperty('flex');
        btn.style.minWidth = MIN_W + 'px';
        btn.style.width    = ICON_H + 'px';
      };
      img.src = url;
    });
  });
})();
