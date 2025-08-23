(function(){
  const BASE = "https://kozlowskisebastian.pl/GRAFIKA/";
  const ICON_H = 44;

  function applyIcon(btn){
    let file = (btn.dataset.ikon || "").trim();
    if (!file) return;

    if (!/\.(svg)(\?|#|$)/i.test(file)) file += ".svg";

    const url = BASE + encodeURIComponent(file);

    btn.style.setProperty('--mask', `url("${url}")`);
    btn.style.setProperty('--h', ICON_H + 'px');

    btn.textContent = "";

    const img = new Image();
    img.onload = () => {
      const nh = img.naturalHeight || ICON_H;
      const nw = img.naturalWidth  || ICON_H;
      const width = Math.max(28, Math.round(ICON_H * (nw / nh)));
      btn.style.setProperty('--w', width + 'px');
    };
    img.onerror = () => {
      btn.style.setProperty('--w', ICON_H + 'px');
    };
    img.src = url;
  }

  document.querySelectorAll('.PRZYCISK.IKONA').forEach(applyIcon);

  function handleChromeUrl(url){
    try { navigator.clipboard?.writeText(url); } catch(e) {}
    try { window.open(url, "_blank", "noopener"); } catch(e) {}
  }

    document.addEventListener('click', (e) => {
    const a = e.target.closest('a.PRZYCISK.IKONA');
    if (!a) return;
    const href = a.getAttribute('href') || "";
    if (/^chrome:\/\//i.test(href)) {
      e.preventDefault();
      handleChromeUrl(href);
    }
  }, { passive: false });

  function openOne(url){
    if (/^chrome:\/\//i.test(url)) { handleChromeUrl(url); return; }
    window.open(url, "_blank", "noopener");
  }

    document.querySelectorAll('[data-open-all]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('[data-wiersz]');
      if (!row) return;
      const links = Array.from(row.querySelectorAll('a.PRZYCISK.IKONA')).map(a => a.href);
      links.forEach((href, i) => setTimeout(() => openOne(href), i * 120));
    });
  });
})();
