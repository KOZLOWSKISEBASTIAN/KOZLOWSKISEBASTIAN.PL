export function ustawMotywNaPodstawieGodziny() {
    const godzina = new Date().getHours();
    document.body.classList.remove('KOZLOWSKISEBASTIAN_CIEMNY', 'KOZLOWSKISEBASTIAN_JASNY');
    
    if (godzina >= 6 && godzina < 21) {
        document.body.classList.add('KOZLOWSKISEBASTIAN_JASNY');
    } else {
        document.body.classList.add('KOZLOWSKISEBASTIAN_CIEMNY');
    }
}

export function initThemeSwitcher() {
    const trojkaty = document.querySelectorAll('.KOZLOWSKISEBASTIAN_TROJKAT');
    
    trojkaty.forEach(trojkat => {
        trojkat.addEventListener('click', function(e) {
            document.querySelector('.KOZLOWSKISEBASTIAN_HEXAGON_KSZTALT').classList.remove('ROZSZERZONY');
            document.body.classList.remove('KOZLOWSKISEBASTIAN_CIEMNY', 'KOZLOWSKISEBASTIAN_JASNY');

            if (this.classList.contains('KOZLOWSKISEBASTIAN_TROJKAT_JEDEN')) {
                document.body.classList.add('KOZLOWSKISEBASTIAN_CIEMNY');
            } else if (this.classList.contains('KOZLOWSKISEBASTIAN_TROJKAT_DWA')) {
                document.body.classList.add('KOZLOWSKISEBASTIAN_JASNY');
            }

            e.stopPropagation();
        });
    });
}
