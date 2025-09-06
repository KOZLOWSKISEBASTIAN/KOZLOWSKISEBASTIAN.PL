/* ======================= LATARKA.js ======================= */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);

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

  // Overlay DODAJ
  const DODAJ_OVERLAY  = $('DODAJ_OVERLAY');
  const DODAJ_OK       = $('DODAJ_OK');

  // Pola pickera (ID używane przez WYBORKOLORU.js — NIE zmieniamy)
  const COLORBOX_HEX = $('colorBoxHEX');

  // Sekcje
  const SEKCJA_TORCH  = $('SEKCJA_TORCH');
  const SEKCJA_SCREEN = $('SEKCJA_SCREEN');

  // Tło świecenia ekranu
  const SCREEN_OVERLAY = $('SCREEN_OVERLAY');

  // Suwaki – wiersze
  const ROW_TORCH  = $('ROW_TORCH');
  const ROW_SCREEN = $('ROW_SCREEN');

  const prevVal = new WeakMap();

  const S = {
    torchMode:null, torchOn:false, torchSpeed:200,
    stream:null, videoTrack:null, torchIntervalId:null, torchSOSId:null,

    screenMode:null, screenOn:false, screenSpeed:200,
    screenColors:['#FFFFFF'], screenIntervalId:null, screenSOSId:null,
    mixOn:false
  };

  const SOS_SEQ = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1200];

  document.addEventListener('DOMContentLoaded', ()=>{
    // POKAŻ / UKRYJ
    BTN_PANEL_TOGGLE.textContent = 'UKRYJ';
    BTN_PANEL_TOGGLE.addEventListener('click', ()=>{
      const zwin = !PANEL_ROOT.classList.contains('ZWINIETY');
      PANEL_ROOT.classList.toggle('ZWINIETY', zwin);
      BTN_PANEL_TOGGLE.textContent = zwin ? 'POKAŻ' : 'UKRYJ';
    });

    // TABS
    TAB_TORCH .addEventListener('click', ()=>aktywujZakladke('torch'));
    TAB_SCREEN.addEventListener('click', ()=>aktywujZakladke('screen'));
    aktywujZakladke('screen');

    // Suwaki
    initSlider(TORCH_SPEED);
    initSlider(SCREEN_SPEED);

    // Tryby TORCH
    TORCH_SOLID .addEventListener('click', ()=>toggleTorchMode('solid', TORCH_SOLID));
    TORCH_SOS   .addEventListener('click', ()=>toggleTorchMode('sos',   TORCH_SOS));
    TORCH_STROBE.addEventListener('click', ()=>toggleTorchMode('strobe',TORCH_STROBE));

    // Tryby SCREEN
    SCREEN_SOLID .addEventListener('click', ()=>toggleScreenMode('solid', SCREEN_SOLID));
    SCREEN_SOS   .addEventListener('click', ()=>toggleScreenMode('sos',   SCREEN_SOS));
    SCREEN_STROBE.addEventListener('click', ()=>toggleScreenMode('strobe',SCREEN_STROBE));

    // Paleta główna: wybór/mix
    KOLORY_LISTA.addEventListener('click',(e)=>{
      const btn = e.target.closest('.KOLOR'); if(!btn) return;
      spinHex(btn);

      if(btn===MIX_SWATCH){
        S.mixOn = !S.mixOn;
        btn.classList.toggle('AKTYWNY', S.mixOn);
        if(S.mixOn){
          S.screenColors = hueWheel(24);
          [...KOLORY_LISTA.querySelectorAll('.KOLOR')].forEach(k=>{ if(k!==MIX_SWATCH) k.classList.remove('AKTYWNY'); });
        }else{
          updateSelectedColors();
          if(S.screenColors.length===0) S.screenColors=['#FFFFFF'];
        }
        livePreview(true);
        return;
      }

      btn.classList.toggle('AKTYWNY');
      S.mixOn=false; MIX_SWATCH.classList.remove('AKTYWNY');
      updateSelectedColors();
      livePreview(false);
    });

    // DODAJ – otwórz overlay fullscreen
    HEX_ADD?.addEventListener('click', ()=>{
      const aktywny = KOLORY_LISTA.querySelector('.KOLOR.AKTYWNY[data-kolor]');
      const start = (aktywny ? (aktywny.dataset.kolor||'#FFFFFF') : '#FFFFFF').toUpperCase();
      otworzOverlay(start);
    });

    // OK = dodaj do palety
    DODAJ_OK?.addEventListener('click', ()=>{
      const kolor = normHex(COLORBOX_HEX?.value) || '#FFFFFF';
      if(!isHex6(kolor)) return;

      const btn = document.createElement('button');
      btn.className = 'KOLOR';
      btn.dataset.kolor = kolor;
      btn.style.setProperty('--c', kolor);
      btn.title = kolor;
      KOLORY_LISTA.appendChild(btn);

      // zaznacz nowy, wyłącz mix
      [...KOLORY_LISTA.querySelectorAll('.KOLOR')].forEach(k=>k.classList.remove('AKTYWNY'));
      btn.classList.add('AKTYWNY');
      S.mixOn=false; MIX_SWATCH?.classList.remove('AKTYWNY');

      updateSelectedColors();
      livePreview(true);
      zamknijOverlay();
    });

    // ESC zamyka
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape' && !DODAJ_OVERLAY.classList.contains('UKRYTY')) zamknijOverlay();
    });

    // Klik „gdziekolwiek” poza elementami interaktywnymi — zamyka (pełny ekran)
    const interaktywne = '#hexagonPicker, .LATARKA_KOLORY_BOXES, .LATARKA_OVERLAY_PRZYCISKI';
    DODAJ_OVERLAY.addEventListener('click', (ev)=>{
      if(ev.target.closest(interaktywne)) return; // klik w elementy = NIE zamykaj
      // klik w puste miejsce (tło lub wolne miejsce wewnątrz pełnoekranowego okna) = zamknij
      zamknijOverlay();
    }, {passive:true});

    // start: suwaki ukryte
    showRow(ROW_TORCH,false);
    showRow(ROW_SCREEN,false);

    updateSelectedColors();
  });

  /* Overlay */
  function otworzOverlay(startHex){
    if(COLORBOX_HEX) COLORBOX_HEX.value = startHex;
    DODAJ_OVERLAY.classList.remove('UKRYTY');
    DODAJ_OVERLAY.setAttribute('aria-hidden','false');
  }
  function zamknijOverlay(){
    DODAJ_OVERLAY.classList.add('UKRYTY');
    DODAJ_OVERLAY.setAttribute('aria-hidden','true');
  }

  /* Zakładki */
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

  /* Suwak: animowany kierunek obrotu */
  function initSlider(input){
    if(!input) return;
    prevVal.set(input, Number(input.value)||0);
    input.addEventListener('input', ()=>{
      const last = prevVal.get(input) ?? 0;
      const now  = Number(input.value)||0;
      const dir  = (now>last) ? 'P' : (now<last) ? 'L' : null;
      if(dir){
        input.classList.remove('OBROT_P','OBROT_L');
        void input.offsetWidth;
        input.classList.add(dir==='P' ? 'OBROT_P' : 'OBROT_L');
        setTimeout(()=>input.classList.remove('OBROT_P','OBROT_L'), 360);
      }
      prevVal.set(input, now);

      if(input===TORCH_SPEED){
        S.torchSpeed = toInt(TORCH_SPEED.value,200);
        if(S.torchOn && S.torchMode==='strobe') runTorchStrobe();
      }else if(input===SCREEN_SPEED){
        S.screenSpeed = toInt(SCREEN_SPEED.value,200);
        if(S.screenOn && S.screenMode==='strobe') startScreen();
      }
    });
  }

  /* LATARKA (aparat/torch) */
  async function toggleTorchMode(mode, btn){
    if(S.torchMode===mode){
      await stopTorch();
      S.torchMode=null;
      setActive([TORCH_SOLID,TORCH_SOS,TORCH_STROBE], null);
      updateSlidersVisibility();
      return;
    }
    S.torchMode = mode;
    setActive([TORCH_SOLID,TORCH_SOS,TORCH_STROBE], btn);
    updateSlidersVisibility();
    await startTorch();
  }
  async function startTorch(){
    await stopTorch();
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment', torch:true } });
      S.stream = stream;
      S.videoTrack = stream.getVideoTracks()[0];
      S.torchOn = true;

      if(S.torchMode==='solid'){
        await S.videoTrack.applyConstraints({ advanced:[{ torch:true }] });
      }else if(S.torchMode==='sos'){
        runTorchSOS();
      }else if(S.torchMode==='strobe'){
        runTorchStrobe();
      }
    }catch(err){
      console.error('torch:',err);
      S.torchOn=false;
      alert('Nie mogę włączyć latarki. Uprawnienia lub wsparcie „torch” mogą być wyłączone.');
    }
  }
  async function stopTorch(){
    clearInterval(S.torchIntervalId); S.torchIntervalId=null;
    if(S.torchSOSId){ clearTimeout(S.torchSOSId); S.torchSOSId=null; }
    try{
      if(S.videoTrack){
        await S.videoTrack.applyConstraints({ advanced:[{ torch:false }] });
        S.videoTrack.stop();
      }
    }catch(_){}
    if(S.stream){ S.stream.getTracks().forEach(t=>t.stop()); }
    S.stream=null; S.videoTrack=null; S.torchOn=false;
  }
  function runTorchStrobe(){
    clearInterval(S.torchIntervalId);
    let on=false;
    S.torchIntervalId = setInterval(async ()=>{
      on=!on;
      try{ await S.videoTrack.applyConstraints({ advanced:[{ torch:on }] }); }
      catch(err){ console.error(err); stopTorch(); }
    }, S.torchSpeed);
  }
  function runTorchSOS(){
    if(S.torchSOSId){ clearTimeout(S.torchSOSId); S.torchSOSId=null; }
    clearInterval(S.torchIntervalId); S.torchIntervalId=null;
    let i=0;
    const step = async ()=>{
      if(!S.torchOn || S.torchMode!=='sos') return;
      const on = (i%2===0);
      try{ await S.videoTrack.applyConstraints({ advanced:[{ torch:on }] }); }
      catch(_){ stopTorch(); return; }
      const wait = SOS_SEQ[i++ % SOS_SEQ.length];
      S.torchSOSId = setTimeout(step, wait);
    };
    step();
  }

  /* EKRAN (tło) */
  function toggleScreenMode(mode, btn){
    if(S.screenMode===mode){
      stopScreen();
      S.screenMode=null;
      setActive([SCREEN_SOLID,SCREEN_SOS,SCREEN_STROBE], null);
      updateSlidersVisibility();
      return;
    }
    S.screenMode = mode;
    setActive([SCREEN_SOLID,SCREEN_SOS,SCREEN_STROBE], btn);
    updateSlidersVisibility();
    startScreen();
  }
  function startScreen(){
    stopScreen();
    S.screenOn = true;
    if(S.screenMode==='solid'){
      setOverlayColor(S.screenColors[0] || '#FFFFFF');
    }else if(S.screenMode==='sos'){
      runScreenSOS();
    }else if(S.screenMode==='strobe'){
      runScreenStrobe();
    }
  }
  function stopScreen(){
    S.screenOn=false;
    SCREEN_OVERLAY.classList.add('UKRYTY');
    clearInterval(S.screenIntervalId); S.screenIntervalId=null;
    if(S.screenSOSId){ clearTimeout(S.screenSOSId); S.screenSOSId=null; }
  }
  function setOverlayColor(c){
    SCREEN_OVERLAY.style.background = c;
    SCREEN_OVERLAY.classList.remove('UKRYTY');
  }
  function runScreenStrobe(){
    let i=0;
    const seq = S.mixOn ? hueWheel(24) : (S.screenColors.length?S.screenColors:['#FFFFFF']);
    S.screenIntervalId = setInterval(()=>{
      setOverlayColor(seq[i++ % seq.length]);
    }, S.screenSpeed);
  }
  function runScreenSOS(){
    let i=0;
    const step = ()=>{
      if(!S.screenOn || S.screenMode!=='sos') return;
      const on = (i%2===0);
      setOverlayColor(on ? '#FFFFFF' : '#000000');
      const wait = SOS_SEQ[i++ % SOS_SEQ.length];
      S.screenSOSId = setTimeout(step, wait);
    };
    step();
  }

  /* Paleta: pomocnicze */
  function updateSelectedColors(){
    const wybrane = [...KOLORY_LISTA.querySelectorAll('.KOLOR.AKTYWNY[data-kolor]')]
      .map(b=>b.dataset.kolor?.toUpperCase())
      .filter(Boolean);
    S.screenColors = wybrane.length ? wybrane : ['#FFFFFF'];
  }
  function livePreview(force){
    if(!S.screenOn) return;
    if(S.screenMode==='solid' || force){
      setOverlayColor(S.mixOn ? '#FFFFFF' : (S.screenColors[0] || '#FFFFFF'));
    }
  }
  function setActive(btns, active){ btns.forEach(b=>b.classList.toggle('TRYB_AKTYWNY', b===active)); }
  function showRow(row, vis){ row.classList.toggle('UKRYTY', !vis); }
  function updateSlidersVisibility(){
    showRow(ROW_TORCH,  S.torchMode==='strobe');
    showRow(ROW_SCREEN, S.screenMode==='strobe');
  }

  /* utils */
  function toInt(v, def){ const n = parseInt(v,10); return Number.isFinite(n)?n:def; }
  function hueWheel(n){ const out=[]; for(let i=0;i<n;i++){ const h=Math.round(i*360/n); out.push(`hsl(${h} 100% 50%)`);} return out; }
  function spinHex(el){ el.classList.remove('OBROT'); void el.offsetWidth; el.classList.add('OBROT'); setTimeout(()=>el.classList.remove('OBROT'), 380); }
  function isHex6(v){ return /^#[0-9A-Fa-f]{6}$/.test(String(v||'')); }
  function normHex(v){
    const s = String(v||'').trim().toUpperCase();
    if(/^#[0-9A-F]{6}$/.test(s)) return s;
    if(/^[0-9A-F]{6}$/.test(s)) return '#'+s;
    if(/^#[0-9A-F]{3}$/.test(s)){
      const c = s.slice(1); return '#'+c.split('').map(ch=>ch+ch).join('');
    }
    if(/^[0-9A-F]{3}$/.test(s)){ return '#'+s.split('').map(ch=>ch+ch).join(''); }
    return null;
  }
})();
