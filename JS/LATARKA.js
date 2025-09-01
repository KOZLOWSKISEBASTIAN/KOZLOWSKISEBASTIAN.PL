/* LATARKA – padding/gap; „Dodaj kolor” i „Włącz ekran” obok siebie; POKAŻ wyśrodkowany; MIX = pełne RGB */
(function(){
  'use strict';

  const $ = (id)=>document.getElementById(id);

  // Sterowanie i korzeń
  const PANEL_ROOT = $('PANEL_ROOT');
  const BTN_PANEL_TOGGLE = $('BTN_PANEL_TOGGLE');
  const TAB_TORCH  = $('TAB_TORCH');
  const TAB_SCREEN = $('TAB_SCREEN');

  // Torch (aparat)
  const BTN_TORCH    = $('BTN_TORCH');
  const TORCH_SOLID  = $('TORCH_SOLID');
  const TORCH_SOS    = $('TORCH_SOS');
  const TORCH_STROBE = $('TORCH_STROBE');
  const TORCH_SPEED  = $('TORCH_SZYBKOSC');
  const TORCH_SPEED_BOX = $('TORCH_SZYBKOSC_BOX');

  // Screen (tło)
  const BTN_SCREEN   = $('BTN_SCREEN');
  const SCREEN_SOLID = $('SCREEN_SOLID');
  const SCREEN_STROBE= $('SCREEN_STROBE');
  const SCREEN_SPEED = $('SCREEN_SZYBKOSC');
  const SCREEN_SPEED_BOX = $('SCREEN_SZYBKOSC_BOX');

  // Kolory
  const KOLORY_LISTA = $('KOLORY_LISTA');
  const HEX_INPUT    = $('HEX_INPUT');
  const HEX_ADD      = $('HEX_ADD');
  const MIX_SWATCH   = $('MIX_SWATCH');

  // Sekcje
  const SEKCJA_TORCH  = $('SEKCJA_TORCH');
  const SEKCJA_SCREEN = $('SEKCJA_SCREEN');

  // Tło
  const SCREEN_OVERLAY = $('SCREEN_OVERLAY');

  // Stan
  const S = {
    // torch
    torchOn:false, torchMode:'solid', torchSpeed:200,
    stream:null, videoTrack:null, torchIntervalId:null,

    // screen
    screenOn:false, screenMode:'solid', screenSpeed:200,
    screenColors:['#FFFFFF','#FF00FF'], screenIntervalId:null,
    mixOn:false, // tryb pełnego RGB
  };

  const SOS = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1000];

  // --- INIT
  function init(){
    // POKAŻ/UKRYJ (chowa wszystko, łącznie z PRZYBORNIK)
    BTN_PANEL_TOGGLE.addEventListener('click', ()=>{
      const zwin = !PANEL_ROOT.classList.contains('ZWINIETY');
      PANEL_ROOT.classList.toggle('ZWINIETY', zwin);
      BTN_PANEL_TOGGLE.textContent = zwin ? 'POKAŻ' : 'UKRYJ';
    });

    // Zakładki
    TAB_TORCH .addEventListener('click', ()=>aktywujZakladke('torch'));
    TAB_SCREEN.addEventListener('click', ()=>aktywujZakladke('screen'));

    // Główne
    BTN_TORCH .addEventListener('click', toggleTorch);
    BTN_SCREEN.addEventListener('click', toggleScreen);

    // Tryby torch
    [TORCH_SOLID,TORCH_SOS,TORCH_STROBE].forEach(b=>b.addEventListener('click', ()=>setTorchMode(b.dataset.val)));
    TORCH_SPEED.addEventListener('input', ()=>{
      S.torchSpeed = toInt(TORCH_SPEED.value,200);
      if(S.torchOn && S.torchMode==='strobe') restartTorch();
    });

    // Tryby ekranu
    [SCREEN_SOLID,SCREEN_STROBE].forEach(b=>b.addEventListener('click', ()=>setScreenMode(b.dataset.val)));
    SCREEN_SPEED.addEventListener('input', ()=>{
      S.screenSpeed = toInt(SCREEN_SPEED.value,200);
      if(S.screenOn) startScreen();
    });

    // Swatche kolorów
    KOLORY_LISTA.addEventListener('click',(e)=>{
      const btn = e.target.closest('.KOLOR'); if(!btn) return;
      if(btn===MIX_SWATCH){
        S.mixOn = !S.mixOn;
        btn.classList.toggle('AKTYWNY', S.mixOn);
        if(S.mixOn){
          // tryb mieszany – pełne koło barw
          S.screenColors = generateHueWheel(24); // 24 odcienie (co 15°)
        }else{
          // wracamy do aktualnie zaznaczonych „zwykłych” kolorów
          updateSelectedColors();
          if(S.screenColors.length===0) S.screenColors=['#FFFFFF'];
        }
        immediateScreenPreview(true);
        return;
      }
      // zwykły kolor
      btn.classList.toggle('AKTYWNY');
      updateSelectedColors();
      S.mixOn = false;
      MIX_SWATCH.classList.remove('AKTYWNY');
      immediateScreenPreview(false);
    });

    // Dodaj kolor
    HEX_ADD.addEventListener('click', ()=>{
      const v = (HEX_INPUT.value||'').trim().toUpperCase();
      if(!/^#([0-9A-F]{3}){1,2}$/.test(v)){ alert('Podaj HEX, np. #00FF00'); return; }
      const exists = [...KOLORY_LISTA.querySelectorAll('.KOLOR')].find(x=>x.dataset.kolor && x.dataset.kolor.toUpperCase()===v);
      if(exists){ exists.classList.add('AKTYWNY'); S.mixOn=false; MIX_SWATCH.classList.remove('AKTYWNY'); updateSelectedColors(); immediateScreenPreview(false); return; }
      const b = document.createElement('button');
      b.className='KOLOR AKTYWNY'; b.dataset.kolor=v; b.style.setProperty('--c',v); b.title=v;
      KOLORY_LISTA.appendChild(b);
      HEX_INPUT.value='';
      S.mixOn=false; MIX_SWATCH.classList.remove('AKTYWNY');
      updateSelectedColors(); immediateScreenPreview(false);
    });

    // Start
    aktywujZakladke('screen');  // zaczniemy od EKRAN, łatwiej testować kolory
    setTorchMode('solid');
    setScreenMode('solid');
  }

  // --- Zakładki
  function aktywujZakladke(which){
    if(which==='torch'){
      SEKCJA_TORCH.classList.remove('UKRYTY');
      SEKCJA_SCREEN.classList.add('UKRYTY');
    }else{
      SEKCJA_SCREEN.classList.remove('UKRYTY');
      SEKCJA_TORCH.classList.add('UKRYTY');
    }
  }

  // --- TORCH (aparat)
  function setTorchMode(val){
    S.torchMode = val;
    TORCH_SPEED_BOX.classList.toggle('UKRYTY', val!=='strobe');
    if(S.torchOn) restartTorch();
  }
  async function toggleTorch(){
    S.torchOn = !S.torchOn;
    if(S.torchOn){
      await startTorch();
      BTN_TORCH.textContent='WYŁĄCZ LATARKĘ (APARAT)';
    }else{
      await stopTorch();
      BTN_TORCH.textContent='WŁĄCZ LATARKĘ (APARAT)';
    }
  }
  async function startTorch(){
    await stopTorch();
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment', torch:true } });
      S.stream = stream;
      S.videoTrack = stream.getVideoTracks()[0];
      if(S.torchMode==='solid'){
        await S.videoTrack.applyConstraints({ advanced:[{ torch:true }] });
      }else if(S.torchMode==='sos'){
        runTorchSOS();
      }else{
        runTorchStrobe();
      }
    }catch(err){
      console.error('torch:',err);
      S.torchOn=false;
      alert('Nie mogę włączyć latarki. Uprawnienia lub wsparcie „torch” mogą być wyłączone.');
    }
  }
  async function stopTorch(){
    clearInterval(S.torchIntervalId);
    try{
      if(S.videoTrack){
        await S.videoTrack.applyConstraints({ advanced:[{ torch:false }] });
        S.videoTrack.stop();
      }
    }catch(_){}
    S.videoTrack=null;
    if(S.stream){ S.stream.getTracks().forEach(t=>t.stop()); }
    S.stream=null;
  }
  async function restartTorch(){ if(S.torchOn){ await startTorch(); } }
  function runTorchStrobe(){
    let on=false;
    clearInterval(S.torchIntervalId);
    S.torchIntervalId = setInterval(async ()=>{
      on=!on;
      try{ await S.videoTrack.applyConstraints({ advanced:[{ torch:on }] }); }
      catch(err){ console.error(err); toggleTorch(); }
    }, S.torchSpeed);
  }
  function runTorchSOS(){
    let i=0;
    const step=async ()=>{
      if(!S.torchOn) return;
      if(i>=SOS.length) i=0;
      try{
        const on = (i%2===0);
        await S.videoTrack.applyConstraints({ advanced:[{ torch:on }] });
      }catch(err){ console.error(err); toggleTorch(); return; }
      const wait = SOS[i++]; setTimeout(step, wait);
    };
    step();
  }

  // --- EKRAN (tło)
  function setScreenMode(val){
    S.screenMode = val;
    SCREEN_SPEED_BOX.classList.toggle('UKRYTY', val!=='strobe');
    if(S.screenOn) startScreen();
  }
  function toggleScreen(){
    S.screenOn = !S.screenOn;
    if(S.screenOn){
      startScreen();
      BTN_SCREEN.textContent='WYŁĄCZ EKRAN (TŁO)';
      SCREEN_OVERLAY.classList.remove('UKRYTY');
    }else{
      stopScreen();
      BTN_SCREEN.textContent='WŁĄCZ EKRAN (TŁO)';
      SCREEN_OVERLAY.classList.add('UKRYTY');
    }
  }
  function startScreen(){
    stopScreen();
    const setBg = (c)=>{ SCREEN_OVERLAY.style.background = c; };

    // Źródło kolorów: MIX albo zwykłe swatche
    const colors = (S.mixOn ? generateHueWheel(24) : (S.screenColors.length>0 ? S.screenColors.slice() : ['#FFFFFF']));

    if(S.screenMode==='solid'){
      setBg(colors[0]);
      return;
    }

    // STROBE
    let idx = -1;
    clearInterval(S.screenIntervalId);

    if(colors.length===2){
      S.screenIntervalId = setInterval(()=>{
        idx = (idx+1) & 1;
        setBg(colors[idx]);
      }, S.screenSpeed);
      return;
    }
    if(colors.length===1){
      S.screenIntervalId = setInterval(()=>{
        idx = (idx+1) & 1;
        setBg(idx===0 ? colors[0] : '#000000');
      }, S.screenSpeed);
      return;
    }
    S.screenIntervalId = setInterval(()=>{
      idx = (idx+1) % colors.length;
      setBg(colors[idx]);
    }, S.screenSpeed);
  }
  function stopScreen(){
    SCREEN_OVERLAY.style.background='#000000';
    clearInterval(S.screenIntervalId);
  }
  function updateSelectedColors(){
    // zbiera TYLKO zwykłe swatche (bez MIX)
    S.screenColors = [...KOLORY_LISTA.querySelectorAll('.KOLOR.AKTYWNY')]
      .filter(k=>k!==MIX_SWATCH && k.dataset.kolor)
      .map(k=>k.dataset.kolor.toUpperCase());
    if(S.screenColors.length===0) S.screenColors=['#FFFFFF'];
  }
  function immediateScreenPreview(forceRestart){
    if(!S.screenOn) return;
    if(S.screenMode==='solid' && !S.mixOn && !forceRestart){
      SCREEN_OVERLAY.style.background = (S.screenColors[0]||'#FFFFFF');
    }else{
      startScreen(); // restart interwału / trybu MIX
    }
  }

  // --- utils
  const toInt=(v,f)=>{ v=parseInt(v,10); return isNaN(v)?f:v; };

  // Pełne koło barw RGB (HSL: S=100%, L=50%); n = liczba „kroków”
  function generateHueWheel(n=24){
    const out=[];
    for(let i=0;i<n;i++){
      const h = Math.round((360/n)*i);
      out.push(`hsl(${h} 100% 50%)`);
    }
    return out;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
