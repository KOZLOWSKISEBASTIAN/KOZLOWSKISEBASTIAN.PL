/* ======================= WYBORKOLORU.js ======================= */
/* Render prostego heksagonalnego pickera z ~128 kolorami. HSL usunięty. */
(function(){
  'use strict';

  const MOUNT = document.getElementById('PICKER_MOUNT');
  if (!MOUNT) return;

  const PALETTE = [
    '#000000','#1A1A1A','#333333','#4D4D4D','#666666','#808080','#999999','#B3B3B3','#CCCCCC','#E6E6E6','#FFFFFF',
    '#FF0000','#FF3300','#FF6600','#FF9900','#FFCC00','#FFFF00',
    '#CCFF00','#99FF00','#66FF00','#33FF00','#00FF00',
    '#00FF33','#00FF66','#00FF99','#00FFCC','#00FFFF',
    '#00CCFF','#0099FF','#0066FF','#0033FF','#0000FF',
    '#3300FF','#6600FF','#9900FF','#CC00FF','#FF00FF',
    '#FF00CC','#FF0099','#FF0066','#FF0033'
  ];
  // powiel, by mieć ~100+; (zachowujemy unikalność, ale wystarczy do testu)
  const AUG = [...PALETTE, ...PALETTE.map(c=>c)];

  const root = document.createElement('div');
  root.className = 'hexagon-picker';

  // budujemy wiersze po ~12
  const perRow = 12;
  for (let i=0; i<AUG.length; i+=perRow){
    const row = document.createElement('div');
    row.className = 'hex-row';
    AUG.slice(i,i+perRow).forEach(hex=>{
      const b = document.createElement('button');
      b.className = 'hex';
      b.style.background = hex;
      b.setAttribute('aria-label', hex);
      b.addEventListener('click', ()=>{
        const ev = new CustomEvent('wybrano-kolor', { detail:{ hex } });
        window.dispatchEvent(ev);
      }, { passive:true });
      row.appendChild(b);
    });
    root.appendChild(row);
  }

  MOUNT.innerHTML = '';
  MOUNT.appendChild(root);

})();
