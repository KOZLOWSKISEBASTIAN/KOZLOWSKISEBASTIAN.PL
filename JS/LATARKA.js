/* ======================= LATARKA.js ======================= */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];

  const SOLID_DEFAULT_DARK  = '#FFFFFF'; // CIEMNY
  const SOLID_DEFAULT_LIGHT = '#000000'; // JASNY
  const SOS_DEFAULTS  = ['#FFFFFF', '#000000'];

  // Sterowanie i zakładki
  const PANEL_ROOT = $('PANEL_ROOT');
  const BTN_PANEL_TOGGLE = $('BTN_PANEL_TOGGLE');
  const TAB_TORCH  = $('TAB_TORCH');
  const TAB_SCREEN = $('TAB_SCREEN');

  // TORCH
  const TORCH_SOLID   = $('TORCH_SOLID');
  const TORCH_SOS     = $('TORCH_SOS');
  const TORCH_STROBE  = $('TORCH_STROBE');
  const TORCH_SPEED   = $('TORCH_SZYBKOSC');

  // SCREEN
  const SCREEN_SOLID   = $('SCREEN_SOLID');
  const SCREEN_SOS     = $('SCREEN_SOS');
  const SCREEN_STROBE  = $('SCREEN_STROBE');
  const SCREEN_SPEED   = $('SCREEN_SZYBKOSC');

  // Paleta
  const KOLORY_LISTA = $('KOLORY_LISTA');
  const HEX_ADD      = $('HEX_ADD');
  const MIX_SWATCH   = $('MIX_SWATCH');

  // Overlay „DODAJ KOLOR”
  const DODAJ_OVERLAY = $('DODAJ_OVERLAY');
  const OVERLAY_BG    = $('OVERLAY_BG');
  const OVERLAY_PANEL = $('OVERLAY_PANEL');
  const COLORBOX_HEX  = $('colorBoxHEX');
  const COLORBOX_RGB  = $('colorBoxRGB');

  // Sekcje
  const SEKCJA_TORCH  = $('SEKCJA_TORCH');
  const SEKCJA_SCREEN = $('SEKCJA_SCREEN');

  // Tło świecenia ekranu
  const SCREEN_OVERLAY = $('SCREEN_OVERLAY');

  // Suwaki – wiersze
  const ROW_TORCH  = $('ROW_TORCH');
  const ROW_SCREEN = $('ROW_SCREEN');

  const prevVal = new WeakMap();
  let clickSeq = 0;

  const S = {
    torchMode:null,
    screenMode:null,
    mixOn:false,
    hueIndex:0,
    overlayArmed:false,
    suppressFirstSolidUnselect:false
  };

  const SOS_SEQ = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1200];

  document.addEventListener('DOMContentLoaded', ()=>{
    /* ===== POKAŻ/UKRYJ (naprawa) ===== */
    if (BTN_PANEL_TOGGLE){
      // ustaw etykietę zgodnie ze stanem
      BTN_PANEL_TOGGLE.textContent = PANEL_ROOT.classList.contains('ZWINIETY') ? 'POKAŻ' : 'UKRYJ';
      BTN_PANEL_TOGGLE.addEventListener('click', (e)=>{
        e.preventDefault();
        const zwin = !PANEL_ROOT.classList.contains('ZWINIETY');
        PANEL_ROOT.classList.toggle('ZWINIETY', zwin);
        BTN_PANEL_TOGGLE.textContent = zwin ? 'POKAŻ' : 'UKRYJ';
      }, { passive:true });
    }

    /* ===== TABS ===== */
    TAB_TORCH ?.addEventListener('click', ()=>aktywujZakladke('torch'));
    TAB_SCREEN?.addEventListener('click', ()=>aktywujZakladke('screen'));
    aktywujZakladke('screen');

    /* ===== Suwaki ===== */
    initSlider(TORCH_SPEED);
    initSlider(SCREEN_SPEED);

    /* ===== Tryby TORCH (UI) ===== */
    TORCH_SOLID ?.addEventListener('click', ()=>toggleTorchMode('solid', TORCH_SOLID));
    TORCH_SOS   ?.addEventListener('click', ()=>toggleTorchMode('sos',   TORCH_SOS));
    TORCH_STROBE?.addEventListener('click', ()=>toggleTorchMode('strobe',TORCH_STROBE));

    /* ===== Tryby SCREEN ===== */
    SCREEN_SOLID ?.addEventListener('click', ()=>toggleScreenMode('solid', SCREEN_SOLID));
    SCREEN_SOS   ?.addEventListener('click', ()=>toggleScreenMode('sos',   SCREEN_SOS));
    SCREEN_STROBE?.addEventListener('click', ()=>toggleScreenMode('strobe',SCREEN_STROBE));

    /* ===== Paleta główna ===== */
    KOLORY_LISTA?.addEventListener('click',(e)=>{
      const btn = e.target.closest('.KOLOR'); if(!btn) return;
      spinHex(btn);

      if(btn===MIX_SWATCH){
        S.mixOn = !S.mixOn;
        btn.classList.toggle('AKTYWNY', S.mixOn);
        S.hueIndex = 0;
        applyLivePreview(true);
        return;
      }

      if (!S.screenMode){
        toggleScreenMode('solid', SCREEN_SOLID, /*noDefault*/ true);
        S.suppressFirstSolidUnselect = true;
      }

      if (S.screenMode === 'solid'){
        if (btn.classList.contains('AKTYWNY')){
          if (S.suppressFirstSolidUnselect){
            deselectAll();
            markActive(btn);
            S.suppressFirstSolidUnselect = false;
          } else {
            unmark(btn);
            if (getActiveButtons().length === 0){
              SCREEN_SOLID?.classList.remove('TRYB_AKTYWNY');
              resetTrybu();
              return;
            }
          }
        } else {
          deselectAll();
          markActive(btn);
          S.suppressFirstSolidUnselect = false;
        }
      } else if (S.screenMode === 'sos'){
        if (btn.classList.contains('AKTYWNY')) {
          unmark(btn);
          if (getActiveButtons().length === 0){
            SCREEN_SOS?.classList.remove('TRYB_AKTYWNY');
            resetTrybu();
            return;
          }
        } else {
          markActive(btn);
          const aktywne = getActiveButtons();
          if (aktywne.length > 2){
            const naj = najstarszy(aktywne);
            unmark(naj);
          }
        }
      } else if (S.screenMode === 'strobe'){
        if (btn.classList.contains('AKTYWNY')){
          unmark(btn);
          if (getActiveButtons().length === 0){
            SCREEN_STROBE?.classList.remove('TRYB_AKTYWNY');
            resetTrybu();
            return;
          }
        } else {
          markActive(btn);
        }
      }

      applyLivePreview(true);
    });

    /* ===== „DODAJ” – otwórz overlay ===== */
    HEX_ADD?.addEventListener('click', ()=>{
      S.overlayArmed = true;
      updateBoxes(getSolidDefaultByTheme());
      otworzOverlay();
    });

    /* ===== Zamykanie OVERLAY kliknięciem „gdziekolwiek obok” (działa znów) ===== */
    DODAJ_OVERLAY?.addEventListener('click', (ev)=>{
      const target = ev.target;
      const klikWHex = target.closest('.hex') || target.closest('.hexagon-picker');
      const klikWPole = target.closest('.LICZYDLO_POLE') || target.closest('input,textarea,select,button');
      if (!klikWHex && !klikWPole){
        zamknijOverlay();
      }
    });
    OVERLAY_PANEL?.addEventListener('click', (ev)=>{
      const klikWHex = ev.target.closest('.hex') || ev.target.closest('.hexagon-picker');
      const klikWPole = ev.target.closest('.LICZYDLO_POLE') || ev.target.closest('input,textarea,select,button');
      if (klikWHex || klikWPole){
        ev.stopPropagation();
      }
    });
    OVERLAY_BG?.addEventListener('click', (ev)=>{
      if (ev.target === OVERLAY_BG) zamknijOverlay();
    });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !DODAJ_OVERLAY.classList.contains('UKRYTY')) zamknijOverlay(); });

    /* ===== Integracja pickera (dodawanie koloru) ===== */
    window.addEventListener('wybrano-kolor', e=>handlePicked(e.detail?.hex));
    window.addEventListener('color-picked',  e=>handlePicked(e.detail?.hex));
  });

  /* ===== Zakładki ===== */
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

  /* ===== Suwaki ===== */
  function initSlider(input){
    if(!input) return;
    prevVal.set(input, Number(input.value)||0);
    input.addEventListener('input', ()=>{
      const last = prevVal.get(input) ?? 0;
      const now  = Number(input.value)||0;
      const dir  = (now>=last ? '30deg' : '-30deg');
      input.style.setProperty('--spin', dir);
      requestAnimationFrame(()=>{ setTimeout(()=> input.style.setProperty('--spin','0deg'), 60); });
      prevVal.set(input, now);

      if(input===SCREEN_SPEED && S.screenMode==='strobe'){
        startStrobe(SCREEN_SPEED);
      }
    });
  }
  function updateSlidersVisibility(){
    showRow(ROW_TORCH,  S.torchMode==='strobe');
    showRow(ROW_SCREEN, S.screenMode==='strobe');
  }
  function showRow(row, show){ if(row) row.classList.toggle('UKRYTY', !show); }

  /* ===== Overlay ===== */
  function otworzOverlay(){
    DODAJ_OVERLAY.classList.remove('UKRYTY');
    DODAJ_OVERLAY.setAttribute('aria-hidden','false');
    document.body.classList.add('OVERLAY_OTWARTY');
  }
  function zamknijOverlay(){
    DODAJ_OVERLAY.classList.add('UKRYTY');
    DODAJ_OVERLAY.setAttribute('aria-hidden','true');
    document.body.classList.remove('OVERLAY_OTWARTY');
    S.overlayArmed=false;
  }

  /* ===== Motyw / domyślne ===== */
  function getTheme(){ return (document.documentElement.getAttribute('WYBOR_MOTYW')||'JASNY').toUpperCase(); }
  function getThemeDefault(){ return getTheme()==='CIEMNY' ? '#000000' : '#FFFFFF'; }
  function getSolidDefaultByTheme(){ return getTheme()==='CIEMNY' ? SOLID_DEFAULT_DARK : SOLID_DEFAULT_LIGHT; }

  /* ===== Zaznaczenia palety ===== */
  function getActiveButtons(){ return $$('.KOLOR.AKTYWNY[data-kolor]', KOLORY_LISTA); }
  function getActiveColors(){
    return getActiveButtons()
      .sort((a,b)=>Number(a.dataset.clickSeq)-Number(b.dataset.clickSeq))
      .map(b => (b.dataset.kolor||'').toUpperCase())
      .filter(Boolean);
  }
  function markActive(btn){ btn.classList.add('AKTYWNY'); btn.dataset.clickSeq = (++clickSeq).toString(); }
  function unmark(btn){ btn.classList.remove('AKTYWNY'); btn.removeAttribute('data-click-seq'); }
  function deselectAll(){ getActiveButtons().forEach(unmark); }
  function najstarszy(list){ return list.sort((a,b)=>Number(a.dataset.clickSeq)-Number(b.dataset.clickSeq))[0]; }
  function selectOrCreateColor(hex){
    let btn = KOLORY_LISTA.querySelector(`.KOLOR[data-kolor="${hex}"]`);
    if (!btn){
      btn = document.createElement('button');
      btn.className = 'KOLOR';
      btn.dataset.kolor = hex;
      btn.style.setProperty('--c', hex);
      btn.title = hex;
      KOLORY_LISTA.appendChild(btn);
    }
    return btn;
  }
  function spinHex(el){ el.classList.remove('OBROT'); void el.offsetWidth; el.classList.add('OBROT'); }

  /* ===== Kolor wynikowy per tryb ===== */
  function getSolidColor(){
    const aktywne = getActiveColors();
    return aktywne[aktywne.length-1] || getSolidDefaultByTheme();
  }
  function getStrobeColors(){
    const aktywne = getActiveColors();
    return (aktywne.length ? aktywne : [getSolidDefaultByTheme()]).slice();
  }
  function getSOSColors(){
    const aktywne = getActiveColors();
    if (S.mixOn) return nextHuePair();
    if (aktywne.length >= 2) return aktywne.slice(-2);
    if (aktywne.length === 1) return [aktywne[0], '#000000'];
    return SOS_DEFAULTS.slice();
  }

  /* ===== RGB/MIX ===== */
  function hueAt(i){ const h=((i%360)+360)%360; return `hsl(${h} 100% 50%)`; }
  function nextHue(){ const c=hueAt(S.hueIndex); S.hueIndex = (S.hueIndex+15)%360; return c; }
  function nextHuePair(){ const a=hueAt(S.hueIndex), b=hueAt((S.hueIndex+180)%360); S.hueIndex=(S.hueIndex+15)%360; return [a,b]; }

  /* ===== Tryby SCREEN ===== */
  function toggleScreenMode(mode, btn, noDefault){
    if (S.screenMode === mode){
      resetTrybu();
      btn?.classList.remove('TRYB_AKTYWNY');
      return;
    }
    [SCREEN_SOLID,SCREEN_SOS,SCREEN_STROBE].forEach(b=>b?.classList.remove('TRYB_AKTYWNY'));
    btn?.classList.add('TRYB_AKTYWNY');

    resetTrybu();
    S.screenMode = mode;
    S.hueIndex = 0;
    updateSlidersVisibility();

    if (mode === 'solid'){
      if (!noDefault){
        deselectAll();
        const def = getSolidDefaultByTheme();
        const btnDef = selectOrCreateColor(def);
        markActive(btnDef);
        setScreenColor(def);
      }
    }
    else if (mode === 'sos'){
      deselectAll();
      markActive(selectOrCreateColor('#FFFFFF'));
      markActive(selectOrCreateColor('#000000'));
      startSOS();
    }
    else if (mode === 'strobe'){
      if (getActiveButtons().length === 0){
        markActive(selectOrCreateColor(getSolidDefaultByTheme()));
      }
      startStrobe(SCREEN_SPEED);
    }
  }

  function resetTrybu(){
    stopTimers();
    S.mixOn = false;
    S.suppressFirstSolidUnselect = false;
    MIX_SWATCH?.classList.remove('AKTYWNY');
    deselectAll();
    SCREEN_OVERLAY.style.background = getThemeDefault();
    SCREEN_OVERLAY.classList.add('UKRYTY');
    S.screenMode = null;
    updateSlidersVisibility();
  }

  function stopTimers(){
    clearInterval(window.__screenIntervalId); window.__screenIntervalId = null;
    clearTimeout(window.__screenSOSId);       window.__screenSOSId = null;
  }

  function setScreenColor(hex){
    SCREEN_OVERLAY?.classList.remove('UKRYTY');
    SCREEN_OVERLAY.style.background = hex;
  }

  function startStrobe(input){
    stopTimers();
    const baseDelay = Number(input?.value)||200;
    let i=0, on=false;
    const offColor = (getTheme()==='CIEMNY' ? '#000000' : '#FFFFFF');
    const colors = ()=> (S.mixOn ? [nextHue()] : getStrobeColors());
    window.__screenIntervalId = setInterval(()=>{
      on = !on;
      if (on){
        const arr = colors();
        const c = arr[i % arr.length];
        i++;
        setScreenColor(c);
      } else {
        setScreenColor(offColor);
      }
    }, baseDelay);
    S.screenMode = 'strobe';
  }

  function startSOS(){
    stopTimers();
    let i=0;
    const tick = ()=>{
      const [c1,c2] = S.mixOn ? nextHuePair() : getSOSColors();
      const on = (i%2===0);
      setScreenColor(on ? c1 : c2);
      const wait = SOS_SEQ[i++ % SOS_SEQ.length];
      window.__screenSOSId = setTimeout(tick, wait);
    };
    tick();
    S.screenMode = 'sos';
  }

  function applyLivePreview(force){
    if (!S.screenMode && !force) return;
    if (S.screenMode === 'solid'){
      setScreenColor(getSolidColor());
    } else if (S.screenMode === 'strobe'){
      startStrobe(SCREEN_SPEED);
    }
  }

  /* ===== TORCH: UI ===== */
  function toggleTorchMode(mode, btn){
    if (S.torchMode === mode){ S.torchMode=null; btn?.classList.remove('TRYB_AKTYWNY'); updateSlidersVisibility(); return; }
    [TORCH_SOLID,TORCH_SOS,TORCH_STROBE].forEach(b=>b?.classList.remove('TRYB_AKTYWNY'));
    btn?.classList.add('TRYB_AKTYWNY');
    S.torchMode = mode;
    updateSlidersVisibility();
  }

  /* ===== Picker → dodaj i zamknij ===== */
  function handlePicked(hex){
    if (!hex) return;
    const norm = normalizeHex(hex);
    updateBoxes(norm);

    const btn = selectOrCreateColor(norm);
    btn.classList.add('OBROT');
    setTimeout(()=>btn.classList.remove('OBROT'), 380);

    zamknijOverlay();
  }

  /* ===== Pola (HEX/RGB) ===== */
  function updateBoxes(hex){
    const {r,g,b} = hexToRgb(hex);
    COLORBOX_HEX && (COLORBOX_HEX.value = `HEX:${hex.toUpperCase()}`);
    COLORBOX_RGB && (COLORBOX_RGB.value = `RGB:${r},${g},${b}`);
  }
  function normalizeHex(text){
    let t = String(text||'').trim().toUpperCase();
    if (!t.startsWith('#')) t = '#'+t;
    return t;
  }
  function hexToRgb(hex){
    hex = hex.replace('#','');
    const n = parseInt(hex,16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }

})();
