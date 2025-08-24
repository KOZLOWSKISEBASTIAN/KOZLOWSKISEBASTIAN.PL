(function () {
	const body = document.body;
	const image = document.getElementById('KSGROUP-LOGO-SVG');
	const canHover = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

	function setImage() {
		if (image) {
			image.src = "https://kozlowskisebastian.pl/GRAFIKA/KSGROUP-SVG.svg";
		}
	}

	function ensureTheme() {
		const root = document.documentElement;
		const explicit = root.getAttribute('data-theme') || body.getAttribute('data-theme');
		if (explicit) {
			root.setAttribute('data-theme', explicit);
			return;
		}
		const host = (location.hostname || "").toLowerCase();
		const theme = host.includes("kozlowskisebastian") ? "neon" : "white";
		root.setAttribute('data-theme', theme);
	}

	function resetEffect() { body.classList.remove('hover-active'); }
	function activateEffect() { body.classList.add('hover-active'); }
	function toggleEffect() {
		if (body.classList.contains('hover-active')) resetEffect();
		else activateEffect();
	}

	function bindEvents() {
		if (!image) return;

		if (window.PointerEvent) {
			image.addEventListener('pointerdown', (e) => {
				if (e.pointerType === 'touch' || e.pointerType === 'pen') toggleEffect();
			}, { passive: true });
		}

		image.addEventListener('touchstart', () => { toggleEffect(); }, { passive: true });
		image.addEventListener('click', () => { if (!canHover) toggleEffect(); }, { passive: true });

		if (canHover) {
			body.addEventListener('mouseover', activateEffect);
			body.addEventListener('mouseout', resetEffect);
		}
	}

	ensureTheme();
	setImage();
	bindEvents();
})();
