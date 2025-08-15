(function(){
  const BAZA = new URL('https://kozlowskisebastian.pl', document.baseURI);

  const SCIEZKI = new Map([
    ["KARTY", "KARTY"],
    ["NOTATNIK", "NOTATNIK"],
    ["KALKULATOR", "KALKULATOR"],
    ["LICZYDŁO", "LICZYDLO"],
    ["LATARKA WYŁĄCZONE", null],
    ["POGODA WYŁĄCZONE", null],
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

(function(){
  'use strict';
  const NS = window.PRZYBORNIK || (window.PRZYBORNIK = {});

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function ensureToastStack(){
    let stos = $('.TOAST_STOS');
    if (!stos){
      stos = document.createElement('div');
      stos.className = 'TOAST_STOS';
      document.body.appendChild(stos);
    }
    return stos;
  }
  function toast(msg, {timeout=2200, type='info'} = {}){
    const stos = ensureToastStack();
    const el = document.createElement('div');
    el.className = 'TOAST';
    el.setAttribute('role','status');
    el.textContent = msg;
    stos.appendChild(el);
    el.dataset.state = 'enter';
    requestAnimationFrame(()=>{ el.dataset.state = 'show'; });
    const hide = () => {
      el.dataset.state = 'exit';
      setTimeout(()=> el.remove(), 220);
    };
    const t = setTimeout(hide, timeout);
    el.addEventListener('click', ()=>{ clearTimeout(t); hide(); }, { once:true });
    return el;
  }

  function on(root, event, selector, handler){
    if (typeof root === 'string') root = $(root);
    (root || document).addEventListener(event, (e) => {
      const cand = e.target.closest(selector);
      if (cand && (root ? root.contains(cand) : true)){
        handler.call(cand, e);
      }
    });
  }

  async function copyToClipboard(text){
    try {
      if (navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      toast('Skopiowano do schowka');
      return true;
    } catch (e){
      toast('Nie udało się skopiować');
      return false;
    }
  }

  function downloadBlob(blob, filename='plik.bin'){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 0);
  }

  let lastActive = null;
  function showModal(modal){
    const overlay = $('.MODAL_NAKLADKA') || $('.MODAL_OVERLAY') || (() => { const o = document.createElement('div'); o.className = 'MODAL_NAKLADKA'; document.body.appendChild(o); return o; })();

    if (typeof modal === 'string') modal = $(modal);
    if (!modal) return;

    overlay.innerHTML = '';
    overlay.appendChild(modal);
    overlay.dataset.open = 'true';
    lastActive = document.activeElement;

    const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
    (focusables[0] || modal).focus({ preventScroll:true });

    function onKey(e){
      if (e.key === 'Escape'){ hideModal(); }
      if (e.key === 'Tab' && focusables.length){
        const idx = focusables.indexOf(document.activeElement);
        if (e.shiftKey && (idx <= 0)){ e.preventDefault(); focusables[focusables.length-1].focus(); }
        else if (!e.shiftKey && (idx === focusables.length-1)){ e.preventDefault(); focusables[0].focus(); }
      }
    }
    overlay.addEventListener('keydown', onKey);
    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) hideModal(); });
    modal.addEventListener('close-modal', hideModal, { once:true });
  }

  function hideModal(){
    const overlay = $('.MODAL_NAKLADKA') || $('.MODAL_OVERLAY');
    if (!overlay) return;
    overlay.dataset.open = 'false';
    overlay.innerHTML = '';
    if (lastActive) { try { lastActive.focus({ preventScroll:true }); } catch(_){} }
  }

  NS.toast = toast;
  NS.on = on;
  NS.copyToClipboard = copyToClipboard;
  NS.downloadBlob = downloadBlob;
  NS.showModal = showModal;
  NS.hideModal = hideModal;
})();

/* === AUTOFIT TEKSTU: PRZYBORNIK + KALKULATOR === */
(function(){
  if (window.__PRZYBORNIK_KALK_AUTOFIT_INSTALLED__) return;
  window.__PRZYBORNIK_KALK_AUTOFIT_INSTALLED__ = true;

  // Skaluj: przyciski PRZYBORNIK, klawisze kalkulatora, nagłówek powrotu
  const SELECTORS = ['.PRZYCISK', '.KALKULATOR_KLAWIATURA button', '.PRZYCISK_PRZYBORNIK_POWROT'];
  const NARROW_KEYS = new Set(['KALKULATOR','GENERATOR']); // węższe napisy dla tych kluczy

  function allTargets(){
    const set = new Set();
    SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(el => set.add(el)));
    return Array.from(set);
  }

  function ensureWrappers(el){
    // tylko jeśli element ma "nagą" treść tekstową — pomijamy już przerobione
    let label = el.querySelector('.LABEL_SKALUJ');
    if (!label){
      const text = el.textContent.trim();
      if (!text) return null;
      el.textContent = '';
      label = document.createElement('span');
      label.className = 'LABEL_SKALUJ';
      // style obronne inline (gdyby CSS nie był doładowany)
      label.style.display = 'inline-block';
      label.style.whiteSpace = 'nowrap';
      label.style.transformOrigin = 'center center';
      label.style.willChange = 'transform';

      // jeśli to element z data-klucz wymagający zwężenia – dodaj wewnętrzny span
      const key = el.dataset ? el.dataset.klucz : undefined;
      if (key && NARROW_KEYS.has(key)){
        const inner = document.createElement('span');
        inner.className = 'WASKI_TEKST';
        inner.textContent = text;
        inner.style.display = 'inline-block';
        inner.style.transform = 'scaleX(0.86)';
        inner.style.transformOrigin = 'center center';
        label.appendChild(inner);
      }else{
        label.textContent = text;
      }
      // overflow: hidden dla bezpieczeństwa, jeśli brak
      if (!el.style.overflow) el.style.overflow = 'hidden';
      el.appendChild(label);
    }
    return label;
  }

  function fitOne(el){
    const label = ensureWrappers(el);
    if (!label) return;
    label.style.transform = 'scale(1)';
    // dostępne miejsce: szerokość elementu docelowego
    const avail = el.clientWidth;
    const need  = label.scrollWidth;
    const scale = Math.min(1, Math.max(0.5, (avail - 2) / Math.max(1, need)));
    label.style.transform = 'scale(' + scale.toFixed(3) + ')';
  }

  function fitAll(){
    allTargets().forEach(fitOne);
  }

  function ready(fn){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }else{
      fn();
    }
  }

  ready(fitAll);
  window.addEventListener('resize', fitAll);

  const ro = new ResizeObserver(() => fitAll());
  ready(() => allTargets().forEach(el => ro.observe(el)));

  // Obserwuj dynamiczne zmiany DOM (np. przełączanie widoków)
  const mo = new MutationObserver(() => fitAll());
  ready(() => mo.observe(document.body, { childList: true, subtree: true }));
})();
/* === KONIEC AUTOFIT === */