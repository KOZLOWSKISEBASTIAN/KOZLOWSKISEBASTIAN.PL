(function(){
	const BASE   = "https://kozlowskisebastian.pl/GRAFIKA/";
	const ICON_H = 44;
	const MIN_W  = 28;

	const MQ_MOBILE = window.matchMedia('(max-width: 998px)');
	const IS_MOBILE = () => MQ_MOBILE.matches;

	function applyIcon(btn){
		if (IS_MOBILE()) return;

		let file = (btn.dataset.ikon || "").trim();
		if (!file) return;
		if (!/\.(svg)(\?|#|$)/i.test(file)) file += ".svg";
		const url = BASE + encodeURIComponent(file);

		btn.style.setProperty('--mask', `url("${url}")`);
		btn.textContent = "";

		const img = new Image();
		img.onload = () => {
			const nh = img.naturalHeight || ICON_H;
			const nw = img.naturalWidth  || ICON_H;
			const width = Math.max(MIN_W, Math.round(ICON_H * (nw / nh)));
			btn.style.setProperty('--w', width + 'px');
			btn.style.width = width + 'px';
			const row = btn.closest('.ODSYLACZ_WIERSZ');
			if (row) adjustGhost(row);
		};
		img.onerror = () => {
			btn.style.setProperty('--w', ICON_H + 'px');
			btn.style.width = ICON_H + 'px';
			const row = btn.closest('.ODSYLACZ_WIERSZ');
			if (row) adjustGhost(row);
		};
		img.src = url;
	}

	function getGapPx(row){
		const cs = getComputedStyle(row);
		const g = parseFloat(cs.columnGap || cs.gap || '7') || 7;
		return Math.max(0, g);
	}

	function adjustGhost(row){
		if (!row) return;
		row.querySelectorAll('.PRZYCISK.PUSTY[data-filler="1"]').forEach(n => n.remove());
		if (IS_MOBILE()) return;

		const ghost = row.querySelector('.PRZYCISK.PUSTY:not([data-filler="1"])');
		if (!ghost) return;

		const children = Array.from(row.children).filter(el => !el.classList.contains('PUSTY'));
		if (!children.length) return;

		const gap = getGapPx(row);
		const sumWidths = children.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0);
		const gapsTotal = children.length * gap;
		const rowW = row.getBoundingClientRect().width;

		let W = Math.floor(rowW - sumWidths - gapsTotal);
		if (W < 0) W = 0;
		ghost.style.width = W + 'px';
	}

	function adjustAllGhosts(){
		document.querySelectorAll('.ODSYLACZ_WIERSZ').forEach(adjustGhost);
	}

	function layoutAll(){
		document.querySelectorAll('.PRZYCISK.ODSYLACZ_GRAFIKA').forEach(applyIcon);
		requestAnimationFrame(adjustAllGhosts);
	}

	function handleChromeUrl(url){
		try { navigator.clipboard?.writeText(url); } catch(e) {}
		try { window.open('about:blank', '_blank', 'noopener'); } catch(e) {}
	}

	function initSingleClicks(){
		document.addEventListener('click', (e) => {
			const a = e.target.closest('a.PRZYCISK.ODSYLACZ_GRAFIKA');
			if (!a) return;
			const href = a.getAttribute('href') || "";
			if (/^chrome:\/\//i.test(href)) {
				e.preventDefault();
				handleChromeUrl(href);
			}
		}, { passive: false });
	}

	function initOpenAll(){
		document.querySelectorAll('[data-open-all]').forEach(btn => {
			btn.addEventListener('click', () => {
				const row = btn.closest('.ODSYLACZ_WIERSZ');
				if (!row) return;
				const links = Array.from(row.querySelectorAll('a.PRZYCISK.ODSYLACZ_GRAFIKA')).map(a => a.href);
				links.forEach((href, i) => {
					setTimeout(() => {
						if (/^chrome:\/\//i.test(href)) handleChromeUrl(href);
						else window.open(href, "_blank", "noopener");
					}, i * 120);
				});
			});
		});
	}

	function convertIconsToText() {
		if (!IS_MOBILE()) return;

		document.querySelectorAll('.PRZYCISK.ODSYLACZ_GRAFIKA').forEach(btn => {
			let label = btn.getAttribute('aria-label') || btn.dataset.label || '';
			if (!label) {
				const href = btn.getAttribute('href') || '';
				try { label = new URL(href).hostname.replace(/^www\./,''); } catch(e){ label = 'LINK'; }
			}
			btn.textContent = label;
			btn.style.removeProperty('--mask');
			btn.style.removeProperty('--w');
			btn.style.removeProperty('width');
			btn.style.webkitMaskImage = 'none';
			btn.style.maskImage = 'none';
			btn.style.backgroundImage = 'none';
		});
	}

	function syncMode(){
		if (IS_MOBILE()) {
			convertIconsToText();
			adjustAllGhosts();
		} else {
			layoutAll();
		}
	}

	function bindRelayout(){
		const relayout = () => syncMode();
		MQ_MOBILE.addEventListener ? MQ_MOBILE.addEventListener('change', relayout) : MQ_MOBILE.addListener(relayout);
		window.addEventListener('resize', relayout);
		window.addEventListener('orientationchange', relayout);
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout).catch(()=>{});
	}

	function init(){
		syncMode();
		initSingleClicks();
		initOpenAll();
		bindRelayout();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once:true });
	} else {
		init();
	}
})();