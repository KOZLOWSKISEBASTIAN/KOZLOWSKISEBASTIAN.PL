(function(){
  'use strict';

  const LIST       = document.getElementById('KARTY_LISTA');
  const INPUT      = document.getElementById('KARTY_POLE_WYSZUKIWANIA');
  const PODPOWIEDZ = document.getElementById('KARTY_PODPOWIEDZ');

  const BTN_INNE = document.getElementById('KARTY_PRZYCISK_RZADKIE');
  const BTN_SORT = document.getElementById('KARTY_BTN_SORT');
  const MENU     = document.getElementById('KARTY_SORTOWANIE');

  if (!LIST) return;

  /* ====== Funkcje do placeholdera (jak w LICZYDŁO) ====== */
  function justifyToWidth(el, targetW){
    el.style.letterSpacing = '0px';
    const base = el.getBoundingClientRect().width;
    const delta = Math.floor(targetW - base);
    if (delta <= 0) return;
    const txt = (el.textContent || '').trim();
    const gaps = Math.max(txt.length - 1, 0);
    if (gaps <= 0) return;
    const ls = delta / gaps;
    el.style.letterSpacing = ls + 'px';
  }

  function fitHint(){
    if (!PODPOWIEDZ || !INPUT) return;
    const empty = !(INPUT.value || '').trim();
    PODPOWIEDZ.style.opacity = empty ? '.6' : '0';
    if (!empty) return;

    const availW = Math.max(1, INPUT.clientWidth - 28); // padding 14px L/R
    const availH = Math.max(1, INPUT.clientHeight - 6);

    PODPOWIEDZ.style.whiteSpace    = 'nowrap';
    PODPOWIEDZ.style.letterSpacing = '0px';
    PODPOWIEDZ.style.fontSize      = '';

    let lo = 12;
    let hi = Math.max(12, Math.floor(availH));
    let best = lo;

    while (lo <= hi){
      const mid = Math.floor((lo + hi) / 2);
      PODPOWIEDZ.style.fontSize = mid + 'px';
      const r = PODPOWIEDZ.getBoundingClientRect();
      if (r.height <= availH && r.width <= availW){ best = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }
    PODPOWIEDZ.style.fontSize = best + 'px';
    justifyToWidth(PODPOWIEDZ, availW);
  }

  /* ====== KAFELKI ====== */
  const tiles = () => Array.from(LIST.querySelectorAll('li[data-grupa]'));

  // Jeżeli ktoś jeszcze ma numer w klasie, przenieś do data-numer-karty (fallback)
  tiles().forEach(li=>{
    if (!li.dataset.numerKarty){
      const cls = (li.className||'').trim();
      if (/^\d{8,}$/.test(cls)) li.dataset.numerKarty = cls;
    }
  });

  const getName = li => (li.getAttribute('data-name')||'').toLowerCase();
  const getDesc = li => (li.querySelector('.nazwa')?.textContent||'').toLowerCase();
  const getId   = li => (li.dataset.numerKarty || '').toLowerCase();

  /* ====== FILTR / INNE ====== */
  function filtruj(){
    const q = (INPUT?.value || '').trim().toLowerCase();
    const parts = q.split(/\s+/).filter(Boolean);
    const trybInne = (!q && document.body.classList.contains('pokaz-rzadkie'));

    tiles().forEach(li=>{
      const grupa = li.getAttribute('data-grupa'); // "glowne" lub "inne"
      if (trybInne) { li.classList.toggle('ukryta', grupa !== 'inne'); return; }   // INNE
      if (!q)       { li.classList.toggle('ukryta', grupa !== 'glowne'); return; } // domyślnie
      const hay = (getName(li)+' '+getDesc(li)+' '+getId(li)).trim();
      const ok  = parts.every(p => hay.includes(p));
      li.classList.toggle('ukryta', !ok);
    });

    normalizePlaceholders();
  }

  /* ====== SORT ====== */
  function sortuj(metoda){
    const els = tiles();
    els.sort((a,b)=>{
      switch(metoda){
        case 'name-asc':  return getName(a).localeCompare(getName(b));
        case 'name-desc': return getName(b).localeCompare(getName(a));
        case 'desc-asc':  return getDesc(a).localeCompare(getDesc(b));
        case 'desc-desc': return getDesc(b).localeCompare(getDesc(a));
        case 'usage-desc':
        default: {
          // glowne nad inne
          const ga = a.getAttribute('data-grupa') || 'inne';
          const gb = b.getAttribute('data-grupa') || 'inne';
          if (ga !== gb) return (gb === 'glowne') - (ga === 'glowne');
          return 0;
        }
      }
    });
    const frag = document.createDocumentFragment();
    els.forEach(el => frag.appendChild(el));
    LIST.innerHTML = '';
    LIST.appendChild(frag);
    filtruj();
  }

  /* ====== PLACEHOLDERY ====== */
  function normalizePlaceholders(){
    const desktop = window.innerWidth >= 999;
    const cols = desktop ? 4 : 2;

    // usuń stare
    LIST.querySelectorAll('li.placeholder').forEach(p => p.remove());

    // policz widoczne
    const visCount = tiles().filter(li => !li.classList.contains('ukryta')).length;
    if (!visCount) return;

    const mod = visCount % cols;
    if (mod === 0) return;

    const toAdd = cols - mod;
    for (let i=0;i<toAdd;i++){
      const li = document.createElement('li');
      li.className = 'placeholder';
      const a = document.createElement('a');
      a.className = 'PRZYCISK PUSTY';
      a.setAttribute('aria-hidden','true');
      li.appendChild(a);
      LIST.appendChild(li);
    }
  }

  /* ====== MENU SORT ====== */
  BTN_SORT?.addEventListener('click', (e)=>{
    if (!MENU) return;
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    MENU.style.display = 'block';
    MENU.style.top  = (r.bottom + window.scrollY) + 'px';
    MENU.style.left = (r.left   + window.scrollX) + 'px';
  });
  document.addEventListener('click', (e)=>{
    if (!MENU) return;
    if (e.target!==BTN_SORT && !MENU.contains(e.target)) MENU.style.display = 'none';
  });
  MENU?.querySelectorAll('.KARTY_POZYCJA_SORTOWANIE').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      sortuj(btn.getAttribute('data-sort') || 'usage-desc');
      MENU.style.display = 'none';
    });
  });

  /* ====== INNE / SZUKAJ ====== */
  INPUT?.addEventListener('input', ()=>{
    document.body.classList.remove('pokaz-rzadkie'); // szukaj = obie grupy
    filtruj();
    fitHint();
  });
  const BTN_INNE_CLICK = ()=>{
    if ((INPUT?.value || '').trim()) return; // INNE tylko gdy brak zapytania
    document.body.classList.toggle('pokaz-rzadkie');
    filtruj();
  };
  BTN_INNE?.addEventListener('click', BTN_INNE_CLICK);

  /* ====== FULLSCREEN PREVIEW ====== */
  // Numer z data-numer-karty; PNG ze źródła obrazka / a[data-image]
  const FULL = document.createElement('div');
  FULL.className = 'KARTY_FULL';
  FULL.innerHTML = `
    <div class="KARTY_FULL__BAR">
      <a id="KARTY_FULL_LINK" class="KARTY_FULL__LINK" href="#" target="_blank" rel="noopener">ZAPISZ</a>
      <div id="KARTY_FULL_NUM" class="KARTY_FULL__NUMER">—</div>
    </div>
    <img id="KARTY_FULL_IMG" class="KARTY_FULL__IMG" src="" alt="Podgląd karty">
  `;
  document.body.appendChild(FULL);
  const FULL_IMG  = document.getElementById('KARTY_FULL_IMG');
  const FULL_LINK = document.getElementById('KARTY_FULL_LINK');
  const FULL_NUM  = document.getElementById('KARTY_FULL_NUM');

  LIST.addEventListener('click', (e)=>{
    const a=e.target.closest('a'); if(!a) return;
    e.preventDefault();
    if (a.closest('li')?.classList.contains('placeholder')) return;
    const li = a.closest('li');
    const img = a.querySelector('img');
    const png = a.getAttribute('data-image') || img?.getAttribute('data-image') || img?.src || '';
    FULL_IMG.src   = png;
    FULL_LINK.href = png || '#';
    const numer = (li?.dataset.numerKarty || '').trim() || '—';
    FULL_NUM.textContent = numer;
    FULL.classList.add('AKTYWNY');
  });
  FULL.addEventListener('click', (e)=>{
    if (e.target===FULL || e.target===FULL_IMG){
      FULL.classList.remove('AKTYWNY');
      FULL_IMG.src='';
    }
  });

  /* ====== REAKCJE ====== */
  window.addEventListener('resize', ()=>{ normalizePlaceholders(); fitHint(); });
  window.addEventListener('orientationchange', ()=>{ normalizePlaceholders(); fitHint(); });

  /* ====== START ====== */
  sortuj('usage-desc'); // glowne nad inne
  filtruj();            // domyślnie pokaż glowne
  fitHint();            // dopasuj placeholder do pola
})();
