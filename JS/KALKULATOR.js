
// KALKULATOR_AUTOFIT_SAFE.js — bezpieczne skalowanie etykiet (klik nadal trafia w <button>)
(function(){
  if (window.__KALK_AUTOFIT__ || window.__PRZYBORNIK_KALK_AUTOFIT_INSTALLED__) return;
  window.__KALK_AUTOFIT__ = true;
  window.__PRZYBORNIK_KALK_AUTOFIT_INSTALLED__ = true;

  const SELECTORS = ['.KALKULATOR_KLAWIATURA button', '.PRZYCISK_PRZYBORNIK_POWROT'];

  function targets(){
    const set = new Set();
    SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => set.add(el)));
    return Array.from(set);
  }

  function ensureWrapper(el){
    let label = el.querySelector('.LABEL_SKALUJ');
    if (!label){
      const text = el.textContent;
      el.textContent = '';
      label = document.createElement('span');
      label.className = 'LABEL_SKALUJ';
      // Defensive inline styles
      label.style.display = 'inline-block';
      label.style.whiteSpace = 'nowrap';
      label.style.transformOrigin = 'center center';
      label.style.willChange = 'transform';
      label.style.pointerEvents = 'none'; // <<< kliki nie zatrzymują się na etykiecie
      label.textContent = text;
      if (!el.style.overflow) el.style.overflow = 'hidden';
      el.appendChild(label);
    }
    return label;
  }

  function fitOne(el){
    const label = ensureWrapper(el);
    if (!label) return;
    // reset scale -> pomiar
    label.style.transform = 'scale(1)';
    const avail = el.clientWidth;
    const need  = label.scrollWidth;
    const scale = Math.min(1, Math.max(0.5, (avail - 2) / Math.max(1, need)));
    label.style.transform = 'scale(' + scale.toFixed(3) + ')';
  }

  function fitAll(){ targets().forEach(fitOne); }

  function ready(fn){
    if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn, {once:true}); }
    else fn();
  }

  ready(fitAll);
  window.addEventListener('resize', fitAll);

  // Obserwuj tylko siatkę przycisków i nagłówek kalkulatora – nie całe <body>
  const ro = new ResizeObserver(() => fitAll());
  ready(() => targets().forEach(el => ro.observe(el)));

  const grid = document.getElementById('klawisze');
  if (grid){
    const mo = new MutationObserver(() => fitAll());
    mo.observe(grid, { childList:true, subtree:true });
  }
})();
