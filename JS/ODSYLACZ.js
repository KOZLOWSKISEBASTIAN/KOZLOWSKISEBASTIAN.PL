// ODSYLACZ.js — ikony jako maski + szerokość wg proporcji SVG + „otwórz wszystkie”
(function(){
  const BASE = "https://kozlowskisebastian.pl/GRAFIKA/";
  const ICON_H = 44; // px – docelowa wysokość płytek/ikon

  // Ustaw maskę (ikona) i rzeczywistą szerokość wg naturalnych proporcji SVG
  function applyIcon(btn){
    let file = (btn.dataset.ikon || "").trim();
    if (!file) return;

    // jeśli nie ma rozszerzenia .svg -> dopnij
    if (!/\.(svg)(\?|#|$)/i.test(file)) file += ".svg";

    // pełny URL ikony
    const url = BASE + encodeURIComponent(file);

    // ustaw maskę (dla WebKit i standardu)
    btn.style.setProperty('--mask', `url("${url}")`);
    btn.style.setProperty('--h', ICON_H + 'px');

    // ukryj jakikolwiek tekst (zostaje aria-label dla dostępności)
    btn.textContent = "";

    // wyznacz szerokość z proporcji naturalnych (fallback: kwadrat)
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

  // Przypisz ikony dla wszystkich przycisków-ikon
  document.querySelectorAll('.PRZYCISK.IKONA').forEach(applyIcon);

  // Jedno-klikowe otwieranie adresów chrome:// jest blokowane —
  // kopiujemy do schowka i prosimy o ręczne wklejenie.
  function openOne(url){
    if (/^chrome:\/\//i.test(url)) {
      navigator.clipboard?.writeText(url).catch(()=>{});
      alert(`Adres "${url}" skopiowano do schowka. Otwórz nową kartę, wklej (Ctrl+V) i Enter.`);
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  // „Otwórz wszystkie” – w obrębie wiersza
  document.querySelectorAll('[data-open-all]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('[data-wiersz]');
      if (!row) return;
      const links = Array.from(row.querySelectorAll('a.PRZYCISK.IKONA')).map(a => a.href);
      links.forEach((href, i) => setTimeout(() => openOne(href), i * 120));
    });
  });
})();
