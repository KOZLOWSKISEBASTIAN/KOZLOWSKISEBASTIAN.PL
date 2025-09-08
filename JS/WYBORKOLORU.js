document.addEventListener("DOMContentLoaded", () => {
  const wyborSzesciokat = document.getElementById("wyborSzesciokat");
  const poleHEX = document.getElementById("POLE_HEX");
  const poleRGB = document.getElementById("POLE_RGB");

  const przesunieciaWierszy = [90, 75, 60, 45, 30, 15, 0, 15, 30, 45, 60, 75, 90];
  const wierszeKolorow = [
    ["#003366","#336699","#3366CC","#003399","#000099","#0000CC","#000066"],
    ["#006666","#006699","#0099CC","#0066CC","#0033CC","#0000FF","#3333FF","#333399"],
    ["#669999","#009999","#33CCCC","#00CCFF","#0099FF","#0066FF","#3366FF","#3333CC","#666699"],
    ["#339966","#00CC99","#00FFCC","#00FFFF","#33CCFF","#3399FF","#6699FF","#6666FF","#6600FF","#6600CC"],
    ["#339933","#00CC66","#00FF99","#66FFCC","#66FFFF","#66CCFF","#99CCFF","#9999FF","#9966FF","#9933FF","#9900FF"],
    ["#006600","#00CC00","#00FF00","#66FF99","#99FFCC","#CCFFFF","#CCCCFF","#CC99FF","#CC66FF","#CC33FF","#CC00FF","#9900CC"],
    ["#003300","#009933","#33CC33","#66FF66","#99FF99","#CCFFCC","#FFFFFF","#FFCCFF","#FF99FF","#FF66FF","#FF00FF","#CC00CC","#660066"],
    ["#336600","#009900","#66FF33","#99FF66","#CCFF99","#FFFFCC","#FFCCCC","#FF99CC","#FF66CC","#FF33CC","#CC0099","#993399"],
    ["#333300","#669900","#99FF33","#CCFF66","#FFFF99","#FFCC99","#FF9999","#FF6699","#FF3399","#CC3399","#990099"],
    ["#666633","#99CC00","#CCFF33","#FFFF66","#FFCC66","#FF9966","#FF6666","#FF0066","#CC6699","#993366"],
    ["#999966","#CCCC00","#FFFF00","#FFCC00","#FF9933","#FF6600","#FF5050","#CC0066","#660033"],
    ["#996633","#CC9900","#FF9900","#CC6600","#FF3300","#FF0000","#CC0000","#990033"],
    ["#663300","#996600","#CC3300","#993300","#990000","#800000","#993333"]
  ];

  let zablokowany = false;
  let aktualnyKolor = "#FFFFFF";

  function ustawKolor(hex) {
    const rgb = hexNaRgb(hex);
    poleHEX.value = `HEX:${hex.toUpperCase()}`;
    poleRGB.value = `RGB:${rgb.r},${rgb.g},${rgb.b}`;
    aktualnyKolor = hex.toUpperCase();
  }

  function hexNaRgb(hex) {
    const h = hex.replace('#','');
    const n = parseInt(h,16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }
  function rgbNaHex(r,g,b) {
    const to2 = v => v.toString(16).padStart(2,'0');
    return ('#'+to2(r)+to2(g)+to2(b)).toUpperCase();
  }

  poleHEX.addEventListener("blur", () => {
    const m = poleHEX.value.trim().match(/#?[0-9a-f]{6}/i);
    if (m){
      const hex = ('#'+m[0].replace('#','')).toUpperCase();
      ustawKolor(hex);
    } else {
      poleHEX.value = `HEX:${aktualnyKolor}`;
    }
  });
  poleRGB.addEventListener("blur", () => {
    const m = poleRGB.value.trim().match(/rgb:?(\s*)?(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
    if (m){
      const r = Math.min(255, parseInt(m[2],10));
      const g = Math.min(255, parseInt(m[3],10));
      const b = Math.min(255, parseInt(m[4],10));
      ustawKolor(rgbNaHex(r,g,b));
    } else {
      const {r,g,b} = hexNaRgb(aktualnyKolor);
      poleRGB.value = `RGB:${r},${g},${b}`;
    }
  });

  let kolumn = 7;
  przesunieciaWierszy.forEach((offset, idx) => {
    const wiersz = document.createElement("div");
    wiersz.className = "szesciokat_wiersz";
    wiersz.style.marginLeft = offset + "px";

    for (let i=0; i<kolumn; i++) {
      const kolor = (wierszeKolorow[idx] && wierszeKolorow[idx][i]) ? wierszeKolorow[idx][i] : "#000000";
      const sze = document.createElement("div");
      sze.className = "szesciokat";
      sze.style.backgroundColor = kolor;

      sze.addEventListener("mouseover", () => {
        if (!zablokowany) ustawKolor(kolor);
      });
      sze.addEventListener("click", e => {
        e.stopPropagation();
        zablokowany = true;
        ustawKolor(kolor);
        window.dispatchEvent(new CustomEvent('wybrano-kolor', { detail:{ hex: kolor } }));
      });

      wiersz.appendChild(sze);
    }
    wyborSzesciokat.appendChild(wiersz);
    kolumn += idx < 6 ? 1 : -1;
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".szesciokat")) zablokowany = false;
  });

  ustawKolor("#FFFFFF");
});
