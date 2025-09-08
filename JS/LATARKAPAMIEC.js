/* ===== PAMIĘĆ KOLORÓW (LOCALSTORAGE) ===== */
(function(){
  'use strict';
  const KLUCZ='LATARKA_KOLORY_V1';
  const lista = document.getElementById('KOLORY_LISTA');   // kontener głównego ekranu
  const poleHex = document.getElementById('POLE_HEX');     // pole HEX w overlayu DODAJ
  const btnDodaj = document.getElementById('HEX_ADD');     // przycisk DODAJ (zatwierdzenie)
  if(!lista) return;

  function parseHex(v){
    v = String(v||'').trim();
    if(!v) return null;
    if(v[0] !== '#') v = '#'+v;
    if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v.toUpperCase();
    return null;
  }
  function wczytaj(){ try{ return JSON.parse(localStorage.getItem(KLUCZ))||[] }catch{ return [] } }
  function zapisz(arr){ try{ localStorage.setItem(KLUCZ, JSON.stringify(arr)) }catch{} }

  function render(arr){
    // wyczyść poprzednie dodane przez użytkownika
    [...lista.querySelectorAll('.KOLOR.DODANY')].forEach(n=>n.remove());
    // dorysuj z pamięci
    for(const hex of arr){
      const b=document.createElement('button');
      b.className='KOLOR DODANY';
      b.style.setProperty('--c', hex);
      b.title = hex;
      b.type='button';
      // usuwanie z pamięci: PPM / long-press -> preventDefault i usuń
      b.addEventListener('contextmenu', (e)=>{ e.preventDefault(); usun(hex); });
      // (opcjonalnie) klik wstawia kolor jako aktywny — jeśli masz taką funkcję w appce:
      b.addEventListener('click', ()=>{ try{ window?.ustawKolorHEX?.(hex) }catch{} });
      lista.appendChild(b);
    }
  }

  function dodaj(hex){
    const arr = wczytaj();
    if(!arr.includes(hex)){
      arr.push(hex);
      zapisz(arr);
      render(arr);
    }
  }
  function usun(hex){
    const arr = wczytaj().filter(x=>x!==hex);
    zapisz(arr);
    render(arr);
  }

  // start
  document.addEventListener('DOMContentLoaded', ()=>{ render(wczytaj()); });

  // podpięcie pod przycisk DODAJ
  if(btnDodaj && poleHex){
    btnDodaj.addEventListener('click', ()=>{
      const hex = parseHex(poleHex.value);
      if(hex) dodaj(hex);
    });
  }

  // gdyby gdzieś indziej w kodzie dodajesz kolor programowo:
  window.dodajKolorDoPamieci = dodaj;   // możesz wywołać: dodajKolorDoPamieci('#FF00FF')
})();
