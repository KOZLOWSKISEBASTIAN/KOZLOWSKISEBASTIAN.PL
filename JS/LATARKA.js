/* ======================= LATARKA.js ======================= */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];

  const SOLID_DEFAULT_DARK  = '#FFFFFF'; // ciemny motyw
  const SOLID_DEFAULT_LIGHT = '#000000'; // jasny motyw
  const SOS_DEFAULTS  = ['#FFFFFF', '#000000'];

  // UI
  const PANEL_ROOT = $('PANEL_ROOT');
  const BTN_PANEL_TOGGLE = $('BTN_PANEL_TOGGLE');
  const TAB_TORCH  = $('TAB_TORCH');
  const TAB_SCREEN = $('TAB_SCREEN');

  // SCREEN
  const SCREEN_SOLID   = $('SCREEN_SOLID');
  const SCREEN_SOS     = $('SCREEN_SOS');
  const SCREEN_STROBE  = $('SCREEN_STROBE');
  const SCREEN_SPEED   = $('SCREEN_SZYBKOSC');

  // TORCH (placeholder zgodnie z oryg. strukturą)
  const TORCH_SOLID   = $('TORCH_SOLID');
  const TORCH_SOS     = $('TORCH_SOS');
  const TORCH_STROBE  = $('TORCH_STROBE');
  const TORCH_SPEED   = $('TORCH_SZYBKOSC');

  // Paleta
  const KOLORY_LISTA = $('KOLORY_LISTA');
  const HEX_ADD      = $('HEX_ADD');

  // Overlay
  const DODAJ_OVERLAY = $('DODAJ_OVERLAY');
  const OVERLAY_BG    = $('OVERLAY_BG');
  const OVERLAY_PANEL = $('OVERLAY_PANEL');
  const COLORBOX_HEX  = $('colorBoxHEX');
  const COLORBOX_RGB  = $('colorBoxRGB');

  // Sekcje/suwaki
  const SEKCJA_TORCH  = $('SEKCJA_TORCH');
  const SEKCJA_SCREEN = $('SEKCJA_SCREEN');
  const ROW_TORCH     = $('ROW_TORCH');
  const ROW_SCREEN    = $('ROW_SCREEN');

  // Pełnoekranowe świecenie
  const SCREEN_OVERLAY = $('SCREEN_OVERLAY');

  const prevVal = new WeakMap();
  let clickSeq = 0;

  const S = {
    torchMode:null,
    screenMode:null,
    hueIndex:0
  };

  const SOS_SEQ = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1200];

  document.addEventListener('DOMContentLoaded', ()=>{
    /* POKAŻ/UKRYJ – chowa tylko część roboczą, nie PRZYBORNIK */
    if (BTN_PANEL_TOGGLE){
      BTN_PANEL_TOGGLE.textContent = PANEL_ROOT.classList.contains('ZWINIETY') ? 'POKAŻ' : 'UKRYJ';
      BTN_PANEL_TOGGLE.addEventListener('click', (e)=>{
        e.preventDefault();
        const zwin = !PANEL_ROOT.classList.contains('ZWINIETY');
        PANEL_ROOT.classList.toggle('ZWINIETY', zwin);
        BTN_PANEL_TOGGLE.textContent = zwin ? 'POKAŻ' : 'UKRYJ';
      }, { passive:true });
    }

    /* Zakładki (mobile) */
    TAB_TORCH ?.addEventListener('click', ()=>aktywujZakladke('torch'));
    TAB_SCREEN?.addEventListener('click', ()=>aktywujZakladke('screen'));
    aktywujZakladke('screen');

    /* Suwaki */
    initSlider(SCREEN_SPEED);
    initSlider(TORCH_SPEED);

    /* Tryby – ekran */
    SCREEN_SOLID ?.addEventListener('click', ()=>toggleScreen('solid', SCREEN_SOLID));
    SCREEN_SOS   ?.addEventListener('click', ()=>toggleScreen('sos',   SCREEN_SOS));
    SCREEN_STROBE?.addEventListener('click', ()=>toggleScreen('strobe',SCREEN_STROBE));

    /* Paleta klików */
    KOLORY_LISTA?.addEventListener('click',(e)=>{
      const btn = e.target.closest('.KOLOR'); if(!btn) return;

      if (!S.screenMode){ toggleScreen('solid', SCREEN_SOLID, true); }

      if (S.screenMode === 'solid'){
        // tylko jeden kolor aktywny
        getActiveButtons().forEach(unmark);
        markActive(btn);
        setScreenColor(btn.dataset.kolor);
      }
      else if (S.screenMode === 'sos'){
        // max 2 kolory; jeśli odklikamy ostatni -> reset trybu
        if (btn.classList.contains('AKTYWNY')){
          unmark(btn);
          if (getActiveButtons().length===0){ SCREEN_SOS.classList.remove('TRYB_AKTYWNY'); resetTrybu(); return; }
        } else {
          markActive(btn);
          const aktywne = getActiveButtons();
          if (aktywne.length>2){ unmark( najstarszy(aktywne) ); }
        }
      }
      else if (S.screenMode === 'strobe'){
        // dowolna liczba; odklik ostatniego wyłącza tryb
        if (btn.classList.contains('AKTYWNY')){
          unmark(btn);
          if (getActiveButtons().length===0){ SCREEN_STROBE.classList.remove('TRYB_AKTYWNY'); resetTrybu(); return; }
        } else {
          markActive(btn);
        }
      }

      // podgląd na żywo
      if (S.screenMode === 'solid')      setScreenColor(getSolidColor());
      else if (S.screenMode === 'strobe') startStrobe(SCREEN_SPEED);
    });

    /* DODAJ – otwarcie */
    HEX_ADD?.addEventListener('click', ()=>{
      updateBoxes(getSolidDefaultByTheme());
      otworzOverlay();
    });

    /* DODAJ – zamknięcie kliknięciem obok */
    DODAJ_OVERLAY?.addEventListener('click', (ev)=>{
      const t = ev.target;
      const klikWUI = t.closest('.hex') || t.closest('.hexagon-picker') || t.closest('.LICZYDLO_POLE') || t.closest('input,button');
      if (!klikWUI) zamknijOverlay();
    });
    OVERLAY_PANEL?.addEventListener('click', (ev)=>{
      const klikWUI = ev.target.closest('.hex') || ev.target.closest('.hexagon-picker') || ev.target.closest('.LICZYDLO_POLE') || ev.target.closest('input,button');
      if (klikWUI) ev.stopPropagation();
    });
    OVERLAY_BG?.addEventListener('click', (ev)=>{ if (ev.target===OVERLAY_BG) zamknijOverlay(); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !DODAJ_OVERLAY.classList.contains('UKRYTY')) zamknijOverlay(); });

    /* Integracja pickera – nasłuchy */
    window.addEventListener('wybrano-kolor', e=>dodajWybrany(e.detail?.hex));
    window.addEventListener('color-picked',  e=>dodajWybrany(e.detail?.hex));
  });

  /* === Zakładki === */
  function aktywujZakladke(which){
    if(which==='torch'){
      SEKCJA_TORCH.classList.remove('UKRYTY');
      SEKCJA_SCREEN.classList.add('UKRYTY');
    }else{
      SEKCJA_SCREEN.classList.remove('UKRYTY');
      SEKCJA_TORCH.classList.add('UKRYTY');
    }
    updateSlidersVisibility();
  }

  /* === Suwaki === */
  function initSlider(input){
    if(!input) return;
    prevVal.set(input, Number(input.value)||0);
    input.addEventListener('input', ()=>{
      const last=prevVal.get(input)??0, now=Number(input.value)||0;
      input.style.setProperty('--spin', now>=last ? '30deg':'-30deg');
      requestAnimationFrame(()=> setTimeout(()=> input.style.setProperty('--spin','0deg'), 60) );
      prevVal.set(input, now);
      if(input===SCREEN_SPEED && S.screenMode==='strobe') startStrobe(SCREEN_SPEED);
    });
  }
  function updateSlidersVisibility(){
    if (ROW_SCREEN) ROW_SCREEN.classList.toggle('UKRYTY', S.screenMode!=='strobe');
    if (ROW_TORCH)  ROW_TORCH .classList.toggle('UKRYTY', S.torchMode!=='strobe');
  }

  /* === Overlay === */
  function otworzOverlay(){
    DODAJ_OVERLAY.classList.remove('UKRYTY');
    DODAJ_OVERLAY.setAttribute('aria-hidden','false');
    document.body.classList.add('OVERLAY_OTWARTY');
  }
  function zamknijOverlay(){
    DODAJ_OVERLAY.classList.add('UKRYTY');
    DODAJ_OVERLAY.setAttribute('aria-hidden','true');
    document.body.classList.remove('OVERLAY_OTWARTY');
  }

  /* === Tryby ekranu === */
  function toggleScreen(mode, btn, noDefault){
    if (S.screenMode === mode){
      resetTrybu();
      btn?.classList.remove('TRYB_AKTYWNY');
      return;
    }
    [SCREEN_SOLID,SCREEN_SOS,SCREEN_STROBE].forEach(b=>b?.classList.remove('TRYB_AKTYWNY'));
    btn?.classList.add('TRYB_AKTYWNY');

    resetTrybu();
    S.screenMode = mode;
    updateSlidersVisibility();

    if (mode==='solid'){
      if (!noDefault){
        getActiveButtons().forEach(unmark);
        const def = getSolidDefaultByTheme();
        markActive( ensureButton(def) );
        setScreenColor(def);
      }
    } else if (mode==='sos'){
      getActiveButtons().forEach(unmark);
      markActive( ensureButton('#FFFFFF') );
      markActive( ensureButton('#000000') );
      startSOS();
    } else if (mode==='strobe'){
      if (getActiveButtons().length===0){
        markActive( ensureButton(getSolidDefaultByTheme()) );
      }
      startStrobe(SCREEN_SPEED);
    }
  }

  function resetTrybu(){
    stopTimers();
    getActiveButtons().forEach(unmark);
    SCREEN_OVERLAY.style.background = getThemeDefault();
    SCREEN_OVERLAY.classList.add('UKRYTY');
    S.screenMode=null;
    updateSlidersVisibility();
  }

  function stopTimers(){
    clearInterval(window.__screenIntervalId); window.__screenIntervalId=null;
    clearTimeout(window.__screenSOSId);       window.__screenSOSId=null;
  }

  /* === Pełny ekran koloru === */
  function setScreenColor(hex){
    SCREEN_OVERLAY.classList.remove('UKRYTY');
    SCREEN_OVERLAY.style.background = hex;
  }

  function startStrobe(input){
    stopTimers();
    const baseDelay = Number(input?.value)||200;
    let i=0, on=false;
    const offColor = (getTheme()==='CIEMNY' ? '#000000' : '#FFFFFF');
    const colors = ()=> getStrobeColors();
    window.__screenIntervalId = setInterval(()=>{
      on=!on;
      if(on){
        const arr=colors();
        const c = arr[i % arr.length];
        i++;
        setScreenColor(c);
      }else{
        setScreenColor(offColor);
      }
    }, baseDelay);
    S.screenMode='strobe';
  }

  function startSOS(){
    stopTimers();
    let i=0;
    const seq = ()=>{ const on=(i%2===0); const [c1,c2]=getSOSColors(); setScreenColor(on?c1:c2); const t=SOS_SEQ[i++%SOS_SEQ.length]; window.__screenSOSId=setTimeout(seq,t); };
    seq();
    S.screenMode='sos';
  }

  /* === Kolory aktywne === */
  function getActiveButtons(){ return $$('.KOLOR.AKTYWNY[data-kolor]', KOLORY_LISTA); }
  function markActive(btn){ btn.classList.add('AKTYWNY'); btn.dataset.clickSeq=(++clickSeq).toString(); }
  function unmark(btn){ btn.classList.remove('AKTYWNY'); btn.removeAttribute('data-click-seq'); }
  function najstarszy(list){ return list.sort((a,b)=>Number(a.dataset.clickSeq)-Number(b.dataset.clickSeq))[0]; }

  function ensureButton(hex){
    let b = KOLORY_LISTA.querySelector(`.KOLOR[data-kolor="${hex}"]`);
    if(!b){
      b=document.createElement('button');
      b.className='KOLOR'; b.dataset.kolor=hex; b.style.setProperty('--c', hex); b.title=hex;
      KOLORY_LISTA.appendChild(b);
    }
    return b;
  }

  function getSolidColor(){
    const akt = getActiveButtons().sort((a,b)=>Number(a.dataset.clickSeq)-Number(b.dataset.clickSeq));
    return (akt[akt.length-1]?.dataset.kolor) || getSolidDefaultByTheme();
    }
  function getStrobeColors(){
    const akt = getActiveButtons().sort((a,b)=>Number(a.dataset.clickSeq)-Number(b.dataset.clickSeq));
    return akt.length ? akt.map(b=>b.dataset.kolor) : [getSolidDefaultByTheme()];
  }
  function getSOSColors(){
    const akt = getActiveButtons().sort((a,b)=>Number(a.dataset.clickSeq)-Number(b.dataset.clickSeq)).map(b=>b.dataset.kolor);
    if (akt.length>=2) return akt.slice(-2);
    if (akt.length===1) return [akt[0], '#000000'];
    return SOS_DEFAULTS.slice();
  }

  /* === Motyw/dom === */
  function getTheme(){ return (document.documentElement.getAttribute('WYBOR_MOTYW')||'JASNY').toUpperCase(); }
  function getThemeDefault(){ return getTheme()==='CIEMNY' ? '#000000' : '#FFFFFF'; }
  function getSolidDefaultByTheme(){ return getTheme()==='CIEMNY' ? SOLID_DEFAULT_DARK : SOLID_DEFAULT_LIGHT; }

  /* === DODAJ – wklepany kolor === */
  function dodajWybrany(hex){
    if(!hex) return;
    const norm = normalizeHex(hex);
    updateBoxes(norm);
    const btn = ensureButton(norm);
    btn.classList.add('OBROT'); setTimeout(()=>btn.classList.remove('OBROT'),380);
    zamknijOverlay();
  }

  /* === Pola (HEX/RGB) – etykiety w wartości === */
  function updateBoxes(hex){
    const {r,g,b} = hexToRgb(hex);
    if (COLORBOX_HEX) COLORBOX_HEX.value = `HEX:${hex.toUpperCase()}`;
    if (COLORBOX_RGB) COLORBOX_RGB.value = `RGB:${r},${g},${b}`;
  }
  function normalizeHex(text){ let t=String(text||'').trim().toUpperCase(); if(!t.startsWith('#')) t='#'+t; return t; }
  function hexToRgb(hex){ hex = hex.replace('#',''); const n=parseInt(hex,16); return {r:(n>>16)&255, g:(n>>8)&255, b:n&255}; }

})();
