(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];

  const DOMYSLNY_STALY_CIEMNY  = '#FFFFFF';
  const DOMYSLNY_STALY_JASNY   = '#000000';
  const DOMYSLNE_SOS           = ['#FFFFFF', '#000000'];
  const SEKWENCJA_SOS          = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1200];

  const PANEL_KORZEN = $('PANEL_KORZEN');
  const PRZYCISK_PANEL_PRZELACZ = $('PRZYCISK_PANEL_PRZELACZ');
  const ZAKLADKA_LATARKA = $('ZAKLADKA_LATARKA');
  const ZAKLADKA_EKRAN   = $('ZAKLADKA_EKRAN');

  const LATARKA_STALY      = $('LATARKA_STALY');
  const LATARKA_SOS        = $('LATARKA_SOS');
  const LATARKA_STROBOSKOP = $('LATARKA_STROBOSKOP');
  const LATARKA_SZYBKOSC   = $('LATARKA_SZYBKOSC');
  const LATARKA_WIDEO      = $('LATARKA_WIDEO');
  const LATARKA_INFO       = $('LATARKA_INFO');

  const EKRAN_STALY      = $('EKRAN_STALY');
  const EKRAN_SOS        = $('EKRAN_SOS');
  const EKRAN_STROBOSKOP = $('EKRAN_STROBOSKOP');
  const EKRAN_SZYBKOSC   = $('EKRAN_SZYBKOSC');

  const LISTA_KOLOROW     = $('LISTA_KOLOROW');
  const DODAJ_HEX         = $('DODAJ_HEX');
  const MIESZANY_PRZYCISK = $('MIESZANY_PRZYCISK');

  const OVERLAY_DODAJ = $('OVERLAY_DODAJ');
  const OVERLAY_TLO   = $('OVERLAY_TLO');
  const OVERLAY_PANEL = $('OVERLAY_PANEL');
  const POLE_HEX      = $('POLE_HEX');
  const POLE_RGB      = $('POLE_RGB');

  const SEKCJA_LATARKA = $('SEKCJA_LATARKA');
  const SEKCJA_EKRAN   = $('SEKCJA_EKRAN');

  const NAKLADKA_EKRANU = $('NAKLADKA_EKRANU');

  const WIERSZ_LATARKA = $('WIERSZ_LATARKA');
  const WIERSZ_EKRAN   = $('WIERSZ_EKRAN');

  const poprzedniaWartosc = new WeakMap();
  let kolejnoscKlik = 0;
  const STAN = {
    trybLatarki:null,
    trybEkranu:null,
    miks:false,
    indeksHue:0,
    overlayAktywny:false,
    pominPierwszeOdznaczenie:false,
    strumien:null,
    torWideo:null,
    wspieraTorch:false,
    interwalTorch:null,
    timeoutTorch:null
  };

  document.addEventListener('DOMContentLoaded', ()=>{
    if (PRZYCISK_PANEL_PRZELACZ){
      PRZYCISK_PANEL_PRZELACZ.textContent = PANEL_KORZEN.classList.contains('ZWINIETY') ? 'POKAŻ' : 'UKRYJ';
      PRZYCISK_PANEL_PRZELACZ.addEventListener('click', (e)=>{
        e.preventDefault();
        const zwin = !PANEL_KORZEN.classList.contains('ZWINIETY');
        PANEL_KORZEN.classList.toggle('ZWINIETY', zwin);
        PRZYCISK_PANEL_PRZELACZ.textContent = zwin ? 'POKAŻ' : 'UKRYJ';
      }, { passive:true });
    }

    ZAKLADKA_LATARKA?.addEventListener('click', ()=>aktywujZakladke('latarka'));
    ZAKLADKA_EKRAN  ?.addEventListener('click', ()=>aktywujZakladke('ekran'));
    aktywujZakladke('ekran');

    initSuwak(LATARKA_SZYBKOSC);
    initSuwak(EKRAN_SZYBKOSC);

    LATARKA_STALY     ?.addEventListener('click', ()=>przelaczLatarke('staly', LATARKA_STALY));
    LATARKA_SOS       ?.addEventListener('click', ()=>przelaczLatarke('sos', LATARKA_SOS));
    LATARKA_STROBOSKOP?.addEventListener('click', ()=>przelaczLatarke('stroboskop', LATARKA_STROBOSKOP));

    EKRAN_STALY     ?.addEventListener('click', ()=>przelaczEkran('staly', EKRAN_STALY));
    EKRAN_SOS       ?.addEventListener('click', ()=>przelaczEkran('sos', EKRAN_SOS));
    EKRAN_STROBOSKOP?.addEventListener('click', ()=>przelaczEkran('stroboskop', EKRAN_STROBOSKOP));

    LISTA_KOLOROW?.addEventListener('click',(e)=>{
      const btn = e.target.closest('.KOLOR'); if(!btn) return;
      obrocHex(btn);

      if(btn===MIESZANY_PRZYCISK){
        STAN.miks = !STAN.miks;
        btn.classList.toggle('AKTYWNY', STAN.miks);
        STAN.indeksHue = 0;
        podglad(true);
        return;
      }

      if (!STAN.trybEkranu){
        przelaczEkran('staly', EKRAN_STALY, true);
        STAN.pominPierwszeOdznaczenie = true;
      }

      if (STAN.trybEkranu === 'staly'){
        if (btn.classList.contains('AKTYWNY')){
          if (STAN.pominPierwszeOdznaczenie){
            odznaczWszystkie();
            zaznacz(btn);
            STAN.pominPierwszeOdznaczenie = false;
          } else {
            odznacz(btn);
            if (pobierzAktywnePrzyciski().length === 0){
              EKRAN_STALY?.classList.remove('TRYB_AKTYWNY');
              resetTrybuEkran();
              return;
            }
          }
        } else {
          odznaczWszystkie(); zaznacz(btn);
          STAN.pominPierwszeOdznaczenie = false;
        }
      } else if (STAN.trybEkranu === 'sos'){
        if (btn.classList.contains('AKTYWNY')) {
          odznacz(btn);
          if (pobierzAktywnePrzyciski().length === 0){
            EKRAN_SOS?.classList.remove('TRYB_AKTYWNY');
            resetTrybuEkran();
            return;
          }
        } else {
          zaznacz(btn);
          const aktywne = pobierzAktywnePrzyciski();
          if (aktywne.length > 2){ const naj = najstarszy(aktywne); odznacz(naj); }
        }
      } else if (STAN.trybEkranu === 'stroboskop'){
        if (btn.classList.contains('AKTYWNY')){
          odznacz(btn);
          if (pobierzAktywnePrzyciski().length === 0){
            EKRAN_STROBOSKOP?.classList.remove('TRYB_AKTYWNY');
            resetTrybuEkran();
            return;
          }
        } else { zaznacz(btn); }
      }

      podglad(true);
    });

    DODAJ_HEX?.addEventListener('click', ()=>{
      STAN.overlayAktywny = true;
      ustawPola(domyslnyKolorPoMotywie());
      otworzOverlay();
    });

    OVERLAY_DODAJ?.addEventListener('click', (ev)=>{
      const target = ev.target;
      const klikWHex = target.closest('.szesciokat') || target.closest('.szesciokat_wybor');
      const klikWPole = target.closest('input,textarea,select,button');
      if (!klikWHex && !klikWPole){ zamknijOverlay(); }
    });
    OVERLAY_PANEL?.addEventListener('click', (ev)=>{
      const klikWHex = ev.target.closest('.szesciokat') || ev.target.closest('.szesciokat_wybor');
      const klikWPole = ev.target.closest('input,textarea,select,button');
      if (klikWHex || klikWPole){ ev.stopPropagation(); }
    });
    OVERLAY_TLO?.addEventListener('click', (ev)=>{ if (ev.target === OVERLAY_TLO) zamknijOverlay(); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !OVERLAY_DODAJ.classList.contains('UKRYTY')) zamknijOverlay(); });

    window.addEventListener('wybrano-kolor', e=>wybranoKolor(e.detail?.hex));
    window.addEventListener('color-picked',  e=>wybranoKolor(e.detail?.hex));

    document.addEventListener('visibilitychange', ()=>{ if (document.hidden) wylaczLatarke(true); });
    window.addEventListener('pagehide', ()=>wylaczLatarke(true));
    window.addEventListener('beforeunload', ()=>wylaczLatarke(true));
  });

  function aktywujZakladke(ktora){
    if(ktora==='latarka'){
      SEKCJA_LATARKA.classList.remove('UKRYTY');
      SEKCJA_EKRAN.classList.add('UKRYTY');
      pokazInfoLatarkiJesliTrzeba();
    }else{
      SEKCJA_EKRAN.classList.remove('UKRYTY');
      SEKCJA_LATARKA.classList.add('UKRYTY');
      // NIE wyłączamy latarki – ma działać równolegle z ekranem
    }
    pokazWierszeSuwakow();
  }

  function initSuwak(input){
    if(!input) return;
    poprzedniaWartosc.set(input, Number(input.value)||0);
    input.addEventListener('input', ()=>{
      const last = poprzedniaWartosc.get(input) ?? 0;
      const now  = Number(input.value)||0;
      const dir  = (now>=last ? '30deg' : '-30deg');
      input.style.setProperty('--spin', dir);
      requestAnimationFrame(()=>{ setTimeout(()=> input.style.setProperty('--spin','0deg'), 60); });
      poprzedniaWartosc.set(input, now);

      if(input===EKRAN_SZYBKOSC && STAN.trybEkranu==='stroboskop') startStroboskop(EKRAN_SZYBKOSC);
      if(input===LATARKA_SZYBKOSC && STAN.trybLatarki==='stroboskop' && STAN.wspieraTorch) startLatarkaStroboskop();
    });
  }
  function pokazWierszeSuwakow(){
    pokazWiersz(WIERSZ_LATARKA, STAN.trybLatarki==='stroboskop');
    pokazWiersz(WIERSZ_EKRAN,   STAN.trybEkranu==='stroboskop');
  }
  function pokazWiersz(wiersz, pokaz){ if(wiersz) wiersz.classList.toggle('UKRYTY', !pokaz); }

  function otworzOverlay(){
    OVERLAY_DODAJ.classList.remove('UKRYTY');
    OVERLAY_DODAJ.setAttribute('aria-hidden','false');
    document.body.classList.add('OVERLAY_OTWARTY');
  }
  function zamknijOverlay(){
    OVERLAY_DODAJ.classList.add('UKRYTY');
    OVERLAY_DODAJ.setAttribute('aria-hidden','true');
    document.body.classList.remove('OVERLAY_OTWARTY');
    STAN.overlayAktywny=false;
  }

  function motyw(){ return (document.documentElement.getAttribute('WYBOR_MOTYW')||'JASNY').toUpperCase(); }
  function domyslneTlo(){ return motyw()==='CIEMNY' ? '#000000' : '#FFFFFF'; }
  function domyslnyKolorPoMotywie(){ return motyw()==='CIEMNY' ? DOMYSLNY_STALY_CIEMNY : DOMYSLNY_STALY_JASNY; }

  function pobierzAktywnePrzyciski(){ return $$('.KOLOR.AKTYWNY[data-kolor]', LISTA_KOLOROW); }
  function pobierzAktywneKolory(){
    return pobierzAktywnePrzyciski()
      .sort((a,b)=>Number(a.dataset.kolejnosc)-Number(b.dataset.kolejnosc))
      .map(b => (b.dataset.kolor||'').toUpperCase())
      .filter(Boolean);
  }
  function zaznacz(btn){ btn.classList.add('AKTYWNY'); btn.dataset.kolejnosc = (++kolejnoscKlik).toString(); }
  function odznacz(btn){ btn.classList.remove('AKTYWNY'); btn.removeAttribute('data-kolejnosc'); }
  function odznaczWszystkie(){ pobierzAktywnePrzyciski().forEach(odznacz); }
  function najstarszy(lista){ return lista.sort((a,b)=>Number(a.dataset.kolejnosc)-Number(b.dataset.kolejnosc))[0]; }
  function znajdzLubUtworz(hex){
    let btn = LISTA_KOLOROW.querySelector(`.KOLOR[data-kolor="${hex}"]`);
    if (!btn){
      btn = document.createElement('button');
      btn.className = 'KOLOR';
      btn.dataset.kolor = hex;
      btn.style.setProperty('--c', hex);
      btn.title = hex;
      LISTA_KOLOROW.appendChild(btn);
    }
    return btn;
  }
  function obrocHex(el){ el.classList.remove('OBROT'); void el.offsetWidth; el.classList.add('OBROT'); }

  function kolorStaly(){
    const aktywne = pobierzAktywneKolory();
    return aktywne[aktywne.length-1] || domyslnyKolorPoMotywie();
  }
  function koloryStroboskop(){
    const aktywne = pobierzAktywneKolory();
    return (aktywne.length ? aktywne : [domyslnyKolorPoMotywie()]).slice();
  }
  function kolorySOS(){
    const aktywne = pobierzAktywneKolory();
    if (STAN.miks) return paraHueNastepna();
    if (aktywne.length >= 2) return aktywne.slice(-2);
    if (aktywne.length === 1) return [aktywne[0], '#000000'];
    return DOMYSLNE_SOS.slice();
  }

  function hue(i){ const h=((i%360)+360)%360; return `hsl(${h} 100% 50%)`; }
  function nastepnyHue(){ const c=hue(STAN.indeksHue); STAN.indeksHue = (STAN.indeksHue+15)%360; return c; }
  function paraHueNastepna(){ const a=hue(STAN.indeksHue), b=hue((STAN.indeksHue+180)%360); STAN.indeksHue=(STAN.indeksHue+15)%360; return [a,b]; }

  function przelaczEkran(tryb, btn, bezDomyslnego){
    if (STAN.trybEkranu === tryb){
      resetTrybuEkran();
      btn?.classList.remove('TRYB_AKTYWNY');
      return;
    }
    [EKRAN_STALY,EKRAN_SOS,EKRAN_STROBOSKOP].forEach(b=>b?.classList.remove('TRYB_AKTYWNY'));
    btn?.classList.add('TRYB_AKTYWNY');

    resetTrybuEkran();
    STAN.trybEkranu = tryb;
    STAN.indeksHue = 0;
    pokazWierszeSuwakow();

    if (tryb === 'staly'){
      if (!bezDomyslnego){
        odznaczWszystkie();
        const def = domyslnyKolorPoMotywie();
        const btnDef = znajdzLubUtworz(def);
        zaznacz(btnDef);
        ustawKolorEkranu(def);
      }
    }
    else if (tryb === 'sos'){
      odznaczWszystkie();
      zaznacz(znajdzLubUtworz('#FFFFFF'));
      zaznacz(znajdzLubUtworz('#000000'));
      startSOS();
    }
    else if (tryb === 'stroboskop'){
      if (pobierzAktywnePrzyciski().length === 0){
        zaznacz(znajdzLubUtworz(domyslnyKolorPoMotywie()));
      }
      startStroboskop(EKRAN_SZYBKOSC);
    }
  }

  function resetTrybuEkran(){
    zatrzymajTimeryEkran();
    STAN.miks = false;
    STAN.pominPierwszeOdznaczenie = false;
    MIESZANY_PRZYCISK?.classList.remove('AKTYWNY');
    odznaczWszystkie();
    NAKLADKA_EKRANU.style.background = domyslneTlo();
    NAKLADKA_EKRANU.classList.add('UKRYTY');
    STAN.trybEkranu = null;
    pokazWierszeSuwakow();
  }

  function zatrzymajTimeryEkran(){
    clearInterval(window.__ekranIntervalId); window.__ekranIntervalId = null;
    clearTimeout(window.__ekranSOSId);       window.__ekranSOSId = null;
  }
  function zatrzymajTimeryLatarka(){
    if (STAN.interwalTorch){ clearInterval(STAN.interwalTorch); STAN.interwalTorch = null; }
    if (STAN.timeoutTorch){  clearTimeout(STAN.timeoutTorch);   STAN.timeoutTorch  = null; }
  }

  function ustawKolorEkranu(hex){
    NAKLADKA_EKRANU?.classList.remove('UKRYTY');
    NAKLADKA_EKRANU.style.background = hex;
  }

  function startStroboskop(input){
    zatrzymajTimeryEkran();
    const baza = Number(input?.value)||200;
    let i=0, on=false;
    const kolorWyl = (motyw()==='CIEMNY' ? '#000000' : '#FFFFFF');
    const kolory = ()=> (STAN.miks ? [nastepnyHue()] : koloryStroboskop());
    window.__ekranIntervalId = setInterval(()=>{
      on = !on;
      if (on){
        const arr = kolory();
        const c = arr[i % arr.length];
        i++;
        ustawKolorEkranu(c);
      } else {
        ustawKolorEkranu(kolorWyl);
      }
    }, baza);
    STAN.trybEkranu = 'stroboskop';
  }

  function startSOS(){
    zatrzymajTimeryEkran();
    let i=0;
    const tick = ()=>{
      const [c1,c2] = STAN.miks ? paraHueNastepna() : kolorySOS();
      const on = (i%2===0);
      ustawKolorEkranu(on ? c1 : c2);
      const wait = SEKWENCJA_SOS[i++ % SEKWENCJA_SOS.length];
      window.__ekranSOSId = setTimeout(tick, wait);
    };
    tick();
    STAN.trybEkranu = 'sos';
  }

  function podglad(force){
    if (!STAN.trybEkranu && !force) return;
    if (STAN.trybEkranu === 'staly'){
      ustawKolorEkranu(kolorStaly());
    } else if (STAN.trybEkranu === 'stroboskop'){
      startStroboskop(EKRAN_SZYBKOSC);
    }
  }

  function pokazInfoLatarki(msg){
    if (!LATARKA_INFO) return;
    LATARKA_INFO.textContent = msg || '';
    LATARKA_INFO.classList.toggle('UKRYTY', !msg);
  }
  function pokazInfoLatarkiJesliTrzeba(){
    if (!window.isSecureContext){
      pokazInfoLatarki('Latarka wymaga HTTPS.');
    } else if (czyIOS()){
      pokazInfoLatarki('iOS nie udostepnia diody LED w przegladarce. Uzyj zakladki EKRAN.');
    } else if (!navigator.mediaDevices?.getUserMedia){
      pokazInfoLatarki('Brak wsparcia getUserMedia. Uzyj zakladki EKRAN.');
    } else if (STAN.wspieraTorch === false){
      pokazInfoLatarki('Urzadzenie nie wspiera trybu torch. Uzyj zakladki EKRAN.');
    } else {
      pokazInfoLatarki('Wybierz tryb. Przy pierwszym uzyciu bedzie prosba o aparat.');
    }
  }

  function czyIOS(){
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async function zapewnijStrumienTorch(){
    if (!window.isSecureContext) throw new Error('HTTPS_REQUIRED');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('NO_GUM');
    if (STAN.torWideo && STAN.strumien) return;

    const constraints = { video:{ facingMode:{ ideal:'environment' }, width:{ ideal:1280 }, height:{ ideal:720 }}, audio:false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const track = stream.getVideoTracks()[0];
    if (!track) { throw new Error('NO_VIDEO_TRACK'); }

    const caps = track.getCapabilities?.() || {};
    STAN.wspieraTorch = !!caps.torch;

    LATARKA_WIDEO.srcObject = stream;
    await LATARKA_WIDEO.play().catch(()=>{});

    STAN.strumien = stream;
    STAN.torWideo = track;
  }

  async function wlaczLatarke(){
    if (!STAN.torWideo) await zapewnijStrumienTorch();
    if (!STAN.torWideo) return;

    const caps = STAN.torWideo.getCapabilities?.() || {};
    STAN.wspieraTorch = !!caps.torch;

    if (STAN.wspieraTorch){
      await STAN.torWideo.applyConstraints({ advanced: [{ torch: true }] }).catch(()=>{});
    } else {
      ustawKolorEkranu('#FFFFFF');
    }
  }

  async function wylaczLatarke(wylaczNakladke){
    zatrzymajTimeryLatarka();
    try{
      if (STAN.torWideo){
        const caps = STAN.torWideo.getCapabilities?.() || {};
        if (caps.torch){
          await STAN.torWideo.applyConstraints({ advanced: [{ torch: false }] }).catch(()=>{});
        }
      }
    }catch(_){}
    if (wylaczNakladke){ NAKLADKA_EKRANU.classList.add('UKRYTY'); }
  }

  function startLatarkaStroboskop(){
    zatrzymajTimeryLatarka();
    const delay = Number(LATARKA_SZYBKOSC?.value)||200;
    let on=false;
    STAN.interwalTorch = setInterval(async ()=>{
      on = !on;
      try{
        if (STAN.torWideo?.getCapabilities?.().torch){
          await STAN.torWideo.applyConstraints({ advanced: [{ torch: on }] });
        } else {
          ustawKolorEkranu(on ? '#FFFFFF' : '#000000');
        }
      }catch(_){}
    }, delay);
  }

  function startLatarkaSOS(){
    zatrzymajTimeryLatarka();
    let i=0;
    const tick = async ()=>{
      const on = (i%2===0);
      try{
        if (STAN.torWideo?.getCapabilities?.().torch){
          await STAN.torWideo.applyConstraints({ advanced: [{ torch: on }] });
        } else {
          ustawKolorEkranu(on ? '#FFFFFF' : '#000000');
        }
      }catch(_){}
      const wait = SEKWENCJA_SOS[i++ % SEKWENCJA_SOS.length];
      STAN.timeoutTorch = setTimeout(tick, wait);
    };
    tick();
  }

  async function przelaczLatarke(tryb, btn){
    if (STAN.trybLatarki === tryb){
      STAN.trybLatarki=null; btn?.classList.remove('TRYB_AKTYWNY');
      await wylaczLatarke(false); // nie chowamy nakladki ekranu – ekran moze byc wlaczony niezaleznie
      pokazWierszeSuwakow();
      return;
    }
    [LATARKA_STALY,LATARKA_SOS,LATARKA_STROBOSKOP].forEach(b=>b?.classList.remove('TRYB_AKTYWNY'));
    btn?.classList.add('TRYB_AKTYWNY');

    try{
      await zapewnijStrumienTorch();
    }catch(err){
      if (String(err?.message)==='HTTPS_REQUIRED'){
        pokazInfoLatarki('Latarka wymaga HTTPS. Uzyj zakladki EKRAN.');
      } else {
        pokazInfoLatarki('Brak wsparcia latarki. Uzyj zakladki EKRAN.');
      }
      // fallback – nie przelaczamy zakladek, ekran moze byc juz wlaczony
      ustawKolorEkranu('#FFFFFF');
      return;
    }

    STAN.trybLatarki = tryb;
    pokazWierszeSuwakow();
    pokazInfoLatarki(STAN.wspieraTorch
      ? 'Latarka dziala. Aby wylaczyc, stuknij aktywny tryb.'
      : 'Brak wsparcia diody LED – uzywamy rozswietlenia ekranu.');

    if (tryb === 'staly'){
      await wlaczLatarke();
      if (!STAN.wspieraTorch) ustawKolorEkranu('#FFFFFF');
    } else if (tryb === 'sos'){
      startLatarkaSOS();
    } else if (tryb === 'stroboskop'){
      startLatarkaStroboskop();
    }
  }

  function wybranoKolor(hex){
    if (!hex) return;
    const norm = normalizujHex(hex);
    ustawPola(norm);
    const btn = znajdzLubUtworz(norm);
    btn.classList.add('OBROT');
    setTimeout(()=>btn.classList.remove('OBROT'), 380);
    zamknijOverlay();
  }

  function ustawPola(hex){
    const {r,g,b} = hexNaRgb(hex);
    if (POLE_HEX) POLE_HEX.value = `HEX:${hex.toUpperCase()}`;
    if (POLE_RGB) POLE_RGB.value = `RGB:${r},${g},${b}`;
  }
  function normalizujHex(text){
    let t = String(text||'').trim().toUpperCase();
    if (!t.startsWith('#')) t = '#'+t;
    return t;
  }
  function hexNaRgb(hex){
    hex = hex.replace('#','');
    const n = parseInt(hex,16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }

})();
