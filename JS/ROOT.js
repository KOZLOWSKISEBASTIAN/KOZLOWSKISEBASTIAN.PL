import { ustawMotywNaPodstawieGodziny, initThemeSwitcher } from 'https://kozlowskisebastian.pl/JS/MOTYW.js';
import initHexagon from 'https://kozlowskisebastian.pl/JS/HEXAGON.js';
import initButtons from 'https://kozlowskisebastian.pl/JS/PRZYCISK.js';

document.addEventListener('DOMContentLoaded', () => {
    ustawMotywNaPodstawieGodziny();
    initThemeSwitcher();
    initHexagon();
    initButtons();

});

