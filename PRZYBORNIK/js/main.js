import { ustawMotywNaPodstawieGodziny, initThemeSwitcher } from './theme.js';
import initHexagon from './hexagon.js';
import initButtons from './buttons.js';

document.addEventListener('DOMContentLoaded', () => {
    ustawMotywNaPodstawieGodziny();
    initThemeSwitcher();
    initHexagon();
    initButtons();
});