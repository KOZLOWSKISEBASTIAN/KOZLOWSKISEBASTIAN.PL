(function(){

  const BAZA = new URL('https://kozlowskisebastian.pl', document.baseURI);

  const SCIEZKI = new Map([
    ["KARTY", "KARTY"],
    ["NOTATNIK", "NOTATNIK"],
    ["KALKULATOR", "KALKULATOR"],
    ["LICZYDŁO", "LICZYDLO"],
    ["LATARKA", null],
    ["POGODA", "POGODA"],
    ["GENERATOR", "GENERATOR"],
    ["PRZYBORNIK", "PRZYBORNIK"],

    ["ADRES_KSG", "https://ksgroup.pl/"],
    ["ADRES_KSPL", "https://kozlowskisebastian.pl/"],
  ]);

  document.querySelectorAll('[data-klucz]').forEach(EL => {
    const KLUCZ = EL.getAttribute('data-klucz');
    const SCIEZKA = SCIEZKI.get(KLUCZ);
    if (SCIEZKA) {

      if (/^https?:\/\//i.test(SCIEZKA)) {
        EL.href = SCIEZKA;
      } else {

        EL.href = new URL(SCIEZKA + '/', BAZA).href;
      }
    } else {
      EL.setAttribute('tabindex', '-1');
      EL.addEventListener('click', E => E.preventDefault());
    }
  });
})();

(function(){
  const BTN_SEL = [
    'a.PRZYCISK',
    'button.PRZYCISK',
    '.PRZYCISK_PRZYBORNIK_POWROT',
    '.PRZYCISK_KLAWISZ',
    '.PRZYCISK--KLAWISZ',
    '.PRZYBORNIK_PRZYCISK_POLOWA .half'
  ].join(',');

  const MIN_PX   = 11;
  const SAFE_PAD = 2;
  const ASCENDER_COMP = 1.045;

  function ensureLabel(btn){
    let label = btn.querySelector('.LABEL_AUTOSIZE');
    if (label) return label;

    const rawText = Array.from(btn.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.nodeValue)
      .join(' ')
      .replace(/\s+/g,' ')
      .trim();

    if (!rawText) return null;

    btn.textContent = '';
    label = document.createElement('span');
    label.className = 'LABEL_AUTOSIZE';
    label.textContent = rawText;
    btn.appendChild(label);
    return label;
  }

  function getVarPx(str, fallbackPx){
    if (!str) return fallbackPx;
    const tmp = document.createElement('div');
    tmp.style.position = 'absolute';
    tmp.style.visibility = 'hidden';
    tmp.style.fontSize = str;
    document.body.appendChild(tmp);
    const v = parseFloat(getComputedStyle(tmp).fontSize) || fallbackPx;
    tmp.remove();
    return v;
  }

  function getBaseFont(btn){
    const cs = getComputedStyle(btn);
    const fsVar = cs.getPropertyValue('--fs-base').trim();
    const fsCur = cs.fontSize;
    return getVarPx(fsVar || fsCur, 16);
  }

  function getMaxFont(btn){
    const cs = getComputedStyle(btn);
    const maxVar = cs.getPropertyValue('--fs-max').trim();
    const byVar  = getVarPx(maxVar, 0);
    const byH    = Math.max(0, (btn.clientHeight - SAFE_PAD));
    const hard   = 320;
    return Math.max(12, Math.min(byVar || Infinity, byH || Infinity, hard));
  }

  function measure(label, px){
    const clone = label.cloneNode(true);
    clone.style.visibility = 'hidden';
    clone.style.position = 'absolute';
    clone.style.whiteSpace = 'nowrap';
    clone.style.width = 'auto';
    clone.style.fontSize = px + 'px';
    clone.style.lineHeight = '1';
    document.body.appendChild(clone);
    const rect = clone.getBoundingClientRect();
    clone.remove();
    return { w: Math.ceil(rect.width), h: Math.ceil(rect.height) };
  }

  function fits(label, px, availW, availH){
    const m = measure(label, px);
    return (m.w <= availW) && (m.h <= availH);
  }

  function justifyToWidth(label, availW){
    label.style.wordSpacing = 'normal';
    label.style.letterSpacing = 'normal';

    const m = label.getBoundingClientRect().width;
    const delta = Math.floor(availW - m);
    if (delta <= 0) return;

    const text = (label.textContent || '').trim();
    const wordGaps   = (text.match(/\s+/g) || []).length;
    const letters    = text.replace(/\s+/g,'');
    const letterGaps = Math.max(letters.length - 1, 0);

    if (wordGaps > 0) {
      label.style.wordSpacing   = (delta / wordGaps) + 'px';
      label.style.letterSpacing = 'normal';
    } else if (letterGaps > 0) {
      label.style.letterSpacing = (delta / letterGaps) + 'px';
      label.style.wordSpacing   = 'normal';
    }
  }

  function fitOne(btn){
    const label = ensureLabel(btn);
    if (!label) return;

    btn.style.removeProperty('--fs');
    label.style.wordSpacing   = 'normal';
    label.style.letterSpacing = 'normal';

    const availW = Math.max(1, btn.clientWidth  - SAFE_PAD);
    const availH = Math.max(1, btn.clientHeight - SAFE_PAD);

    const base = getBaseFont(btn);
    let lo = MIN_PX;
    let hi = Math.max(lo, getMaxFont(btn));

    let best = lo;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const midAdj = Math.floor(mid * ASCENDER_COMP);
      if (fits(label, midAdj, availW, availH)) {
        best = midAdj;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    for (let bump = 2; bump >= 1; bump--) {
      if (fits(label, best + bump, availW, availH)) { best = best + bump; break; }
    }

    btn.style.setProperty('--fs', best + 'px');
    requestAnimationFrame(() => {
      justifyToWidth(label, availW);
    });
  }

  function fitAll(){ document.querySelectorAll(BTN_SEL).forEach(fitOne); }

  function init(){
    fitAll();
    window.addEventListener('resize', fitAll);
    window.addEventListener('orientationchange', fitAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll).catch(()=>{});
    const ro = new ResizeObserver(() => requestAnimationFrame(fitAll));
    document.querySelectorAll(BTN_SEL).forEach(el => ro.observe(el));
    setTimeout(fitAll, 60);
    setTimeout(fitAll, 180);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
