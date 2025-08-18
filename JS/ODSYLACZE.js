(function(){
  const BAZA = new URL('https://kozlowskisebastian.pl', document.baseURI);

  const SCIEZKI = new Map([
    ["KARTY", "KARTY"],
    ["NOTATNIK", "NOTATNIK"],
    ["KALKULATOR", "KALKULATOR"],
    ["LICZYDŁO", "LICZYDLO"],
    ["LATARKA", null],
    ["POGODA", null],
    ["GENERATOR", "GENERATOR"],
    ["PRZYBORNIK", "PRZYBORNIK"],
  ]);

  document.querySelectorAll('[data-klucz]').forEach(EL => {
    const KLUCZ = EL.getAttribute('data-klucz');
    const SCIEZKA = SCIEZKI.get(KLUCZ);
    if (SCIEZKA) {
      EL.href = new URL(SCIEZKA + '/', BAZA).href;
    } else {
      EL.setAttribute('tabindex', '-1');
      EL.addEventListener('click', E => E.preventDefault());
    }
  });
})();


/* === AUTOFIT === */
(function(){
  const SELECTOR = '.PRZYCISK';

  function ensureLabel(btn){
    let label = btn.querySelector('.LABEL_SKALUJ');
    if (!label){
      const txt = btn.textContent.trim();
      if (!txt) return null;
      btn.textContent = '';
      label = document.createElement('span');
      label.className = 'LABEL_SKALUJ';
      label.style.display = 'inline-block';
      label.style.whiteSpace = 'nowrap';
      label.style.transformOrigin = 'center center';
      label.style.lineHeight = '1';
      label.textContent = txt;
      if (!btn.style.overflow) btn.style.overflow = 'hidden';
      // dopilnuj centrowania po stronie kontenera (gdy nie ma flex)
      if (!btn.style.textAlign) btn.style.textAlign = 'center';
      btn.appendChild(label);
    }
    return label;
  }

  function fitOne(btn){
  const label = ensureLabel(btn);
  if (!label) return;

  // Ustawienia do centrowania „od środka” niezależnie od skali
  if (!btn.style.position || btn.style.position === '') btn.style.position = 'relative';
  label.style.position = 'absolute';
  label.style.left = '50%';
  label.style.top = '50%';
  label.style.transformOrigin = 'center center';

  // Reset transform do pomiaru
  label.style.transform = 'translate(-50%, -50%) scale(1,1)';

  const availW = Math.max(1, btn.clientWidth);
  const needW  = Math.max(1, label.scrollWidth);

  let scaleX = availW / needW;

  // Skala tylko w osi X, przesunięcie -50% gwarantuje idealne wyśrodkowanie
  var bumpPx = (label.textContent.trim() === 'KARTY') ? 1 : 0;
label.style.transform = 'translate(calc(-50% - ' + bumpPx + 'px), -50%) scale(' + scaleX.toFixed(3) + ',1)';
}

  function fitAll(){
    document.querySelectorAll(SELECTOR).forEach(fitOne);
  }

  // Debounce + dogrywki
  let t1 = null;
  function scheduleFit(ms = 0){
    if (t1) clearTimeout(t1);
    t1 = setTimeout(() => {
      requestAnimationFrame(() => {
        fitAll();
        setTimeout(fitAll, 60);
        setTimeout(fitAll, 160);
      });
    }, ms);
  }

  function initial(){
    fitAll();
    requestAnimationFrame(() => scheduleFit(0));
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initial, { once:true });
  } else {
    initial();
  }

})();
/* === KONIEC AUTOFIT === */

// --- ROZCIĄGANIE NAPISÓW OD LEWEJ DO PRAWEJ KRAWĘDZI — v2 (flex:1 + observer + fonts.ready) ---
(function () {
  const BTN_SEL = [
    'a.PRZYCISK',
    'button.PRZYCISK',
    '.PRZYCISK_PRZYBORNIK_POWROT',
    '.PRZYCISK_KLAWISZ',
    '.PRZYCISK--KLAWISZ',
    '.PRZYBORNIK_PRZYCISK_POLOWA .half'
  ].join(',');

  function pickLabel(btn) {
    // preferowane istniejące etykiety
    let label = btn.querySelector('.LABEL_SKALUJ, .WASKI_TEKST, span');
    if (label) return label;
    // fallback: owiń goły tekst w span
    const textNodes = Array.from(btn.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim());
    if (textNodes.length) {
      const span = document.createElement('span');
      btn.insertBefore(span, btn.firstChild);
      textNodes.forEach(n => span.appendChild(n));
      return span;
    }
    return null;
  }

  function measureRaw(el) {
    // na czas pomiaru wyłącz dodatkowe spacingi
    const prevLetter = el.style.letterSpacing;
    const prevWord = el.style.wordSpacing;
    el.style.letterSpacing = 'normal';
    el.style.wordSpacing = 'normal';
    // sklonuj jako offscreen do precyzyjnego pomiaru bez szerokości 100%
    const clone = el.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.width = 'auto';
    clone.style.whiteSpace = 'pre';
    clone.style.display = 'inline-block';
    el.parentNode.appendChild(clone);
    const w = clone.getBoundingClientRect().width;
    clone.remove();
    // przywróć
    el.style.letterSpacing = prevLetter;
    el.style.wordSpacing = prevWord;
    return w;
  }

  function countWordGaps(str) { return (str.trim().match(/\s+/g) || []).length; }
  function countLetterGaps(str) {
    const s = str.replace(/\s+/g, '');
    return Math.max(s.length - 1, 0);
  }

  function justifyButton(btn) {
    const label = pickLabel(btn);
    if (!label) return;

    // Etykieta musi wypełnić dostępną szerokość w layoucie flex
    label.style.display = 'block';
    label.style.flex = '1 1 auto';
    label.style.width = '100%';
    label.style.transform = 'none';
    label.style.textAlign = 'left';
    label.style.whiteSpace = 'normal';

    // Zresetuj spacingi przed pomiarem
    label.style.wordSpacing = 'normal';
    label.style.letterSpacing = 'normal';

    // Wymuś reflow po zmianach stylu
    void label.offsetWidth;

    const available = label.clientWidth;
    const text = (label.textContent || '').trim();
    if (!available || !text) return;

    const raw = measureRaw(label);
    const delta = available - raw;

    if (delta <= 0.5) {
      label.style.wordSpacing = 'normal';
      label.style.letterSpacing = 'normal';
      return;
    }

    const words = countWordGaps(text);
    if (words > 0) {
      label.style.wordSpacing = (delta / words) + 'px';
      label.style.letterSpacing = 'normal';
    } else {
      const gaps = countLetterGaps(text);
      if (gaps > 0) {
        label.style.letterSpacing = (delta / gaps) + 'px';
        label.style.wordSpacing = 'normal';
      } else {
        label.style.wordSpacing = 'normal';
        label.style.letterSpacing = 'normal';
      }
    }
  }

  function runAll() { document.querySelectorAll(BTN_SEL).forEach(justifyButton); }

  function scheduleRun() { requestAnimationFrame(() => requestAnimationFrame(runAll)); }

  // Inicjalizacja po gotowości dokumentu i fontów
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRun);
  } else {
    scheduleRun();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleRun).catch(()=>{});
  }

  // Reakcja na zmiany DOM (przyciski dodawane dynamicznie)
  const mo = new MutationObserver(scheduleRun);
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  // Reflow na resize/orientation
  window.addEventListener('resize', scheduleRun);
  window.addEventListener('orientationchange', scheduleRun);
  window.addEventListener('PRZYBORNIK:REFLOW', scheduleRun);
})();
