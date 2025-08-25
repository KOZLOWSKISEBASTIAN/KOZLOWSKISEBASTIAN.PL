(function(){
	var CENA  = document.getElementById('CENA');
	var ILOSC = document.getElementById('ILOSC');
	var KM    = document.getElementById('KILOMETRY');

	var WRAP_KM   = document.getElementById('LICZYDLO_WRAP_KILOMETRY');
	var PUSTY_KM  = document.getElementById('LICZYDLO_PUSTY_KILOMETRY');
	var LAB_ILO   = document.getElementById('LICZYDLO_LABEL_ILOSC');

	var JED  = document.getElementById('JEDNOSTKA');
	var BTN  = document.getElementById('PRZELICZ');
	var OUT  = document.getElementById('WYNIK');

	function justifyToWidth(label, targetWidth){
		label.style.letterSpacing = '0px';
		var baseW = label.getBoundingClientRect().width;
		var delta = Math.floor(targetWidth - baseW);
		if (delta <= 0) return;
		var txt = (label.textContent || '').trim();
		var gaps = Math.max(txt.length - 1, 0);
		if (gaps <= 0) return;
		var ls = delta / gaps;
		label.style.letterSpacing = ls + 'px';
	}

	function fitLabelWrap(wrap){
		var label = wrap.querySelector('.LICZYDLO_LABEL.LABEL_AUTOSIZE');
		var input = wrap.querySelector('.LICZYDLO_POLE');
		if (!label || !input) return;
		if (wrap.classList.contains('UKRYTY') || input.offsetParent === null) return;

		var availW = Math.max(1, input.clientWidth);
		var availH = Math.max(1, input.clientHeight - 6);

		label.style.fontSize = '';
		label.style.letterSpacing = '0px';
		label.style.whiteSpace = 'nowrap';

		var lo = 12;
		var hi = Math.max(12, Math.floor(availH));
		var best = lo;

		var rect0 = label.getBoundingClientRect();
		if (rect0.width <= availW && rect0.height <= availH){
			best = Math.min(hi, parseInt(getComputedStyle(label).fontSize,10) || 16);
		}

		while (lo <= hi){
			var mid = Math.floor((lo + hi) / 2);
			label.style.fontSize = mid + 'px';
			var r = label.getBoundingClientRect();
			if (r.width <= availW && r.height <= availH){
				best = mid; lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}

		label.style.fontSize = best + 'px';
		justifyToWidth(label, availW);
	}

	function fitAllLabels(){
		document.querySelectorAll('.LICZYDLO_POLE_WRAP').forEach(fitLabelWrap);
	}

	function onlyNumericClean(s){
		s = String(s||'').replace(/[^\d.,]/g,'').replace(',', '.');
		var firstDot = s.indexOf('.');
		if (firstDot !== -1){
			s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g,'');
		}
		return s;
	}
	function parseNum(s){
		var v = parseFloat(String(s||'').replace(/\s+/g,'').replace(',','.'));
		return isNaN(v) ? null : v;
	}
	function fmt(n, d){
		if(!isFinite(n)) return '—';
		var x = (typeof d==='number' ? n.toFixed(d) : String(n));
		return String(x).replace('.',',');
	}
	function show(t){ OUT.style.display='block'; OUT.innerHTML=t; }
	function hide(){ OUT.style.display='none'; OUT.innerHTML=''; }

	function syncLabelState(input){
		var wrap = input && input.parentElement;
		if (!wrap) return;
		if ((input.value||'').length > 0) wrap.classList.add('MA_WARTOSC');
		else wrap.classList.remove('MA_WARTOSC');
	}

	function toggleExtra(){
		var v = JED.value;
		var needKm = (v === 'PALIWO' || v === 'TRASA');

		LAB_ILO.textContent = (v === 'TRASA') ? 'ŚREDNIE SPALANIE' : 'ILOŚĆ';

		if (needKm){
			WRAP_KM.classList.remove('UKRYTY');
			PUSTY_KM.classList.remove('AKTYWNY');
		} else {
			WRAP_KM.classList.add('UKRYTY');
			PUSTY_KM.classList.add('AKTYWNY');
			KM.value = '';
			syncLabelState(KM);
		}

		hide();
		requestAnimationFrame(fitAllLabels);
	}

	function oblicz(){
		var cena = parseNum(CENA.value);
		var ilosc = parseNum(ILOSC.value);
		var typ = JED.value;
		var kil = parseNum(KM.value);

		if (cena==null || ilosc==null){ show('Wprowadź: CENA i ILOŚĆ'); return; }

		var res = '';
		if (typ === 'ML'){
			var zaL = cena/ilosc*1000;
			res = 'Cena za litr: ' + fmt(zaL,2) + ' zł';
		} else if (typ === 'DAG'){
			var zaKg = cena/ilosc*100;
			res = 'Cena za kg: ' + fmt(zaKg,2) + ' zł';
		} else if (typ === 'PALIWO'){
			if (kil==null){ show('Wprowadź: KILOMETRY'); return; }
			var spal = (ilosc/kil)*100;
			var koszt = cena*ilosc;
			var naKm = koszt/kil;
			res = 'Spalanie: ' + fmt(spal,2) + ' l/100 km\n'
				+ 'Koszt na 100 km: ' + fmt(naKm*100,2) + ' zł\n'
				+ 'Koszt za 1 km: ' + fmt(naKm,4) + ' zł\n'
				+ 'Całkowity koszt: ' + fmt(koszt,2) + ' zł (dla ' + fmt(kil,2) + ' km)';
		} else if (typ === 'TRASA'){
			if (kil==null){ show('Wprowadź: KILOMETRY'); return; }
			var paliwo = (kil*ilosc)/100;
			var kosztT = paliwo*cena;
			var naKm2 = kosztT/kil;
			res = 'Koszt trasy (' + fmt(kil,2) + ' km): ' + fmt(kosztT,2) + ' zł\n'
				+ 'Zużycie paliwa: ' + fmt(paliwo,2) + ' l\n'
				+ 'Koszt na 100 km: ' + fmt(naKm2*100,2) + ' zł\n'
				+ 'Koszt za 1 km: ' + fmt(naKm2,4) + ' zł';
		}
		show(res);
	}

	;[CENA, ILOSC, KM].forEach(function(inp){
		if(!inp) return;
		inp.addEventListener('input', function(){
			var pos = inp.selectionStart;
			var before = inp.value;
			inp.value = onlyNumericClean(before);
			try { inp.setSelectionRange(pos, pos); } catch(e){}
			syncLabelState(inp);
		});
		inp.addEventListener('blur', function(){ syncLabelState(inp); });
	});

	JED.addEventListener('change', toggleExtra);
	BTN.addEventListener('click', oblicz);

	;[CENA, ILOSC, KM].forEach(function(el){
		if(!el) return;
		el.addEventListener('keydown', function(e){
			if(e.key==='Enter'){ e.preventDefault(); oblicz(); }
		});
	});

	window.addEventListener('resize', () => requestAnimationFrame(fitAllLabels));
	window.addEventListener('orientationchange', () => requestAnimationFrame(fitAllLabels));
	if (document.fonts && document.fonts.ready){
		document.fonts.ready.then(() => requestAnimationFrame(fitAllLabels)).catch(()=>{});
	}

	['CENA','ILOSC','KILOMETRY'].forEach(function(id){
		var el = document.getElementById(id);
		if (el) syncLabelState(el);
	});
	toggleExtra();
	requestAnimationFrame(fitAllLabels);
})();