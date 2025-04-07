        const KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJE = document.getElementById('KOZLOWSKISEBASTIAN_KALKULATOR-OPERACJE');
        const KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK = document.getElementById('KOZLOWSKISEBASTIAN_KALKULATOR-WYNIK');
                let KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = '';
                let KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE = '';
                let KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA = null;
                let KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN = false;
        const KOZLOWSKISEBASTIAN_KALKULATOR_MAPA = {
                KLAWISZE: {
                '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
                '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
                '.': '.', ',': '.', '+': '+', '-': '-', '*': '*', 
                'x': '*', 'X': '*', '/': '/', 'Enter': '=', '=': '=', 
                'Escape': 'C', 'Backspace': '⌫', 'Delete': 'C',
                '_': '+/-'
        },
                IKONY: {
                'fa-trash-alt': 'C',
                'fa-backspace': '⌫',
                'fa-plus-minus': '+/-',
                'fa-divide': '/',
                'fa-7': '7',
                'fa-8': '8',
                'fa-9': '9',
                'fa-times': '*',
                'fa-4': '4',
                'fa-5': '5',
                'fa-6': '6',
                'fa-minus': '-',
                'fa-1': '1',
                'fa-2': '2',
                'fa-3': '3',
                'fa-plus': '+',
                'fa-0': '0',
                'fa-circle': '.',
                'fa-equals': '='
        }
};
        document.querySelectorAll('.KOZLOWSKISEBASTIAN_KALKULATOR-PRZYCISK').forEach(przycisk => {
        przycisk.addEventListener('click', () => {
            const ikona = przycisk.querySelector('i');
        if (ikona) {
            const klasaIkony = Array.from(ikona.classList).find(klasa => klasa.startsWith('fa-'));
        if (klasaIkony && KOZLOWSKISEBASTIAN_KALKULATOR_MAPA.IKONY[klasaIkony]) {
                KOZLOWSKISEBASTIAN_KALKULATOR_OBSLUZ_WEJSCIE(KOZLOWSKISEBASTIAN_KALKULATOR_MAPA.IKONY[klasaIkony]);
            }
        }
    });
});
        document.addEventListener('keydown', event => {
            const klawisz = event.key;
        if (KOZLOWSKISEBASTIAN_KALKULATOR_MAPA.KLAWISZE[klawisz]) {
        event.preventDefault();
        KOZLOWSKISEBASTIAN_KALKULATOR_OBSLUZ_WEJSCIE(KOZLOWSKISEBASTIAN_KALKULATOR_MAPA.KLAWISZE[klawisz]);
    }
});
        function KOZLOWSKISEBASTIAN_KALKULATOR_OBSLUZ_WEJSCIE(wartosc) {
        if (KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value === 'Error') {
                KOZLOWSKISEBASTIAN_KALKULATOR_WYCZYSC_WSZYSTKO();
        return;
    }
    const operatory = ['+', '-', '*', '/'];
    const akcje = {
        'C': KOZLOWSKISEBASTIAN_KALKULATOR_WYCZYSC_WSZYSTKO,
        '+/-': KOZLOWSKISEBASTIAN_KALKULATOR_ZMIEN_ZNAK,
        '⌫': KOZLOWSKISEBASTIAN_KALKULATOR_COFNIJ,
        '=': KOZLOWSKISEBASTIAN_KALKULATOR_OBLICZ_WYNIK
    };
    if (akcje[wartosc]) {
        akcje[wartosc]();
    } else if (operatory.includes(wartosc)) {
        KOZLOWSKISEBASTIAN_KALKULATOR_USTAW_OPERACJE(wartosc);
    } else if (wartosc.match(/[0-9.]/)) {
        KOZLOWSKISEBASTIAN_KALKULATOR_DODAJ_LICZBE(wartosc);
    }
    KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALIZUJ_WYSWIETLACZ();
}
function KOZLOWSKISEBASTIAN_KALKULATOR_WYCZYSC_WSZYSTKO() {
    KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = '';
    KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE = '';
    KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA = null;
    KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN = false;
    KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value = '0';
    KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJE.value = '';
}
function KOZLOWSKISEBASTIAN_KALKULATOR_ZMIEN_ZNAK() {
    const wartosc = KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE || KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value;
    if (wartosc && wartosc !== '0') {
        KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = (parseFloat(wartosc) * -1).toString();
    }
}
function KOZLOWSKISEBASTIAN_KALKULATOR_COFNIJ() {
    if (KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE.length > 0) {
        KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE.slice(0, -1);
    } else if (KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value !== '0' && !KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA) {
        KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value.slice(0, -1);
    }
    if (!KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE || KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE === '-') {
        KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = '';
        KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value = '0';
    }
}
function KOZLOWSKISEBASTIAN_KALKULATOR_DODAJ_LICZBE(liczba) {
    if (KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN) {
        KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = '';
        KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN = false;
    }
    if (liczba === '.' && KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE.includes('.')) return;
    KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = 
        (KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE === '0' && liczba !== '.') 
            ? liczba 
            : KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE + liczba;
}
function KOZLOWSKISEBASTIAN_KALKULATOR_USTAW_OPERACJE(operacja) {
    if (KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE === '' && KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE && KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA) {
        KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA = operacja;
        return;
    }
    if (KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA && !KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN) {
        KOZLOWSKISEBASTIAN_KALKULATOR_OBLICZ_WYNIK(false);
    }
    KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE = KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE || KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value;
    KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA = operacja;
    KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = '';
    KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN = true;
}
function KOZLOWSKISEBASTIAN_KALKULATOR_OBLICZ_WYNIK(czyAktualizowacWyswietlacz = true) {
    if (!KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA || !KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE) return;
    const poprzednia = parseFloat(KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE);
    const aktualna = parseFloat(KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE) || 
                     parseFloat(KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value) || 0;
    const operacje = {
        '+': poprzednia + aktualna,
        '-': poprzednia - aktualna,
        '*': poprzednia * aktualna,
        '/': aktualna === 0 ? 'Error' : poprzednia / aktualna
    };
    let wynik = operacje[KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA];
    if (typeof wynik === 'number' && !isNaN(wynik)) {
        wynik = Math.round(wynik * 100000) / 100000;
    }
    if (czyAktualizowacWyswietlacz) {
        KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJE.value = 
            `${KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE} ${KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA} ` +
            `${KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE || aktualna} = ${wynik}`;
    }
    KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE = wynik.toString();
    KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE = '';
    KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA = null;
    KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN = true;
}
function KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALIZUJ_WYSWIETLACZ() {
    KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value = 
        KOZLOWSKISEBASTIAN_KALKULATOR_AKTUALNE_DANE || 
        (KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA ? '0' : KOZLOWSKISEBASTIAN_KALKULATOR_WYNIK.value);
    if (KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA && KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE && !KOZLOWSKISEBASTIAN_KALKULATOR_RESETUJ_EKRAN) {
        KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJE.value = 
            `${KOZLOWSKISEBASTIAN_KALKULATOR_POPRZEDNIE_DANE} ${KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJA}`;
    } else if (!KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJE.value.includes('=')) {
        KOZLOWSKISEBASTIAN_KALKULATOR_OPERACJE.value = '';
    }
}
