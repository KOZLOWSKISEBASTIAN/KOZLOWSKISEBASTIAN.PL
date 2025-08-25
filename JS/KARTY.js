(function(){
	'use strict';

	const BASE_SVG = "https://kozlowskisebastian.pl/GRAFIKA/";
	const BASE_PNG = "https://kozlowskisebastian.pl/GRAFIKA/KARTY/";

	const LIST       = document.getElementById('KARTY_LISTA');
	const INPUT      = document.getElementById('KARTY_POLE_WYSZUKIWANIA');
	const PODPOWIEDZ = document.getElementById('KARTY_PODPOWIEDZ');
	const POD_TEKST  = document.getElementById('KARTY_PODPOWIEDZ_TEKST');

	const BTN_INNE   = document.getElementById('KARTY_PRZYCISK_RZADKIE');
	const BTN_SORT   = document.getElementById('KARTY_SORTOWANIE_BTN');
	const MENU       = document.getElementById('KARTY_SORTOWANIE');

	if (!LIST) return;

	function fileNameOf(urlOrName){
		if (!urlOrName) return "";
		try {
			const u = new URL(urlOrName, location.href);
			return decodeURIComponent(u.pathname.split('/').pop() || "");
		} catch {
			return (urlOrName + '').split('/').pop();
		}
	}
	function ensureExt(file, ext){ return /\.[a-z0-9]+$/i.test(file) ? file : (file + ext); }

	function getAttrAny(el, ...names){
		for (const n of names){
			if (!n) continue;
			const v = el.getAttribute(n);
			if (v != null && v !== '') return v;
		}
		return "";
	}

	function migrateStripAddresses(){
		const items = Array.from(LIST.querySelectorAll('li a.PRZYCISK_ODSYLACZ'));
		items.forEach(a=>{
			const li  = a.closest('li');
			const img = a.querySelector('img');
			if (img){
				let svgFile =
					getAttrAny(img, 'DATA-GRAFIKALOGOSVG', 'data-grafikalogosvg') ||
					getAttrAny(img, 'data-ikon') ||
					img.getAttribute('src') ||
					li?.getAttribute('data-name') || "";
				svgFile = ensureExt(fileNameOf(svgFile), '.svg');
				img.removeAttribute('src');
				img.setAttribute('DATA-GRAFIKALOGOSVG', svgFile);
				img.src = BASE_SVG + encodeURIComponent(svgFile);
				if (!img.hasAttribute('alt')) img.setAttribute('alt','');
			}
			let pngFile =
				getAttrAny(a, 'DATA-GRAFIKALOGOPNG', 'data-grafikalogopng') ||
				getAttrAny(a, 'data-obraz', 'data-image') || "";
			pngFile = ensureExt(fileNameOf(pngFile || (li?.getAttribute('data-name') || "")), '.png');
			a.setAttribute('DATA-GRAFIKALOGOPNG', pngFile);
			a.removeAttribute('data-image');
			a.removeAttribute('data-obraz');
			a.setAttribute('data-image', BASE_PNG + encodeURIComponent(pngFile));
		});
	}

	function justifyToWidth(el, targetW){
		el.style.letterSpacing = '0px';
		const base = el.getBoundingClientRect().width;
		const delta = Math.floor(targetW - base);
		if (delta <= 0) return;
		const txt = (el.textContent || '').trim();
		const gaps = Math.max(txt.length - 1, 0);
		if (gaps <= 0) return;
		el.style.letterSpacing = (delta / gaps) + 'px';
	}
	function fitSearchLabel(){
		if (!PODPOWIEDZ || !POD_TEKST || !INPUT) return;
		const hasValue = !!(INPUT.value || '').trim();
		PODPOWIEDZ.style.opacity = hasValue ? '0' : '.66';
		PODPOWIEDZ.style.display = hasValue ? 'none' : 'flex';
		if (hasValue) return;
		const availW = Math.max(1, INPUT.clientWidth);
		const availH = Math.max(1, INPUT.clientHeight - 2);
		POD_TEKST.style.transform = 'none';
		POD_TEKST.style.whiteSpace = 'nowrap';
		POD_TEKST.style.letterSpacing = '0px';
		POD_TEKST.style.fontSize = '16px';
		let lo = 8, hi = Math.max(12, availH), best = lo;
		while (lo <= hi){
			const mid = Math.floor((lo + hi) / 2);
			POD_TEKST.style.fontSize = mid + 'px';
			const r = POD_TEKST.getBoundingClientRect();
			if (r.height <= availH && r.width <= availW){ best = mid; lo = mid + 1; }
			else { hi = mid - 1; }
		}
		POD_TEKST.style.fontSize = best + 'px';
		justifyToWidth(POD_TEKST, availW);
	}

	const tiles = () => Array.from(LIST.querySelectorAll('li[data-grupa]'));
	const getName = li => (li.getAttribute('data-name')||'').toLowerCase();
	const getDesc = li => (li.querySelector('.KARTY_NAZWA')?.textContent||'').toLowerCase();
	const getId   = li => (li.dataset.numerKarty || '').toLowerCase();

	function filtruj(){
		const q = (INPUT?.value || '').trim().toLowerCase();
		const parts = q.split(/\s+/).filter(Boolean);
		const trybInne = (!q && document.body.classList.contains('pokaz-rzadkie'));
		tiles().forEach(li=>{
			const grupa = li.getAttribute('data-grupa');
			if (trybInne) { li.classList.toggle('ukryta', grupa !== 'KARTY_INNE'); return; }
			if (!q)       { li.classList.toggle('ukryta', grupa !== 'KARTY_PODSTAWOWE'); return; }
			const hay = (getName(li)+' '+getDesc(li)+' '+getId(li)).trim();
			const ok  = parts.every(p => hay.includes(p));
			li.classList.toggle('ukryta', !ok);
		});
		normalizePlaceholders();
	}

	function sortuj(token){
		const els = tiles();
		els.sort((a,b)=>{
			switch(token){
				case 'nazwa-az':  return getName(a).localeCompare(getName(b),'pl');
				case 'nazwa-za':  return getName(b).localeCompare(getName(a),'pl');
				case 'opis-az':   return getDesc(a).localeCompare(getDesc(b),'pl');
				case 'opis-za':   return getDesc(b).localeCompare(getDesc(a),'pl');
				case 'uzycie-domyslne':
				default: {
					const ga = a.getAttribute('data-grupa') || 'KARTY_INNE';
					const gb = b.getAttribute('data-grupa') || 'KARTY_INNE';
					if (ga !== gb) return (gb === 'KARTY_PODSTAWOWE') - (ga === 'KARTY_PODSTAWOWE');
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

	function normalizePlaceholders(){
		const desktop = window.innerWidth >= 999;
		const cols = desktop ? 4 : 2;
		LIST.querySelectorAll('li.placeholder').forEach(p => p.remove());
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
			sortuj(btn.getAttribute('data-sort') || 'uzycie-domyslne');
			MENU.style.display = 'none';
		});
	});

	INPUT?.addEventListener('input', ()=>{
		document.body.classList.remove('pokaz-rzadkie');
		filtruj();
		fitSearchLabel();
	});
	INPUT?.addEventListener('focus', fitSearchLabel);
	INPUT?.addEventListener('blur',  fitSearchLabel);

	BTN_INNE?.addEventListener('click', ()=>{
		if ((INPUT?.value || '').trim()) return;
		document.body.classList.toggle('pokaz-rzadkie');
		filtruj();
	});

	const FULL = document.createElement('div');
	FULL.className = 'KARTY_FULL';
	FULL.innerHTML = `
		<div class="KARTY_FULL_BAR">
			<a id="KARTY_FULL_LINK" class="KARTY_FULL_LINK" href="#" target="_blank" rel="noopener">ZAPISZ</a>
			<div id="KARTY_FULL_NUM" class="KARTY_FULL_NUMER">—</div>
		</div>
		<img id="KARTY_FULL_IMG" class="KARTY_FULL_IMG" src="" alt="Podgląd karty">
	`;
	document.body.appendChild(FULL);
	const FULL_IMG  = document.getElementById('KARTY_FULL_IMG');
	const FULL_LINK = document.getElementById('KARTY_FULL_LINK');
	const FULL_NUM  = document.getElementById('KARTY_FULL_NUM');

	LIST.addEventListener('click', (e)=>{
		const a=e.target.closest('a'); if(!a) return;
		e.preventDefault();
		if (a.closest('li')?.classList.contains('placeholder')) return;
		const li  = a.closest('li');
		const png = a.getAttribute('data-image') || '';
		FULL_IMG.src   = png || '';
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

	function isMobileLike(){
		return window.innerWidth < 1000 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	}
	function getPngUrlsToPrecache(){
		const items = Array.from(LIST.querySelectorAll('li[data-grupa="KARTY_PODSTAWOWE"] a.PRZYCISK_ODSYLACZ'));
		return items.map(a => a.getAttribute('data-image')).filter(Boolean);
	}
	async function registerSWandPrecache(){
		if (!('serviceWorker' in navigator)) return;
		if (!isMobileLike()) return;
		try {
			const reg = await navigator.serviceWorker.register('JS/SW_KARTY.js', { scope: './' });
			const ready = await navigator.serviceWorker.ready;
			const urls = getPngUrlsToPrecache();
			ready.active?.postMessage({ type: 'PRECACHE_PNGS', urls });
		} catch (e) {}
	}

	migrateStripAddresses();
	sortuj('uzycie-domyslne');
	filtruj();
	fitSearchLabel();
	registerSWandPrecache();

	const ro = ('ResizeObserver' in window) ? new ResizeObserver(()=>fitSearchLabel()) : null;
	ro?.observe(INPUT); ro?.observe(PODPOWIEDZ);
	window.addEventListener('resize', ()=>{ normalizePlaceholders(); fitSearchLabel(); });
	window.addEventListener('orientationchange', ()=>{ normalizePlaceholders(); fitSearchLabel(); });
	const mo = new MutationObserver(()=>fitSearchLabel());
	mo.observe(document.documentElement, { attributes:true, attributeFilter:['WYBOR_MOTYW','class'] });
})();
