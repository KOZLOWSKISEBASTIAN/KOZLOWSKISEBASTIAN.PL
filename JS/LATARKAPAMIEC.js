/* ======================= LATARKA_PAMIEC.js ======================= */
/* Zapisywanie + odtwarzanie dodanych kolorów (localStorage).
   Działa niezależnie od implementacji palety. */

(function(){
  'use strict';

  const STORAGE_KEY = 'LATARKA_KOLORY_V2';

  const $  = (id) => document.getElementById(id);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));

  // Elementy, które wykorzystujemy (z tolerancją braków)
  const LISTA   = $('KOLORY_LISTA') || document.querySelector('[data-kolory-lista]');
  const DODAJ   = $('HEX_ADD')      || document.querySelector('[data-hex-add]');
  const BOXHEX  = $('colorBoxHEX')  || document.querySelector('#POLE_HEX, [data-hex-input]');

  if(!LISTA){
    console.warn('[LATARKA_PAMIEC] Nie znaleziono #KOLORY_LISTA – przerwane.');
    return;
  }

  /* ===== utils ===== */
  const uniq = (arr)=>Array.from(new Set(arr));
  function normalizujHex(v){
    if (!v) return null;
    v = String(v).trim();

    // Obsługa formatu "HEX:#AABBCC"
    if (/^HEX:/i.test(v)) {
      v = v.replace(/^HEX:/i,'').trim();
    }

    if (v[0] !== '#') v = '#'+v;
    v = v.toUpperCase();

    if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/.test(v)) {
      // #ABC -> #AABBCC
      if (v.length === 4) {
        v = '#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];
      }
      return v;
    }
    return null;
  }

  function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] } }
  function save(arr){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(uniq(arr))) } catch {} }

  function addToStorage(hex){
    const h = normalizujHex(hex);
    if (!h) return;
    const cur = load();
    if (!cur.includes(h)) {
      cur.push(h);
      save(cur);
    }
  }

  function removeFromStorage(hex){
    const h = normalizujHex(hex);
    if (!h) return;
    const cur = load().filter(x => x !== h);
    save(cur);
  }

  function createColorButton(hex){
    const btn = document.createElement('button');
    btn.className = 'KOLOR DODANY';
    btn.type = 'button';
    btn.dataset.kolor = hex;
    btn.style.setProperty('--c', hex);
    btn.title = hex;

    // Usuwanie: PPM / długi dotyk -> contextmenu
    btn.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      removeFromStorage(hex);
      btn.remove();
    });

    // Klik: jeśli masz globalną funkcję do ustawiania koloru — spróbuj użyć
    btn.addEventListener('click', ()=>{
      try { window?.ustawKolorHEX?.(hex); } catch {}
      // Opcjonalnie nadaj klasę AKTYWNY w Twoim stylu:
      try {
        $$('.KOLOR', LISTA).forEach(b=>b.classList.remove('AKTYWNY'));
        btn.classList.add('AKTYWNY');
      } catch {}
    });

    return btn;
  }

  function renderFromStorage(){
    // Usuń już wcześniej renderowane przez ten moduł
    $$('.KOLOR.DODANY', LISTA).forEach(n=>n.remove());

    const arr = load();
    for (const hex of arr) {
      const h = normalizujHex(hex);
      if (!h) continue;

      // Nie dubluj jeżeli taki przycisk już istnieje w DOM (np. dodała go Twoja appka)
      const istnieje = LISTA.querySelector(`.KOLOR[data-kolor="${h}"]`);
      if (istnieje) {
        // nadaj flage, żeby ewentualne czyszczenie nie usuwało defaultów
        istnieje.classList.add('DODANY');
        continue;
      }

      LISTA.appendChild(createColorButton(h));
    }
  }

  /* ===== INIT: odtwórz zapisane kolory ===== */
  document.addEventListener('DOMContentLoaded', renderFromStorage);

  /* ===== 1) Zdarzenie z palety (WYBORKOLORU.js) =====
     Oczekujemy e.detail.hex (np. "#AABBCC") */
  function onPicked(evt){
    const hex = evt?.detail?.hex;
    const h = normalizujHex(hex);
    if (!h) return;

    addToStorage(h);

    // do-rysuj na liście jeżeli go nie ma
    if (!LISTA.querySelector(`.KOLOR[data-kolor="${h}"]`)) {
      LISTA.appendChild(createColorButton(h));
    }
  }
  window.addEventListener('wybrano-kolor', onPicked);
  window.addEventListener('color-picked',  onPicked);

  /* ===== 2) Przycisk „DODAJ” + pole HEX ===== */
  if (DODAJ) {
    DODAJ.addEventListener('click', ()=>{
      const val = BOXHEX ? BOXHEX.value : '';
      const h = normalizujHex(val);
      if (!h) return;

      addToStorage(h);

      if (!LISTA.querySelector(`.KOLOR[data-kolor="${h}"]`)) {
        LISTA.appendChild(createColorButton(h));
      }
    });
  }

  /* ===== 3) Fallback: obserwuj DOM, gdyby któryś moduł dodał przycisk koloru bokiem ===== */
  const mo = new MutationObserver((mut)=>{
    let zmiana = false;
    for (const m of mut) {
      m.addedNodes && m.addedNodes.forEach(node=>{
        if (node.nodeType===1 && node.classList?.contains('KOLOR')) {
          const hex = node.dataset?.kolor || getComputedStyle(node).getPropertyValue('--c').trim();
          const h = normalizujHex(hex);
          if (h) { addToStorage(h); node.classList.add('DODANY'); zmiana = true; }
          // powiązanie PPM, jeśli element nie był z naszego factory
          if (!node._pamiecBound) {
            node.addEventListener('contextmenu', (e)=>{
              e.preventDefault();
              const hx = node.dataset?.kolor || getComputedStyle(node).getPropertyValue('--c').trim();
              const hh = normalizujHex(hx);
              if (hh){ removeFromStorage(hh); node.remove(); }
            });
            node._pamiecBound = true;
          }
        }
      });
    }
    if (zmiana) save(load()); // normalizacja setu
  });
  mo.observe(LISTA, { childList:true, subtree:false });

})();
