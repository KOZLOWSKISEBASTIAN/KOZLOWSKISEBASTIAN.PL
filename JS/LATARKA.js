/* LATARKA – bazuje na przyciskach/liczydle/kartach, maks. reuse wspólnych plików */
(function(){
  'use strict';

  // DOM
  const el = (id)=>document.getElementById(id);
  const $ = {
    goHome:     el('PRZYBORNIK_PRZYCISK'),
    menuBtn:    el('LATARKA_MENU'),
    panel:      el('LATARKA_PANEL'),
    btnTorch:   el('BTN_TORCH'),
    btnScreen:  el('BTN_SCREEN'),
    btnTorchOpt:  el('BTN_TORCH_OPCJE'),
    btnScreenOpt: el('BTN_SCREEN_OPCJE'),

    // opcje torch
    torchBox:     el('OPCJE_TORCH'),
    torchTryb:    el('TORCH_TRYB'),
    torchSpeedBox:el('TORCH_SZYBKOSC_BOX'),
    torchSpeed:   el('TORCH_SZYBKOSC'),
    torchSpeedVal:el('TORCH_SZYBKOSC_VAL'),
    torchTimer:   el('TORCH_TIMER'),
    torchTimerSet:el('TORCH_TIMER_SET'),

    // opcje screen
    screenBox:      el('OPCJE_SCREEN'),
    screenTryb:     el('SCREEN_TRYB'),
    screenSpeedBox: el('SCREEN_SZYBKOSC_BOX'),
    screenSpeed:    el('SCREEN_SZYBKOSC'),
    screenSpeedVal: el('SCREEN_SZYBKOSC_VAL'),
    screenTimer:    el('SCREEN_TIMER'),
    screenTimerSet: el('SCREEN_TIMER_SET'),
    koloryLista:    el('KOLORY_LISTA'),
    hexInput:       el('HEX_INPUT'),
    hexAdd:         el('HEX_ADD'),

    // overlays
    torchOverlay:   el('TORCH_OVERLAY'),
    screenOverlay:  el('SCREEN_OVERLAY'),
  };

  // STAN
  const state = {
    torchOn:false, torchMode:'solid', torchSpeed:200, torchTimerMin:0, torchTimerId:null,
    screenOn:false, screenMode:'solid', screenSpeed:200, screenTimerMin:0, screenTimerId:null,
    screenColors:['#FFFFFF'], colorIdx:0,
    stream:null, videoTrack:null, stroboId:null, wake:null,
  };

  // profile kolorów ekranu
  const profile = {
    fire:       ['#FF0000','#FFFFFF'],
    ambulance:  ['#FFFFFF','#0000FF'],
    police:     ['#0000FF','#FF0000'],
    special:    ['#FFFF00','#FFA500'],
  };

  // wzorzec SOS (on/off ms)
  const SOS = [200,200, 200,200, 200,200, 600,200, 600,200, 600,200, 200,200, 200,200, 200,1000];

  // INIT
  function init(){
    // nawigacja
    $.goHome.addEventListener('click', ()=>location.href='https://kozlowskisebastian.pl/PRZYBORNIK');
    $.menuBtn.addEventListener('click', ()=>$.panel.classList.toggle('ukryj'));

    // główne
    $.btnTorch.addEventListener('click', toggleTorch);
    $.btnScreen.addEventListener('click', toggleScreen);

    // opcje – torch
    $.btnTorchOpt.addEventListener('click', ()=>$.torchBox.classList.toggle('ukryj'));
    $.torchTryb.addEventListener('change', onTorchMode);
    $.torchSpeed.addEventListener('input', ()=>{
      state.torchSpeed = parseInt($.torchSpeed.value,10)||200;
      $.torchSpeedVal.textContent = state.torchSpeed+' ms';
      if(state.torchOn && state.torchMode==='strobe') restartTorch();
    });
    $.torchTimerSet.addEventListener('click', ()=>{
      state.torchTimerMin = clampInt($.torchTimer.value,0,60);
      setTorchTimer();
      alert('Wyłącznik latarki: '+state.torchTimerMin+' min');
    });

    // opcje – screen
    $.btnScreenOpt.addEventListener('click', ()=>$.screenBox.classList.toggle('ukryj'));
    $.screenTryb.addEventListener('change', onScreenMode);
    $.screenSpeed.addEventListener('input', ()=>{
      state.screenSpeed = parseInt($.screenSpeed.value,10)||200;
      $.screenSpeedVal.textContent = state.screenSpeed+' ms';
      if(state.screenOn) startScreen(); // restart
    });
    $.screenTimerSet.addEventListener('click', ()=>{
      state.screenTimerMin = clampInt($.screenTimer.value,0,60);
      setScreenTimer();
      alert('Wyłącznik ekranu: '+state.screenTimerMin+' min');
    });

    // kolory
    $.koloryLista.addEventListener('click', (e)=>{
      const b = e.target.closest('.KOLOR'); if(!b) return;
      document.querySelectorAll('.KOLOR').forEach(x=>x.classList.remove('aktywny'));
      b.classList.add('aktywny');
      state.screenColors = [b.dataset.kolor];
      if(state.screenOn) startScreen();
    });
    $.hexAdd.addEventListener('click', ()=>{
      const v = ($.hexInput.value||'').trim().toUpperCase();
      if(!/^#([0-9A-F]{3}){1,2}$/.test(v)){ alert('Podaj poprawny HEX, np. #FFFFFF'); return; }
      // jeżeli już istnieje – wybierz
      const exists = [...document.querySelectorAll('.KOLOR')].find(x=>x.dataset.kolor.toUpperCase()===v);
      if(exists){ exists.click(); return; }
      // dodaj
      const btn = document.createElement('button');
      btn.className='KOLOR aktywny'; btn.dataset.kolor=v; btn.style.setProperty('--c',v);
      document.querySelectorAll('.KOLOR').forEach(x=>x.classList.remove('aktywny'));
      $.koloryLista.appendChild(btn);
      state.screenColors=[v];
      $.hexInput.value='';
      if(state.screenOn) startScreen();
    });

    // porządki
    window.addEventListener('pagehide', cleanUp);
    onTorchMode(); onScreenMode();
  }

  // TORCH
  async function toggleTorch(){
    state.torchOn = !state.torchOn;
    if(state.torchOn){
      await startTorch();
      if(state.torchTimerMin>0) setTorchTimer();
      $.btnTorch.textContent='WYŁĄCZ LATARKĘ';
    }else{
      await stopTorch();
      clearTimeout(state.torchTimerId); state.torchTimerId=null;
      $.btnTorch.textContent='WŁĄCZ LATARKĘ';
    }
    updateOverlays();
  }

  function onTorchMode(){
    state.torchMode = $.torchTryb.value;
    $.torchSpeedBox.classList.toggle('ukryj', state.torchMode!=='strobe');
    if(state.torchOn) restartTorch();
  }

  async function startTorch(){
    await stopTorch();
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment', torch:true } });
      state.stream = stream;
      state.videoTrack = stream.getVideoTracks()[0];
      // stały / SOS / strobo
      if(state.torchMode==='solid'){
        await state.videoTrack.applyConstraints({ advanced:[{ torch:true }] });
      }else if(state.torchMode==='sos'){
        runTorchSOS();
      }else{
        runTorchStrobe();
      }
    }catch(err){
      console.error('Torch error:', err);
      state.torchOn=false;
      alert('Nie mogę włączyć latarki. Sprawdź uprawnienia lub wsparcie „torch” w przeglądarce.');
    }
  }

  async function stopTorch(){
    clearInterval(state.stroboId);
    try{
      if(state.videoTrack){
        await state.videoTrack.applyConstraints({ advanced:[{ torch:false }] });
        state.videoTrack.stop();
      }
    }catch(_){}
    state.videoTrack=null;
    if(state.stream){ state.stream.getTracks().forEach(t=>t.stop()); }
    state.stream=null;
  }

  async function restartTorch(){ if(state.torchOn){ await startTorch(); } }

  function runTorchStrobe(){
    let on=false;
    clearInterval(state.stroboId);
    state.stroboId = setInterval(async ()=>{
      on=!on;
      try{
        await state.videoTrack.applyConstraints({ advanced:[{ torch:on }] });
      }catch(err){ console.error(err); toggleTorch(); }
    }, state.torchSpeed);
  }

  function runTorchSOS(){
    let i=0;
    const step=async ()=>{
      if(!state.torchOn) return;
      if(i>=SOS.length) i=0;
      try{
        const on = (i%2===0);
        await state.videoTrack.applyConstraints({ advanced:[{ torch:on }] });
      }catch(err){ console.error(err); toggleTorch(); return; }
      const wait = SOS[i++]; setTimeout(step, wait);
    };
    step();
  }

  function setTorchTimer(){
    clearTimeout(state.torchTimerId);
    if(state.torchTimerMin>0){
      state.torchTimerId = setTimeout(async ()=>{ if(state.torchOn){ await toggleTorch(); alert('Latarka wyłączona (timer).'); } }, state.torchTimerMin*60*1000);
    }
  }

  // SCREEN FLASHLIGHT
  async function toggleScreen(){
    state.screenOn=!state.screenOn;
    if(state.screenOn){
      await keepAwake(true);
      await goFullscreen(true);
      startScreen();
      if(state.screenTimerMin>0) setScreenTimer();
      $.btnScreen.textContent='WYŁĄCZ EKRAN';
    }else{
      clearTimeout(state.screenTimerId); state.screenTimerId=null;
      await keepAwake(false);
      await goFullscreen(false);
      stopScreen();
      $.btnScreen.textContent='WŁĄCZ EKRAN';
    }
    updateOverlays();
  }

  function onScreenMode(){
    state.screenMode = $.screenTryb.value;
    $.screenSpeedBox.classList.toggle('ukryj', state.screenMode==='solid');
    if(state.screenOn) startScreen();
  }

  function startScreen(){
    stopScreen();
    const setBg = (c)=>{ $.screenOverlay.style.background = c; };
    if(state.screenMode==='solid'){
      setBg(state.screenColors[0]);
      return;
    }
    let step=0;
    let pattern, colors = state.screenColors;
    if(state.screenMode==='sos'){ pattern=SOS; }
    else if(state.screenMode==='strobe'){ pattern=[state.screenSpeed, state.screenSpeed]; }
    else { colors = profile[state.screenMode] || state.screenColors; pattern=[200,200]; }

    const loop = ()=>{
      if(!state.screenOn) return;
      if(state.screenMode==='sos'){
        const on = (step%2===0);
        setBg(on ? colors[0] : '#000000');
      }else{
        state.colorIdx = (state.colorIdx+1) % colors.length;
        setBg(colors[state.colorIdx]);
      }
      const d = pattern[step % pattern.length]; step++;
      setTimeout(loop, d);
    };
    loop();
  }

  function stopScreen(){ $.screenOverlay.style.background='#000000'; }

  function setScreenTimer(){
    clearTimeout(state.screenTimerId);
    if(state.screenTimerMin>0){
      state.screenTimerId = setTimeout(async ()=>{
        if(state.screenOn){ await toggleScreen(); alert('Ekran wyłączony (timer).'); }
      }, state.screenTimerMin*60*1000);
    }
  }

  // Overlays: jeśli oba włączone – dziel na pół (lewa/prawa)
  function updateOverlays(){
    const both = state.torchOn && state.screenOn;
    Object.assign($.torchOverlay.style,  {
      display: state.torchOn ? 'block':'none',
      width: both?'50vw':'100vw',
      left: both?'0':'0'
    });
    Object.assign($.screenOverlay.style, {
      display: state.screenOn ? 'block':'none',
      width: both?'50vw':'100vw',
      left: both?'50vw':'0'
    });
  }

  // Wake Lock + Fullscreen (gdy ekranowa latarka)
  async function keepAwake(on){
    try{
      if(on && 'wakeLock' in navigator){ state.wake = await navigator.wakeLock.request('screen'); }
      if(!on && state.wake){ await state.wake.release(); state.wake=null; }
    }catch(_){}
  }
  async function goFullscreen(on){
    try{
      if(on){
        if(!document.fullscreenElement){ await document.documentElement.requestFullscreen(); }
      }else{
        if(document.fullscreenElement){ await document.exitFullscreen(); }
      }
    }catch(_){}
  }

  // utils
  function clampInt(v,min,max){ v=parseInt(v,10); if(isNaN(v)) v=0; return Math.max(min,Math.min(max,v)); }
  function cleanUp(){ keepAwake(false); stopTorch(); }

  // start
  document.addEventListener('DOMContentLoaded', init);
})();
