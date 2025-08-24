(function(){
	const ROOT = document.documentElement;
	const isDesktop = () => window.innerWidth >= 999;
	let manualTryb = null;

	function setMotyw(tryb){
		ROOT.setAttribute('WYBOR_MOTYW', tryb);
	}

	function mobileAutoByHour(){
		const h = new Date().getHours();
		return (h >= 7 && h < 20) ? 'JASNY' : 'CIEMNY';
	}

	function applyPolicy(){
		if (manualTryb) { setMotyw(manualTryb); return; }
		if (isDesktop()) setMotyw('CIEMNY');
		else setMotyw(mobileAutoByHour());
	}

	applyPolicy();

	const onResize = () => { if (!manualTryb) applyPolicy(); };
	window.addEventListener('resize', onResize);
	window.addEventListener('orientationchange', onResize);

	let timer = null;
	function scheduleHourlyTick(){
		if (timer) clearTimeout(timer);
		const now = new Date();
		const ms = (60 - now.getMinutes())*60*1000 - now.getSeconds()*1000 - now.getMilliseconds();
		timer = setTimeout(() => {
			if (!manualTryb && !isDesktop()) applyPolicy();
			scheduleHourlyTick();
		}, Math.max(1000, ms));
	}
	scheduleHourlyTick();

	window.addEventListener('motyw:reka', (e) => {
		const t = e?.detail === 'JASNY' ? 'JASNY' : 'CIEMNY';
		manualTryb = t;
		setMotyw(t);
	});

	window.addEventListener('motyw:auto', () => {
		manualTryb = null;
		applyPolicy();
	});
})();