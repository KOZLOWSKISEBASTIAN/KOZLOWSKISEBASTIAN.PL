/* LATARKA – dodano presety: POLICJA, POGOTOWIE, STRAŻ, FF00FF, CZARNY.
   Preset ustawia kolory, tryb (zwykle STROBOSKOP) i tempo. */
(function(){
  'use strict';

  const $ = (id)=>document.getElementById(id);

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

  // Kolory
  const KOLORY_LISTA = $('KOLORY_LISTA');
  const HEX_INPUT    = $('HEX_INPUT');
  const HEX_ADD      = $('HEX_ADD');
  const MIX_SWATCH   = $('MIX_SWATCH');
  const RETRO_SWATCH = $('RETRO_SWATCH');

  // Presety – nowe
  const POLICJA_SWATCH   = $('POLICJA_SWATCH');
  const POGOTOWIE_SWATCH = $('POGOTOWIE_SWATCH');
  const STRAZ_SWATCH     = $('STRAZ_SWATCH');
  const MAGENTA_SWATCH   = $('MAGENTA_SWATCH');
  const BLACK_SWATCH     = $('BLACK_SWATCH');

  // Sekcje
  const SEKCJA_TORCH  = $('SEKCJA_TORCH');
  const SEKCJA_SCREEN = $('SEKCJA_SCREEN');

  // Tło
  const SCREEN_OVERLAY = $('SCREEN_OVERLAY');

  // Stan
  const S = {
    // torch (flash)
    torchOn:false, torchMode:null, torchSpeed:200,
    stream:null, videoTrack:null, torchIntervalId:null, torchSOSId:null,

    // screen (overlay)
    screenOn:false, screenMode:null, screenSpeed:200,
    screenColors:['#FFFFFF','#FF00FF'], screenIntervalId:null, screenSOSId:null,
    mixOn:false, retroOn:false, presetOn:null /* 'policja'|'pogotowie'|'straz'|'magenta'|'black' */,
  };

  const SOS_SEQ = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1200];

  function init(){
    // Domyślnie panel rozwinięty → „UKRYJ”
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

    // Swatche (paleta standard)
    KOLORY_LISTA.addEventListener('click',(e)=>{
      const btn = e.target.closest('.KOLOR'); if(!btn) return;

      // MIESZANY (pełne RGB)
      if(btn===MIX_SWATCH){
        clearPresetFlags();
        S.mixOn = !S.mixOn; btn.classList.toggle('AKTYWNY', S.mixOn);
        if(S.mixOn){
          S.screenColors = generateHueWheel(24);
          if(!S.screenColors.map(x=>x.toUpperCase()).includes('#FF00FF')) S.screenColors.push('#FF00FF');
        }else{
          updateSelectedColors();
          if(S.screenColors.length===0) S.screenColors=['#FFFFFF'];
        }
        immediateScreenPreview(true);
        return;
      }

      // RETROWAVE
      if(btn===RETRO_SWATCH){
        togglePreset('retrowave', getRetrowavePalette(), 'strobe', 160, RETRO_SWATCH);
        return;
      }

      // PRESETY SŁUŻBY
      if(btn===POLICJA_SWATCH){
        // Policja – szybki Niebieski (opcjonalnie z off dla błysku)
        togglePreset('policja', ['#0000FF','#000000'], 'strobe', 120, POLICJA_SWATCH);
        return;
      }
      if(btn===POGOTOWIE_SWATCH){
        // Pogotowie – Niebieski ↔ Biały
        togglePreset('pogotowie', ['#0000FF','#FFFFFF'], 'strobe', 140, POGOTOWIE_SWATCH);
        return;
      }
      if(btn===STRAZ_SWATCH){
        // Straż – Czerwony ↔ Niebieski
        togglePreset('straz', ['#FF0000','#0000FF'], 'strobe', 140, STRAZ_SWATCH);
        return;
      }
      if(btn===MAGENTA_SWATCH){
        // FF00FF – Magenta ↔ Off
        togglePreset('magenta', ['#FF00FF','#000000'], 'strobe', 140, MAGENTA_SWATCH);
        return;
      }
      if(btn===BLACK_SWATCH){
        // CZARNY – stały czarny (wyłącza "świecenie" ekranu)
        togglePreset('black', ['#000000'], 'solid', 200, BLACK_SWATCH);
        return;
      }

      // Zwykły kolor z palety
      btn.classList.toggle('AKTYWNY');
      clearPresetFlags();
      updateSelectedColors();
      immediateScreenPreview(false);
    });

    // HEX input: auto ‘#’, filtr znaków, UPPERCASE
    if(HEX_INPUT){
      if(!HEX_INPUT.value) HEX_INPUT.value = '#';
      HEX_INPUT.addEventListener('input', ()=>{
        let v = HEX_INPUT.value.toUpperCase();
        if(!v.startsWith('#')) v = '#' + v.replace(/#/g,'');
        v = '#' + v.slice(1).replace(/[^0-9A-F]/g,'').slice(0,6);
        HEX_INPUT.value = v;
      });
    }
    HEX_ADD && HEX_ADD.addEventListener('click', ()=>{
      const v = (HEX_INPUT.value||'').trim().toUpperCase();
      if(!/^#([0-9A-F]{3}){1,2}$/.test(v)){ alert('Podaj HEX (#RRGGBB lub #RGB)'); return; }
      const exists = [...KOLORY_LISTA.querySelectorAll('.KOLOR')].find(x=>x.dataset.kolor && x.dataset.kolor.toUpperCase()===v);
      if(exists){ exists.classList.add('AKTYWNY'); clearPresetFlags(); updateSelectedColors(); immediateScreenPreview(false); return; }
      const b = document.createElement('button');
      b.className='KOLOR AKTYWNY'; b.dataset.kolor=v; b.style.setProperty('--c',v); b.title=v;
      KOLORY_LISTA.appendChild(b);
      clearPresetFlags();
      updateSelectedColors(); immediateScreenPreview(false);
    });
  }

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
      startScreen(); // interwał
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

  /* ===== Presety/palety ===== */
  function togglePreset(name, colors, mode, speed, swatchEl){
    const isActive = (S.presetOn===name);
    // wyłącz, jeśli był aktywny
    if(isActive){
      S.presetOn = null;
      swatchEl.classList.remove('AKTYWNY');
      // powrót do palety użytkownika
      updateSelectedColors();
      immediateScreenPreview(true);
      return;
    }
    // aktywuj preset
    clearPresetFlags();
    S.presetOn = name;
    swatchEl.classList.add('AKTYWNY');

    S.screenColors = colors.slice();
    S.screenMode   = mode || 'strobe';
    S.screenSpeed  = speed || 160;
    SCREEN_SPEED.value = String(S.screenSpeed);

    setActiveBtn([SCREEN_SOLID,SCREEN_SOS,SCREEN_STROBE],
      S.screenMode==='solid' ? SCREEN_SOLID :
      S.screenMode==='sos'   ? SCREEN_SOS   : SCREEN_STROBE);

    startScreenFull();
  }

  function clearPresetFlags(){
    S.retroOn=false; S.mixOn=false; S.presetOn=null;
    RETRO_SWATCH && RETRO_SWATCH.classList.remove('AKTYWNY');
    MIX_SWATCH && MIX_SWATCH.classList.remove('AKTYWNY');
    POLICJA_SWATCH && POLICJA_SWATCH.classList.remove('AKTYWNY');
    POGOTOWIE_SWATCH && POGOTOWIE_SWATCH.classList.remove('AKTYWNY');
    STRAZ_SWATCH && STRAZ_SWATCH.classList.remove('AKTYWNY');
    MAGENTA_SWATCH && MAGENTA_SWATCH.classList.remove('AKTYWNY');
    BLACK_SWATCH && BLACK_SWATCH.classList.remove('AKTYWNY');
  }

  function getActiveColors(){
    if(S.presetOn==='retrowave'){ return getRetrowavePalette(); }
    if(S.presetOn) return S.screenColors.slice();
    if(S.retroOn){ return getRetrowavePalette(); }
    if(S.mixOn){
      let arr = generateHueWheel(24);
      if(!arr.map(x=>x.toUpperCase()).includes('#FF00FF')) arr.push('#FF00FF');
      return arr;
    }
    return (S.screenColors.length>0? S.screenColors.slice(): ['#FFFFFF']);
  }

  // Neonowa paleta retrowave
  function getRetrowavePalette(){
    return ['#ff00ff','#b000ff','#5d00ff','#00eaff','#00ffd5','#ff0080'];
  }

  /* ===== Narzędzia ===== */
  const toInt=(v,f)=>{ v=parseInt(v,10); return isNaN(v)?f:v; };
  function setActiveBtn(group, active){
    group.forEach(b=>b.classList.toggle('TRYB_AKTYWNY', b===active));
  }
  function updateSelectedColors(){
    S.screenColors = [...KOLORY_LISTA.querySelectorAll('.KOLOR.AKTYWNY')]
      .filter(k=>k.dataset.kolor)
      .map(k=>k.dataset.kolor.toUpperCase());
    if(S.screenColors.length===0) S.screenColors=['#FFFFFF'];
  }
  function immediateScreenPreview(forceRestart){
    if(!S.screenOn) return;
    if(S.screenMode==='solid' && !S.mixOn && !S.retroOn && !S.presetOn && !forceRestart){
      SCREEN_OVERLAY.style.background = (S.screenColors[0]||'#FFFFFF');
    }else{
      startScreenFull();
    }
  }
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
