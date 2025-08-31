(function(){
	const BAZA = new URL('https://kozlowskisebastian.pl', document.baseURI);

	const SCIEZKI = new Map([
		["KARTY", "KARTY"],
		["NOTATNIK", "NOTATNIK"],
		["KALKULATOR", "KALKULATOR"],
		["LICZYDŁO", "LICZYDLO"],
		["LATARKA", "LATARKA"],
		["POGODA", "POGODA"],
		["GENERATOR", "GENERATOR"],
		["PRZYBORNIK", "PRZYBORNIK"],
		["ODSYŁACZ", "ODSYLACZ"],
		["ADRES_KSG", "https://ksgroup.pl/"],
		["ADRES_KSPL", "https://kozlowskisebastian.pl/"],
	]);

	document.querySelectorAll('[data-klucz]').forEach(EL => {
		const KLUCZ = EL.getAttribute('data-klucz');
		const SCIEZKA = SCIEZKI.get(KLUCZ);
		if (SCIEZKA) {
			if (/^https?:\/\//i.test(SCIEZKA)) {
				EL.href = SCIEZKA;
				EL.target = '_blank';
				EL.rel = 'noopener noreferrer';
			} else {
				EL.href = new URL(SCIEZKA + '/', BAZA).href;
			}
		} else {
			EL.setAttribute('tabindex', '-1');
			EL.addEventListener('click', E => E.preventDefault());
		}
	});
})();

(function(){
	const BTN_SEL = [
		'a.PRZYCISK',
		'button.PRZYCISK',
		'.PRZYCISK_PRZYBORNIK_POWROT',
		'.PRZYCISK_KLAWISZ',
		'.PRZYCISK--KLAWISZ',
		'.PRZYBORNIK_PRZYCISK_POLOWA .PRZYCISK'
	].join(',');

	const MIN_PX   = 11;
	const SAFE_PAD = 2;
	const ASCENDER_COMP = 1.045;

	function ensureLabel(btn){
		let label = btn.querySelector('.LABEL_AUTOSIZE');
		if (label) return label;

		const rawText = Array.from(btn.childNodes)
			.filter(n => n.nodeType === Node.TEXT_NODE)
			.map(n => n.nodeValue)
			.join(' ')
			.replace(/\s+/g,' ')
			.trim();

		if (!rawText) return null;

		btn.textContent = '';
		label = document.createElement('span');
		label.className = 'LABEL_AUTOSIZE';
		label.textContent = rawText;
		btn.appendChild(label);
		return label;
	}

	function getVarPx(str, fallbackPx){
		if (!str) return fallbackPx;
		const tmp = document.createElement('div');
		tmp.style.position = 'absolute';
		tmp.style.visibility = 'hidden';
		tmp.style.fontSize = str;
		document.body.appendChild(tmp);
		const v = parseFloat(getComputedStyle(tmp).fontSize) || fallbackPx;
		tmp.remove();
		return v;
	}

	function getMaxFont(btn){
		const cs = getComputedStyle(btn);
		const maxVar = cs.getPropertyValue('--fs-max').trim();
		const byVar  = getVarPx(maxVar, 0);
		const byH    = Math.max(0, (btn.clientHeight - SAFE_PAD));
		const hard   = 320;
		return Math.max(12, Math.min(byVar || Infinity, byH || Infinity, hard));
	}

	function measure(label, px){
		const clone = label.cloneNode(true);
		clone.style.visibility = 'hidden';
		clone.style.position = 'absolute';
		clone.style.whiteSpace = 'nowrap';
		clone.style.width = 'auto';
		clone.style.fontSize = px + 'px';
		clone.style.lineHeight = '1';
		clone.style.wordSpacing = 'normal';
		clone.style.letterSpacing = 'normal';
		document.body.appendChild(clone);
		const rect = clone.getBoundingClientRect();
		clone.remove();
		return { w: Math.ceil(rect.width), h: Math.ceil(rect.height) };
	}

	function fits(label, px, availW, availH){
		const m = measure(label, px);
		return (m.w <= availW) && (m.h <= availH);
	}

	function getAvailWidth(btn){
		const cs = getComputedStyle(btn);
		const padL = parseFloat(cs.paddingLeft) || 0;
		const padR = parseFloat(cs.paddingRight) || 0;
		return Math.max(1, btn.clientWidth - padL - padR - SAFE_PAD);
	}

	function justifyToWidth(label, targetW){
		label.style.wordSpacing = 'normal';
		label.style.letterSpacing = 'normal';

		const baseW = label.getBoundingClientRect().width;
		let delta = Math.floor(targetW - baseW);
		if (delta <= 0) return;

		const text = (label.textContent || '').trim();
		const totalChars = text.length;
		const gaps = Math.max(totalChars - 1, 0);

		if (gaps > 0) {
			const ls = delta / gaps;
			label.style.letterSpacing = ls + 'px';
		}
	}

	function fitOne(btn){
		const label = ensureLabel(btn);
		if (!label) return;

		btn.style.removeProperty('--fs');
		label.style.wordSpacing   = 'normal';
		label.style.letterSpacing = 'normal';

		const availW = getAvailWidth(btn);
		const availH = Math.max(1, btn.clientHeight - SAFE_PAD);

		let lo = MIN_PX;
		let hi = Math.max(lo, getMaxFont(btn));
		let best = lo;

		while (lo <= hi) {
			const mid = Math.floor((lo + hi) / 2);
			const midAdj = Math.floor(mid * ASCENDER_COMP);
			if (fits(label, midAdj, availW, availH)) {
				best = midAdj;
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}

		for (let bump = 2; bump >= 1; bump--) {
			if (fits(label, best + bump, availW, availH)) { 
				best = best + bump; 
				break; 
			}
		}

		btn.style.setProperty('--fs', best + 'px');
		requestAnimationFrame(() => {
			justifyToWidth(label, availW);
		});
	}

	function fitAll(){ 
		document.querySelectorAll(BTN_SEL).forEach(fitOne); 
	}

	function init(){
		fitAll();
		window.addEventListener('resize', fitAll);
		window.addEventListener('orientationchange', fitAll);
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll).catch(()=>{});

		const ro = new ResizeObserver(() => requestAnimationFrame(fitAll));
		const panel = document.querySelector('.PANEL') || document.body;
		ro.observe(panel);

		setTimeout(fitAll, 60);
		setTimeout(fitAll, 180);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once:true });
	} else {
		init();
	}
})();
