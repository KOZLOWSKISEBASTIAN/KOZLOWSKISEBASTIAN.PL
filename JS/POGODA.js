/* POGODA (IMGW+) – tylko logika tej podstrony.
   Współdzieli kolory/komponenty/HEX z resztą projektu. */
(function () {
  'use strict';

  // Krótka baza stacji z lat/lon do geolokalizacji (rozszerzaj wg potrzeb)
  // id -> {nazwa, lat, lon, wys}
  const STACJE = {
    "12295": { nazwa: "Kostrzyn", lat: 52.398, lon: 17.211, wys: 80 },
    "12330": { nazwa: "Poznań", lat: 52.421, lon: 16.826, wys: 86 },
    "12415": { nazwa: "Wrocław", lat: 51.102, lon: 16.886, wys: 120 },
    "12566": { nazwa: "Kraków", lat: 50.078, lon: 19.785, wys: 206 },
    "12560": { nazwa: "Kielce", lat: 50.878, lon: 20.640, wys: 260 },
    "12600": { nazwa: "Rzeszów", lat: 50.11, lon: 22.05, wys: 200 },
    "12550": { nazwa: "Katowice", lat: 50.259, lon: 19.021, wys: 266 },
    "12105": { nazwa: "Gdańsk", lat: 54.38, lon: 18.62, wys: 3 },
    "12100": { nazwa: "Gdynia", lat: 54.52, lon: 18.53, wys: 30 },
    "12185": { nazwa: "Szczecin", lat: 53.43, lon: 14.55, wys: 1 },
    "12375": { nazwa: "Łódź", lat: 51.75, lon: 19.47, wys: 184 },
    "12435": { nazwa: "Opole", lat: 50.67, lon: 17.93, wys: 176 },
    "12424": { nazwa: "Zielona Góra", lat: 51.94, lon: 15.5, wys: 192 },
    "12250": { nazwa: "Bydgoszcz", lat: 53.13, lon: 18.0, wys: 60 },
    "12235": { nazwa: "Toruń", lat: 53.02, lon: 18.61, wys: 69 },
    "12375b": { nazwa: "Warszawa", lat: 52.23, lon: 21.01, wys: 95 } // pseudo-id; możesz podmienić na realne
  };
  const DOM = {
    select: document.getElementById('POGODA_STACJA'),
    search: document.getElementById('POGODA_SZUKAJ'),
    btnRefresh: document.getElementById('POGODA_ODSWIEZ'),
    btnLocate: document.getElementById('POGODA_LOKALIZUJ'),
    wynikAkt: document.getElementById('AKTUALNA_WYNIK'),
    czas: document.getElementById('POGODA_CZAS'),
    tabs: Array.from(document.querySelectorAll('.TAB')),
    karty: {
      aktualna: document.getElementById('KARTA_aktualna'),
      radar: document.getElementById('KARTA_radar'),
      mapa: document.getElementById('KARTA_mapa'),
      // prognoza: document.getElementById('KARTA_prognoza')
    },
    mapaLink: document.getElementById('MAPA_LINK')
  };

  // Inicjalizacja selecta (alfabetycznie)
  function initSelect() {
    const entries = Object.entries(STACJE)
      .sort((a, b) => a[1].nazwa.localeCompare(b[1].nazwa, 'pl'));
    DOM.select.innerHTML = entries.map(([id, s]) =>
      `<option value="${id}">${s.nazwa}</option>`).join('');
    // Domyśl: Kostrzyn jeśli jest
    if (STACJE["12295"]) DOM.select.value = "12295";
  }

  // Filtrowanie po wpisie
  function onSearch() {
    const q = (DOM.search.value || '').trim().toLowerCase();
    for (const opt of DOM.select.options) {
      const show = opt.text.toLowerCase().includes(q);
      opt.hidden = !show;
    }
    // Jeżeli aktualnie wybrana opcja została ukryta – przeskocz na pierwszą widoczną
    const visible = Array.from(DOM.select.options).find(o => !o.hidden);
    if (visible) DOM.select.value = visible.value;
  }

  // Odległość „płaska” (współrzędne z grubsza – wystarczy do wyboru stacji)
  function dist2(aLat, aLon, bLat, bLon) {
    const dx = aLat - bLat, dy = aLon - bLon;
    return dx*dx + dy*dy;
  }

  function znajdzNajblizsza(lat, lon) {
    let best = null, bestD = Infinity;
    for (const [id, s] of Object.entries(STACJE)) {
      if (typeof s.lat !== 'number' || typeof s.lon !== 'number') continue;
      const d = dist2(s.lat, s.lon, lat, lon);
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }

  // IMGW SYNOP – jedna stacja
  async function pobierzSynop(id) {
    // Uwaga: „12375b” to pseudo – zabezpieczamy się
    if (!/^\d+$/.test(id)) throw new Error('Nieznane ID stacji');
    const url = `https://danepubliczne.imgw.pl/api/data/synop/id/${id}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Błąd IMGW');
    return res.json();
  }

  function n(v) { return (v === null || v === undefined || v === '') ? null : Number(v); }
  function fmt(v, suf = '') { return (v === null || v === undefined || v === '' || Number.isNaN(v)) ? '—' : (suf ? `${v} ${suf}` : String(v)); }

  function opisZIkona(d) {
    const opad = n(d.suma_opadu) || 0;
    const zach = n(d.zachmurzenie) || 0;
    if (opad > 5) return ['Ulewny deszcz','💧💧'];
    if (opad > 0) return ['Deszcz','💧'];
    if (zach > 70) return ['Pochmurno','☁️'];
    if (zach > 30) return ['Częściowe chmury','⛅'];
    return ['Słonecznie','☀️'];
  }

  function rysujAktualna(id, d) {
    const st = STACJE[id] || { nazwa: d.stacja || 'Stacja IMGW' };
    const temp = Math.round(n(d.temperatura));
    const [opis, emoji] = opisZIkona(d);

    const dataPom = `${d.data_pomiaru || ''} ${d.godzina_pomiaru ? `${d.godzina_pomiaru}:00` : ''}`.trim();
    DOM.czas.textContent = dataPom || '—';

    const mapaHref = (st.lat && st.lon)
      ? `https://meteo.imgw.pl/dyn/index.html#loc=${st.lat},${st.lon},10`
      : `https://meteo.imgw.pl/dyn/`;
    if (DOM.mapaLink) DOM.mapaLink.href = mapaHref;

    DOM.wynikAkt.innerHTML = `
      <div class="AKT_HEAD">
        <div>
          <div class="AKT_MIASTO">${st.nazwa}${st.wys ? ` (${st.wys} m n.p.m.)` : ''}</div>
          <div class="AKT_CZAS">${dataPom || '&nbsp;'}</div>
        </div>
        <div class="AKT_TEMPA">
          <div class="AKT_T">${isFinite(temp) ? temp : '—'}</div>
          <div style="font-size:22px">${emoji}</div>
        </div>
      </div>

      <div class="AKT_GRID">
        <div class="AKT_BOX">
          <div class="AKT_W">${fmt(n(d.wilgotnosc_wzgledna),'%')}</div>
          <div class="AKT_E">Wilgotność</div>
        </div>
        <div class="AKT_BOX">
          <div class="AKT_W">${fmt(Math.round((n(d.predkosc_wiatru)||0) * 3.6),'km/h')}</div>
          <div class="AKT_E">Wiatr</div>
        </div>
        <div class="AKT_BOX">
          <div class="AKT_W">${fmt(n(d.suma_opadu),'mm')}</div>
          <div class="AKT_E">Opad (1h)</div>
        </div>
        <div class="AKT_BOX">
          <div class="AKT_W">${fmt(n(d.cisnienie),'hPa')}</div>
          <div class="AKT_E">Ciśnienie</div>
        </div>
        <div class="AKT_BOX">
          <div class="AKT_W">${fmt(n(d.zachmurzenie),'%')}</div>
          <div class="AKT_E">Zachmurzenie</div>
        </div>
        <div class="AKT_BOX">
          <div class="AKT_W">${(d.kierunek_wiatru ?? '—')}</div>
          <div class="AKT_E">Kierunek wiatru</div>
        </div>
      </div>

      <div class="INFO-MALA" style="margin-top:8px;text-align:center;">
        ${opis}. Źródło: IMGW-PIB (SYNOP).
      </div>
    `;
  }

  async function odswiez() {
    const id = DOM.select.value;
    if (!id || !/^\d+$/.test(id)) {
      // jeśli ktoś wybierze pseudo-Warszawę, przeskocz na Poznań (przykład)
      if (id === '12375b' && STACJE["12330"]) DOM.select.value = "12330";
    }
    const użyj = DOM.select.value;

    DOM.wynikAkt.innerHTML = `<div class="INFO-MALA" style="text-align:center;">Ładowanie…</div>`;
    try {
      const data = await pobierzSynop(użyj);
      rysujAktualna(użyj, data);
    } catch (e) {
      DOM.wynikAkt.innerHTML = `
        <div class="INFO-MALA" style="text-align:center;color:#f55;">
          Nie udało się pobrać danych IMGW. Spróbuj ponownie.
        </div>`;
      console.error(e);
    }
  }

  // Zakładki
  function initTabs() {
    DOM.tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.tabs.forEach(b => b.classList.remove('AKTYWNA'));
        btn.classList.add('AKTYWNA');
        const cel = btn.dataset.tab;
        for (const [k, el] of Object.entries(DOM.karty)) {
          el.classList.toggle('AKTYWNA', k === cel);
        }
      });
    });
  }

  // Geolokalizacja → wybór najbliższej stacji z listy STACJE
  function lokalizuj() {
    if (!navigator.geolocation) {
      alert('Twoja przeglądarka nie wspiera geolokalizacji.');
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      const best = znajdzNajblizsza(latitude, longitude);
      if (best) {
        DOM.select.value = best;
        odswiez();
      } else {
        alert('Nie znaleziono najbliższej stacji w lokalnej bazie.');
      }
    }, () => alert('Nie udało się pobrać lokalizacji.'));
  }

  // Zdarzenia
  function bind() {
    DOM.search.addEventListener('input', onSearch);
    DOM.btnRefresh.addEventListener('click', odswiez);
    DOM.btnLocate.addEventListener('click', lokalizuj);
    DOM.select.addEventListener('change', odswiez);
  }

  // Start
  initSelect();
  bind();
  initTabs();
  odswiez();

})();
