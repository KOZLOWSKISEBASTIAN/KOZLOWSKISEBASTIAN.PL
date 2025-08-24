(function () {
	const HEX        = document.getElementById('HEXAGON');
	const WYLACZNIK  = document.getElementById('WYLACZNIK');
	const TROJKATY   = document.getElementById('TROJKATY');

	if (!HEX || !WYLACZNIK || !TROJKATY) return;

	const PROG_MOUSE = 6;
	const PROG_TOUCH = 18;

	let dragging = false;
	let moved    = false;
	let isTouch  = false;
	let offsetX  = 0;
	let offsetY  = 0;

	try { localStorage.removeItem('HEX_POS'); } catch {}
	HEX.style.left   = '';
	HEX.style.top    = '';
	HEX.style.right  = '';
	HEX.style.bottom = '';

	function clampHex(x, y) {
		const rect = HEX.getBoundingClientRect();
		const maxX = Math.max(0, window.innerWidth  - rect.width);
		const maxY = Math.max(0, window.innerHeight - rect.height);
		HEX.style.left = Math.min(Math.max(0, x), maxX) + 'px';
		HEX.style.top  = Math.min(Math.max(0, y), maxY) + 'px';
	}

	function startDrag(px, py, pointerType) {
		const rect = HEX.getBoundingClientRect();
		HEX.style.right  = 'auto';
		HEX.style.bottom = 'auto';
		if (!HEX.style.left) HEX.style.left = rect.left + 'px';
		if (!HEX.style.top ) HEX.style.top  = rect.top  + 'px';

		const curL = parseFloat(HEX.style.left) || rect.left;
		const curT = parseFloat(HEX.style.top)  || rect.top;

		offsetX = px - curL;
		offsetY = py - curT;

		dragging = true;
		moved    = false;
		isTouch  = (pointerType !== 'mouse');

		HEX.classList.add('PRZECIAGANIE');
	}

	function moveDrag(px, py) {
		if (!dragging) return;

		const targetLeft = px - offsetX;
		const targetTop  = py - offsetY;

		const curLeft = parseFloat(HEX.style.left) || 0;
		const curTop  = parseFloat(HEX.style.top)  || 0;

		const prog = isTouch ? PROG_TOUCH : PROG_MOUSE;
		if (!moved && (Math.abs(targetLeft - curLeft) > prog || Math.abs(targetTop - curTop) > prog)) {
			moved = true;
		}

		clampHex(targetLeft, targetTop);
	}

	function endDrag() {
		if (!dragging) return;
		dragging = false;
		HEX.classList.remove('PRZECIAGANIE');
		if (!moved) toggleOverlay();
	}

	function toggleOverlay() {
		const KSZTALT = HEX.querySelector('.HEXAGON');
		if (KSZTALT) {
			KSZTALT.classList.add('OBRACAJ');
			setTimeout(() => KSZTALT.classList.remove('OBRACAJ'), 220);
		}
		WYLACZNIK.classList.toggle('AKTYWNY');
	}

	HEX.addEventListener('dblclick', () => {
		window.dispatchEvent(new CustomEvent('motyw:auto'));
	});

	HEX.addEventListener('pointerdown', (e) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		HEX.setPointerCapture?.(e.pointerId);
		startDrag(e.clientX, e.clientY, e.pointerType);
	});

	HEX.addEventListener(
		'pointermove',
		(e) => {
			if (!dragging) return;
			e.preventDefault();
			moveDrag(e.clientX, e.clientY);
		},
		{ passive: false }
	);

	HEX.addEventListener('pointerup', endDrag);
	HEX.addEventListener('pointercancel', () => {
		dragging = false;
		HEX.classList.remove('PRZECIAGANIE');
	});

	TROJKATY.addEventListener('click', (e) => {
		const btn  = e.target?.closest('.TROJKAT_JASNY, .TROJKAT_CIEMNY');
		if (!btn) return;

		const tryb = btn.classList.contains('TROJKAT_JASNY') ? 'JASNY' : 'CIEMNY';
		window.dispatchEvent(new CustomEvent('motyw:reka', { detail: tryb }));
		WYLACZNIK.classList.remove('AKTYWNY');
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') WYLACZNIK.classList.remove('AKTYWNY');
	});
})();