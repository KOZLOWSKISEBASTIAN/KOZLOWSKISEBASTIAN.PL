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
      if (!btn.style.textAlign) btn.style.textAlign = 'center';
      btn.appendChild(label);
    }
    return label;
  }

  function fitOne(btn){
  const label = ensureLabel(btn);
  if (!label) return;

  if (!btn.style.position || btn.style.position === '') btn.style.position = 'relative';
  label.style.position = 'absolute';
  label.style.left = '50%';
  label.style.top = '50%';
  label.style.transformOrigin = 'center center';

  label.style.transform = 'translate(-50%, -50%) scale(1,1)';

  const availW = Math.max(1, btn.clientWidth);
  const needW  = Math.max(1, label.scrollWidth);

  let scaleX = availW / needW;

  var bumpPx = (label.textContent.trim() === 'KARTY') ? 1 : 0;
label.style.transform = 'translate(calc(-50% - ' + bumpPx + 'px), -50%) scale(' + scaleX.toFixed(3) + ',1)';
}

  function fitAll(){
    document.querySelectorAll(SELECTOR).forEach(fitOne);
  }

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

  window.addEventListener('load', () => {
    scheduleFit(0);
    scheduleFit(200);
  }, { passive:true });

  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => scheduleFit(0));
    if (document.fonts.addEventListener){
      document.fonts.addEventListener('loadingdone', () => scheduleFit(0));
    }
  }

  window.addEventListener('resize', () => scheduleFit(0), { passive:true });
  window.addEventListener('orientationchange', () => {
    scheduleFit(0);
    scheduleFit(120);
  }, { passive:true });

  if (window.visualViewport){
    const vv = window.visualViewport;
    vv.addEventListener('resize', () => scheduleFit(0), { passive:true });
    vv.addEventListener('scroll', () => scheduleFit(0), { passive:true });
  }

  const ro = new ResizeObserver(() => scheduleFit(0));
  function observeButtons(){
    document.querySelectorAll(SELECTOR).forEach(el => ro.observe(el));
  }
  observeButtons();

  const mo = new MutationObserver(() => {
    observeButtons();
    scheduleFit(0);
  });
  mo.observe(document.body, { childList:true, subtree:true });
})();
