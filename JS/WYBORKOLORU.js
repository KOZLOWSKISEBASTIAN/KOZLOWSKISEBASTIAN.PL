document.addEventListener("DOMContentLoaded", () => {
    const hexagonPicker = document.getElementById("hexagonPicker");
    const inputHEX = document.getElementById("colorBoxHEX");
    const inputRGB = document.getElementById("colorBoxRGB");
    const inputHSL = document.getElementById("colorBoxHSL");

    const rowOffsets = [90, 75, 60, 45, 30, 15, 0, 15, 30, 45, 60, 75, 90];
    const colorRows = [
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

    let locked = false;
    let currentColor = "#FFFFFF";

    function hexToRgb(hex) {
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        };
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
    }

    function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c/2;
        let r=0, g=0, b=0;
        if (0 <= h && h < 60) { r = c; g = x; }
        else if (60 <= h && h < 120) { r = x; g = c; }
        else if (120 <= h && h < 180) { g = c; b = x; }
        else if (180 <= h && h < 240) { g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; b = c; }
        else if (300 <= h && h < 360) { r = c; b = x; }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function setColor(hex) {
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        inputHEX.value = hex;
        inputRGB.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        inputHSL.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        currentColor = hex;
    }

    // Eventy HEX
    inputHEX.addEventListener("blur", () => {
        const val = inputHEX.value.trim();
        if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
            setColor(val);
        } else {
            inputHEX.value = currentColor;
        }
    });

    // Eventy RGB
    inputRGB.addEventListener("blur", () => {
        const match = inputRGB.value.trim().match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i);
        if (match) {
            const [ , r, g, b ] = match.map(Number);
            if ([r,g,b].every(v => v>=0 && v<=255)) {
                setColor(rgbToHex(r,g,b));
                return;
            }
        }
        const rgb = hexToRgb(currentColor);
        inputRGB.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    });

    // Eventy HSL
    inputHSL.addEventListener("blur", () => {
        const match = inputHSL.value.trim().match(/^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/i);
        if (match) {
            const [ , h, s, l ] = match.map(Number);
            if (h>=0 && h<=360 && s>=0 && s<=100 && l>=0 && l<=100) {
                setColor(rgbToHex(...hslToRgb(h,s,l).match(/\d+/g).map(Number)));
                return;
            }
        }
        const hsl = rgbToHsl(...Object.values(hexToRgb(currentColor)));
        inputHSL.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    });

    // Generowanie hexów
    let cols = 7;
    rowOffsets.forEach((offset, rowIndex) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "hex-row";
        rowDiv.style.marginLeft = offset + "px";

        for (let i=0; i<cols; i++) {
            const color = colorRows[rowIndex]?.[i] || "#000000";
            const hexDiv = document.createElement("div");
            hexDiv.className = "hex";
            hexDiv.style.backgroundColor = color;

            hexDiv.addEventListener("mouseover", () => {
                if (!locked) setColor(color);
            });
            hexDiv.addEventListener("click", e => {
                e.stopPropagation();
                locked = true;
                setColor(color);
            });

            rowDiv.appendChild(hexDiv);
        }
        hexagonPicker.appendChild(rowDiv);
        cols += rowIndex < 6 ? 1 : -1;
    });

    // odblokowanie kliknięcia poza hex
    document.addEventListener("click", e => {
        if (!e.target.closest(".hex")) locked = false;
    });

    // startowy kolor
    setColor("#FFFFFF");
});
