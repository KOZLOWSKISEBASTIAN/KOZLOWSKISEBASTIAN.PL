import { ustawMotywNaPodstawieGodziny, initThemeSwitcher } from 'https://kozlowskisebastian.pl/JS/kolorystyka.js';
import initHexagon from 'https://kozlowskisebastian.pl/JS/hexagon.js';
import initButtons from 'https://kozlowskisebastian.pl/JS/przyciski.js';

document.addEventListener('DOMContentLoaded', () => {
    ustawMotywNaPodstawieGodziny();
    initThemeSwitcher();
    initHexagon();
    initButtons();
});