(function(){
  const ROOT = document.documentElement;
  const KLUCZ_MOTYW = 'KOZLOWSKISEBASTIAN_MOTYW';
  const HEX = document.getElementById('KOZLOWSKISEBASTIAN_HEXAGON');
  const WYLACZNIK = document.getElementById('KOZLOWSKISEBASTIAN_WYLACZNIK');
  const TROJKATY = document.getElementById('KOZLOWSKISEBASTIAN_TROJKATY');

  const ZAPISANY = localStorage.getItem(KLUCZ_MOTYW);
  if (ZAPISANY === 'JASNY') ROOT.setAttribute('data-WYBOR_MOTYW','JASNY');
  if (ZAPISANY === 'CIEMNY') ROOT.setAttribute('data-WYBOR_MOTYW','CIEMNY');

  const PIXEL_PROG = 6;
  let dragging = false, moved = false;
  let offsetX = 0, offsetY = 0, w = 0, h = 0;

  function clampHex(x, y){
    const maxX = Math.max(0, window.innerWidth  - w);
    const maxY = Math.max(0, window.innerHeight - h);
    HEX.style.left = Math.min(Math.max(0, x), maxX) + 'px';
    HEX.style.top  = Math.min(Math.max(0, y), maxY) + 'px';
  }
  function startDrag(clientX, clientY){
    const rect = HEX.getBoundingClientRect();
    w = rect.width; h = rect.height;
    HEX.style.right = 'auto'; HEX.style.bottom = 'auto';
    if (!HEX.style.left) HEX.style.left = rect.left + 'px';
    if (!HEX.style.top ) HEX.style.top  = rect.top  + 'px';
    const curL = parseFloat(HEX.style.left) || rect.left;
    const curT = parseFloat(HEX.style.top)  || rect.top;
    offsetX = clientX - curL; offsetY = clientY - curT;
    dragging = true; moved = false;
    HEX.classList.add('KOZLOWSKISEBASTIAN_PRZECIAGANIE');
  }
  function moveDrag(clientX, clientY){
    if (!dragging) return;
    const targetLeft = clientX - offsetX;
    const targetTop  = clientY - offsetY;
    const curLeft = parseFloat(HEX.style.left) || 0;
    const curTop  = parseFloat(HEX.style.top)  || 0;
    if (!moved && (Math.abs(targetLeft-curLeft) > PIXEL_PROG || Math.abs(targetTop-curTop) > PIXEL_PROG)) moved = true;
    clampHex(targetLeft, targetTop);
  }
  function endDrag(){
    if (!dragging) return;
    dragging = false;
    HEX.classList.remove('KOZLOWSKISEBASTIAN_PRZECIAGANIE');
    if (!moved) toggleOverlay();
  }

  HEX.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
    const onMove = (ev) => { ev.preventDefault(); moveDrag(ev.clientX, ev.clientY); };
    const onUp = (ev) => { ev.preventDefault(); endDrag(); cleanup(); };
    function cleanup(){ window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
  HEX.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, { passive: true });
  HEX.addEventListener('touchmove', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    if (dragging) e.preventDefault();
    moveDrag(t.clientX, t.clientY);
  }, { passive: false });
  HEX.addEventListener('touchend', () => { endDrag(); });

  function toggleOverlay(){
    const KSZTALT = HEX.querySelector('.KOZLOWSKISEBASTIAN_HEXAGON');
    if (KSZTALT) {
      KSZTALT.classList.add('KOZLOWSKISEBASTIAN_OBRACAJ');
      setTimeout(() => KSZTALT.classList.remove('KOZLOWSKISEBASTIAN_OBRACAJ'), 220);
    }
    WYLACZNIK.classList.toggle('KOZLOWSKISEBASTIAN_AKTYWNY');
  }

  TROJKATY.addEventListener('click', (e) => {
    const target = e.target && e.target.closest
      ? e.target.closest('.KOZLOWSKISEBASTIAN_TROJKAT_JASNY, .KOZLOWSKISEBASTIAN_TROJKAT_CIEMNY')
      : null;
    if (!target) return;

    if (target.classList.contains('KOZLOWSKISEBASTIAN_TROJKAT_JASNY')) {
      ROOT.setAttribute('data-WYBOR_MOTYW','JASNY');
      localStorage.setItem(KLUCZ_MOTYW,'JASNY');
    } else if (target.classList.contains('KOZLOWSKISEBASTIAN_TROJKAT_CIEMNY')) {
      ROOT.setAttribute('data-WYBOR_MOTYW','CIEMNY');
      localStorage.setItem(KLUCZ_MOTYW,'CIEMNY');
    }
    WYLACZNIK.classList.remove('KOZLOWSKISEBASTIAN_AKTYWNY');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') WYLACZNIK.classList.remove('KOZLOWSKISEBASTIAN_AKTYWNY');
  });
})();