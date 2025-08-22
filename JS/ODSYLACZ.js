// ODSYLACZ.js — ikony jako maski + szerokość wg proporcji SVG + „otwórz wszystkie”
(function(){
  const BASE = "https://kozlowskisebastian.pl/GRAFIKA/";
  const ICON_H = 44; // px – docelowa wysokość płytek/ikon

  // Ustaw maskę (ikona) i rzeczywistą szerokość wg naturalnych proporcji SVG
  function applyIcon(btn){
    const file = btn.dataset.ikon;
    if (!file) return;
    const url = BASE + file;

    // ustaw maskę (dla WebKit i standardu)
    btn.style.setProperty('--mask', `url("${url}")`);
    btn.style.setProperty('--h', ICON_H + 'px');

    // ukryj widoczny tekst (zostaje aria-label)
    btn.textContent = "";

    // wyznacz szerokość z proporcji naturalnych
    const img = new Image();
    img.onload = () => {
      // fallback, gdy SVG nie zwraca naturalHeight: przyjmij kwadrat
      const nh = img.naturalHeight || ICON_H;
      const nw = img.naturalWidth  || ICON_H;
      const width = Math.max(28, Math.round(ICON_H * (nw / nh)));
      btn.style.setProperty('--w', width + 'px');
    };
    img.onerror = () => {
      // w razie kłopotu – bezpieczny kwadrat
      btn.style.setProperty('--w', ICON_H + 'px');
    };
    // wymuszenie pobrania by poznać naturalne wymiary
    img.src = url;
  }

  function initIcons(){
    document.querySelectorAll('.PRZYCISK.IKONA').forEach(applyIcon);
  }

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
  function initOpenAll(){
    document.querySelectorAll('[data-open-all]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('[data-wiersz]');
        if (!row) return;
        const links = Array
          .from(row.querySelectorAll('a.PRZYCISK.IKONA')) // <-- już nie wymagamy [data-link]
          .map(a => a.href)
          .filter(Boolean);
        links.forEach((href, i) => setTimeout(() => openOne(href), i * 120));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initIcons(); initOpenAll(); }, { once:true });
  } else {
    initIcons(); initOpenAll();
  }
})();