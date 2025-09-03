/* LATARKA – heksagony kolorów z ramką po kliknięciu, MIESZANY, HEX + tryby EKRAN/LATARKA */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);

  // Korzeń + sterowanie
  const PANEL_ROOT = $('PANEL_ROOT');
  const BTN_PANEL_TOGGLE = $('BTN_PANEL_TOGGLE');

  // Zakładki
  const TAB_TORCH  = $('TAB_TORCH');
  const TAB_SCREEN = $('TAB_SCREEN');

  // Torch (aparat)
  const TORCH_SOLID   = $('TORCH_SOLID');
  const TORCH_SOS     = $('TORCH_SOS');
  const TORCH_STROBE  = $('TORCH_STROBE');
  const TORCH_SPEED   = $('TORCH_SZYBKOSC');

  // Screen (tło)
  const SCREEN_SOLID   = $('SCREEN_SOLID');
  const SCREEN_SOS     = $('SCREEN_SOS');
  const SCREEN_STROBE  = $('SCREEN_STROBE');
  const SCREEN_SPEED   = $('SCREEN_SZYBKOSC');

  // Paleta
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
    torchOn:false, torchMode:null, torchSpeed:200,
    stream:null, videoTrack:null, torchIntervalId:null, torchSOSId:null,

    // screen
    screenOn:false, screenMode:null, screenSpeed:200,
    screenColors:['#FFFFFF'], screenIntervalId:null, screenSOSId:null,
    mixOn:false
  };

  const SOS_SEQ = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1200];

  /* ===== INIT ===== */
  document.addEventListener('DOMContentLoaded', () => {
    // POKAŻ/UKRYJ
    BTN_PANEL_TOGGLE.textContent = 'UKRYJ';
    BTN_PANEL_TOGGLE.addEventListener('click', ()=>{
      const zwin = !PANEL_ROOT.classList.contains('ZWINIETY');
      PANEL_ROOT.classList.toggle('ZWINIETY', zwin);
      BTN_PANEL_TOGGLE.textContent = zwin ? 'POKAŻ' : 'UKRYJ';
    });

    // Zakładki
    TAB_TORCH .addEventListener('click', ()=>aktywujZakladke('torch'));
    TAB_SCREEN.addEventListener('click', ()=>aktywujZakladke('screen'));
    if (window.matchMedia('(min-width: 999px)').matches){ aktywujZakladke('screen'); } else { aktywujZakladke('screen'); }

    // TORCH tryby (toggle)
    TORCH_SOLID .addEventListener('click', ()=>toggleTorchMode('solid', TORCH_SOLID));
    TORCH_SOS   .addEventListener('click', ()=>toggleTorchMode('sos',   TORCH_SOS));
    TORCH_STROBE.addEventListener('click', ()=>toggleTorchMode('strobe',TORCH_STROBE));
    TORCH_SPEED.addEventListener('input', ()=>{
      S.torchSpeed = toInt(TORCH_SPEED.value,200);
      if(S.torchOn && S.torchMode==='strobe') runTorchStrobe();
    });

    // EKRAN tryby (toggle)
    SCREEN_SOLID .addEventListener('click', ()=>toggleScreenMode('solid', SCREEN_SOLID));
    SCREEN_SOS   .addEventListener('click', ()=>toggleScreenMode('sos',   SCREEN_SOS));
    SCREEN_STROBE.addEventListener('click', ()=>toggleScreenMode('strobe',SCREEN_STROBE));
    SCREEN_SPEED.addEventListener('input', ()=>{
      S.screenSpeed = toInt(SCREEN_SPEED.value,200);
      if(S.screenOn && S.screenMode==='strobe') startScreen(); // restart interwału
    });

    // KOLORY – kliknięcia (wiele aktywnych dozwolone)
    KOLORY_LISTA.addEventListener('click',(e)=>{
      const btn = e.target.closest('.KOLOR'); if(!btn) return;

      if(btn===MIX_SWATCH){
        S.mixOn = !S.mixOn;
        btn.classList.toggle('AKTYWNY', S.mixOn);
        if(S.mixOn){
          S.screenColors = generateHueWheel(24);
          // zdejmij wizualne zaznaczenie z innych (opcjonalnie)
          [...KOLORY_LISTA.querySelectorAll('.KOLOR')].forEach(k=>{ if(k!==MIX_SWATCH) k.classList.remove('AKTYWNY'); });
        }else{
          updateSelectedColors();
          if(S.screenColors.length===0) S.screenColors=['#FFFFFF'];
        }
        immediateScreenPreview(true);
        return;
      }

      // zwykły kolor – toggle wielu
      btn.classList.toggle('AKTYWNY');
      S.mixOn=false; MIX_SWATCH.classList.remove('AKTYWNY');
      updateSelectedColors();
      immediateScreenPreview(false);
    });

    // HEX input: auto ‘#’, filtr znaków, UPPERCASE
    if(!HEX_INPUT.value) HEX_INPUT.value = '#';
    HEX_INPUT.addEventListener('input', ()=>{
      let v = HEX_INPUT.value.toUpperCase();
      if(!v.startsWith('#')) v = '#' + v.replace(/#/g,'');
      v = '#' + v.slice(1).replace(/[^0-9A-F]/g,'').slice(0,6);
      HEX_INPUT.value = v;
    });

    HEX_ADD.addEventListener('click', ()=>{
      const v = (HEX_INPUT.value||'').trim().toUpperCase();
      if(!/^#([0-9A-F]{3}){1,2}$/.test(v)){ alert('Podaj HEX (#RRGGBB lub #RGB)'); return; }
      const exists = [...KOLORY_LISTA.querySelectorAll('.KOLOR')].find(x=>x.dataset.kolor && x.dataset.kolor.toUpperCase()===v);
      if(exists){
        exists.classList.toggle('AKTYWNY', true);
        S.mixOn=false; MIX_SWATCH.classList.remove('AKTYWNY');
        updateSelectedColors(); immediateScreenPreview(false);
        return;
      }
      const b = document.createElement('button');
      b.className='KOLOR AKTYWNY'; b.dataset.kolor=v; b.style.setProperty('--c',v); b.title=v;
      KOLORY_LISTA.appendChild(b);
      S.mixOn=false; MIX_SWATCH.classList.remove('AKTYWNY');
      updateSelectedColors(); immediateScreenPreview(false);
    });

    updateSelectedColors();
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
  }

  /* ===== TORCH (aparat) ===== */
  async function toggleTorchMode(mode, btn){
    const sameMode = (S.torchMode===mode && S.torchOn);
    if(sameMode){
      await stopTorch();
      setActiveBtn([TORCH_SOLID,TORCH_SOS,TORCH_STROBE], null);
      return;
    }
    S.torchMode = mode;
    await startTorch();
    setActiveBtn([TORCH_SOLID,TORCH_SOS,TORCH_STROBE], btn);
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
    if(S.torchSOSId){ clearTimeout(S.torchSOSId); }
    let i=0;
    const step = async ()=>{
      if(!S.torchOn || S.torchMode!=='sos') return;
      const on = (i%2===0);
      try{ await S.videoTrack.applyConstraints({ advanced:[{ torch:on }] }); }catch(_){ stopTorch(); return; }
      const wait = SOS_SEQ[i++ % SOS_SEQ.length];
      S.torchSOSId = setTimeout(step, wait);
    };
    step();
  }

  /* ===== EKRAN (tło) ===== */
  function toggleScreenMode(mode, btn){
    const sameMode = (S.screenMode===mode && S.screenOn);
    if(sameMode){
      stopScreenFull();
      setActiveBtn([SCREEN_SOLID,SCREEN_SOS,SCREEN_STROBE], null);
      return;
    }
    S.screenMode = mode;
    startScreenFull();
    setActiveBtn([SCREEN_SOLID,SCREEN_SOS,SCREEN_STROBE], btn);
  }

  function startScreenFull(){
    SCREEN_OVERLAY.classList.remove('UKRYTY');
    S.screenOn = true;

    stopScreenTimersOnly();
    if(S.screenMode==='solid'){
      const colors = getActiveColors();
      SCREEN_OVERLAY.style.background = colors[0];
    }else if(S.screenMode==='strobe'){
      startScreen();
    }else if(S.screenMode==='sos'){
      runScreenSOS();
    }
  }

  function stopScreenFull(){
    stopScreenTimersOnly();
    SCREEN_OVERLAY.style.background='#000000';
    SCREEN_OVERLAY.classList.add('UKRYTY');
    S.screenOn=false;
  }

  function stopScreenTimersOnly(){
    if(S.screenIntervalId){ clearInterval(S.screenIntervalId); S.screenIntervalId=null; }
    if(S.screenSOSId){ clearTimeout(S.screenSOSId); S.screenSOSId=null; }
  }

  function startScreen(){
    stopScreenTimersOnly();
    const setBg = (c)=>{ SCREEN_OVERLAY.style.background = c; };
    const colors = getActiveColors();

    if(S.screenMode==='solid'){
      setBg(colors[0]); return;
    }
    // STROBE
    let idx=-1;
    S.screenIntervalId = setInterval(()=>{
      idx = (idx+1) % (colors.length===1?2:colors.length);
      if(colors.length===1){
        setBg(idx===0 ? colors[0] : '#000000');
      }else if(colors.length===2){
        setBg(idx===0 ? colors[0] : colors[1]);
      }else{
        setBg(colors[idx]);
      }
    }, S.screenSpeed);
  }

  function runScreenSOS(){
    if(S.screenSOSId){ clearTimeout(S.screenSOSId); }
    const base = getActiveColors()[0] || '#FFFFFF';
    let i=0;
    const step=()=>{
      if(!S.screenOn || S.screenMode!=='sos') return;
      const on = (i%2===0);
      SCREEN_OVERLAY.style.background = on ? base : '#000000';
      const wait = SOS_SEQ[i++ % SOS_SEQ.length];
      S.screenSOSId = setTimeout(step, wait);
    };
    step();
  }

  function getActiveColors(){
    if(S.mixOn){
      return generateHueWheel(24);
    }
    const list = [...S.screenColors];
    return list.length? list : ['#FFFFFF'];
  }

  function updateSelectedColors(){
    S.screenColors = [...KOLORY_LISTA.querySelectorAll('.KOLOR.AKTYWNY')]
      .filter(k=>k.dataset.kolor)
      .map(k=>k.dataset.kolor.toUpperCase());
    if(S.screenColors.length===0) S.screenColors=['#FFFFFF'];
  }

  function immediateScreenPreview(forceRestart){
    if(!S.screenOn) return;
    if(S.screenMode==='solid' && !S.mixOn && !forceRestart){
      SCREEN_OVERLAY.style.background = (S.screenColors[0]||'#FFFFFF');
    }else{
      startScreenFull();
    }
  }

  /* ===== Utils ===== */
  const toInt=(v,f)=>{ v=parseInt(v,10); return isNaN(v)?f:v; };
  function setActiveBtn(group, active){
    group.forEach(b=>b.classList.toggle('TRYB_AKTYWNY', b===active));
  }
  function generateHueWheel(n=24){
    const out=[];
    for(let i=0;i<n;i++){
      const h = Math.round((360/n)*i);
      out.push(`hsl(${h} 100% 50%)`);
    }
    return out;
  }
})();
