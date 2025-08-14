(function () {
  const ROOT = document.documentElement;
  const KLUCZ_MOTYW = 'KOZLOWSKISEBASTIAN_MOTYW';
  const HEX = document.getElementById('KOZLOWSKISEBASTIAN_HEXAGON');
  const WYLACZNIK = document.getElementById('KOZLOWSKISEBASTIAN_WYLACZNIK');
  const TROJKATY = document.getElementById('KOZLOWSKISEBASTIAN_TROJKATY');

  const ZAPISANY = localStorage.getItem(KLUCZ_MOTYW);
  if (ZAPISANY === 'JASNY') ROOT.setAttribute('data-WYBOR_MOTYW', 'JASNY');
  if (ZAPISANY === 'CIEMNY') ROOT.setAttribute('data-WYBOR_MOTYW', 'CIEMNY');

  const PROG_MOUSE = 6;
  const PROG_TOUCH = 18;

  let dragging = false, moved = false, isTouch = false;
  let offsetX = 0, offsetY = 0, w = 0, h = 0;

  function clampHex(x, y) {
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    HEX.style.left = Math.min(Math.max(0, x), maxX) + 'px';
    HEX.style.top  = Math.min(Math.max(0, y), maxY) + 'px';
  }

  function startDrag(px, py, pointerType) {
    const rect = HEX.getBoundingClientRect();
    w = rect.width; h = rect.height;

    HEX.style.right = 'auto'; HEX.style.bottom = 'auto';
    if (!HEX.style.left) HEX.style.left = rect.left + 'px';
    if (!HEX.style.top ) HEX.style.top  = rect.top  + 'px';

    const curL = parseFloat(HEX.style.left) || rect.left;
    const curT = parseFloat(HEX.style.top)  || rect.top;

    offsetX = px - curL; offsetY = py - curT;
    dragging = true; moved = false; isTouch = (pointerType !== 'mouse');
    HEX.classList.add('KOZLOWSKISEBASTIAN_PRZECIAGANIE');
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
    HEX.classList.remove('KOZLOWSKISEBASTIAN_PRZECIAGANIE');
    if (!moved) toggleOverlay();
  }

  function toggleOverlay() {
    const KSZTALT = HEX.querySelector('.KOZLOWSKISEBASTIAN_HEXAGON');
    if (KSZTALT) {
      KSZTALT.classList.add('KOZLOWSKISEBASTIAN_OBRACAJ');
      setTimeout(() => KSZTALT.classList.remove('KOZLOWSKISEBASTIAN_OBRACAJ'), 220);
    }
    WYLACZNIK.classList.toggle('KOZLOWSKISEBASTIAN_AKTYWNY');
  }

  HEX.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    HEX.setPointerCapture?.(e.pointerId);
    startDrag(e.clientX, e.clientY, e.pointerType);
  });

  HEX.addEventListener('pointermove', (e) => {
    if (!dragging) return;

    e.preventDefault();
    moveDrag(e.clientX, e.clientY);
  }, { passive: false });

  HEX.addEventListener('pointerup',   () => endDrag());
  HEX.addEventListener('pointercancel', () => { dragging = false; });

  TROJKATY.addEventListener('click', (e) => {
    const btn = e.target?.closest('.KOZLOWSKISEBASTIAN_TROJKAT_JASNY, .KOZLOWSKISEBASTIAN_TROJKAT_CIEMNY');
    if (!btn) return;
    if (btn.classList.contains('KOZLOWSKISEBASTIAN_TROJKAT_JASNY')) {
      ROOT.setAttribute('data-WYBOR_MOTYW', 'JASNY');
      localStorage.setItem(KLUCZ_MOTYW, 'JASNY');
    } else {
      ROOT.setAttribute('data-WYBOR_MOTYW', 'CIEMNY');
      localStorage.setItem(KLUCZ_MOTYW, 'CIEMNY');
    }
    WYLACZNIK.classList.remove('KOZLOWSKISEBASTIAN_AKTYWNY');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') WYLACZNIK.classList.remove('KOZLOWSKISEBASTIAN_AKTYWNY');
  });
})();
