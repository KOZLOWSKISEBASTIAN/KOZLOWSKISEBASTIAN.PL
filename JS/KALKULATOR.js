const KSGROUP_OPERACJE = document.getElementById('KSGROUP-OPERACJE');
const KSGROUP_WYNIK = document.getElementById('KSGROUP-WYNIK');
let KSGROUP_AKTUALNE_DANE = '';
let KSGROUP_POPRZEDNIE_DANE = '';
let KSGROUP_OPERACJA = null;
let KSGROUP_RESETUJ_EKRAN = false;

const KSGROUP_MAPA_KLAWISZY = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '.': '.', ',': '.', '+': '+', '-': '-', '*': '*', 
    'x': '*', 'X': '*', '/': '/', 'Enter': '=', '=': '=', 
    'Escape': 'C', 'Backspace': '⌫', 'Delete': 'C',
    '_': '+/-'
};

const KSGROUP_MAPA_IKON = {
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
};

document.querySelectorAll('.KSGROUP-PRZYCISK').forEach(przycisk => {
    przycisk.addEventListener('click', function() {
        const ikona = this.querySelector('i');
        if (ikona) {
            const klasaIkony = Array.from(ikona.classList).find(klasa => klasa.startsWith('fa-'));
            if (klasaIkony && KSGROUP_MAPA_IKON[klasaIkony]) {
                KSGROUP_OBSLUZ_WEJSCIE(KSGROUP_MAPA_IKON[klasaIkony]);
            }
        }
    });
});

document.addEventListener('keydown', function(event) {
    const klawisz = event.key;
    if (KSGROUP_MAPA_KLAWISZY.hasOwnProperty(klawisz)) {
        event.preventDefault();
        KSGROUP_OBSLUZ_WEJSCIE(KSGROUP_MAPA_KLAWISZY[klawisz]);
    }
});

function KSGROUP_OBSLUZ_WEJSCIE(wartosc) {
    if (KSGROUP_WYNIK.value === 'Error') {
        KSGROUP_WYCZYSC_WSZYSTKO();
    }
    
    if (wartosc === 'C') {
        KSGROUP_WYCZYSC_WSZYSTKO();
    } else if (wartosc === '+/-') {
        KSGROUP_ZMIEN_ZNAK();
    } else if (wartosc === '⌫') {
        KSGROUP_COFNIJ();
    } else if (wartosc === '=') {
        KSGROUP_OBLICZ_WYNIK();
    } else if (['+', '-', '*', '/'].includes(wartosc)) {
        KSGROUP_USTAW_OPERACJE(wartosc);
    } else if (wartosc.match(/[0-9.]/)) {
        KSGROUP_DODAJ_LICZBE(wartosc);
    }
    KSGROUP_AKTUALIZUJ_WYSWIETLACZ();
}

function KSGROUP_WYCZYSC_WSZYSTKO() {
    KSGROUP_AKTUALNE_DANE = '';
    KSGROUP_POPRZEDNIE_DANE = '';
    KSGROUP_OPERACJA = null;
    KSGROUP_RESETUJ_EKRAN = false;
    KSGROUP_WYNIK.value = '0';
    KSGROUP_OPERACJE.value = '';
}

function KSGROUP_ZMIEN_ZNAK() {
    if (KSGROUP_AKTUALNE_DANE) {
        KSGROUP_AKTUALNE_DANE = (parseFloat(KSGROUP_AKTUALNE_DANE) * -1).toString();
    } else if (KSGROUP_WYNIK.value !== '0') {
        KSGROUP_AKTUALNE_DANE = (parseFloat(KSGROUP_WYNIK.value) * -1).toString();
    }
}

function KSGROUP_COFNIJ() {
    if (KSGROUP_AKTUALNE_DANE.length > 0) {
        KSGROUP_AKTUALNE_DANE = KSGROUP_AKTUALNE_DANE.slice(0, -1);
    } else if (KSGROUP_WYNIK.value !== '0' && !KSGROUP_OPERACJA) {
        KSGROUP_AKTUALNE_DANE = KSGROUP_WYNIK.value.slice(0, -1);
    }           
    
    if (KSGROUP_AKTUALNE_DANE === '' || KSGROUP_AKTUALNE_DANE === '-') {
        KSGROUP_AKTUALNE_DANE = '';
        KSGROUP_WYNIK.value = '0';
    }
}

function KSGROUP_DODAJ_LICZBE(liczba) {
    if (KSGROUP_RESETUJ_EKRAN) {
        KSGROUP_AKTUALNE_DANE = '';
        KSGROUP_RESETUJ_EKRAN = false;
    }
    
    if (liczba === '.' && KSGROUP_AKTUALNE_DANE.includes('.')) return;
    
    if (KSGROUP_AKTUALNE_DANE === '0' && liczba !== '.') {
        KSGROUP_AKTUALNE_DANE = liczba;
    } else {
        KSGROUP_AKTUALNE_DANE += liczba;
    }
}

function KSGROUP_USTAW_OPERACJE(operacja) {
    if (KSGROUP_AKTUALNE_DANE === '' && KSGROUP_POPRZEDNIE_DANE && KSGROUP_OPERACJA) {
        KSGROUP_OPERACJA = operacja;
        return;
    }
    
    if (KSGROUP_OPERACJA && !KSGROUP_RESETUJ_EKRAN) {
        KSGROUP_OBLICZ_WYNIK(false);
    }
    
    KSGROUP_POPRZEDNIE_DANE = KSGROUP_AKTUALNE_DANE || KSGROUP_WYNIK.value;
    KSGROUP_OPERACJA = operacja;
    KSGROUP_AKTUALNE_DANE = '';
    KSGROUP_RESETUJ_EKRAN = true;
}

function KSGROUP_OBLICZ_WYNIK(czyAktualizowacWyswietlacz = true) {
    if (!KSGROUP_OPERACJA || !KSGROUP_POPRZEDNIE_DANE) return;
    
    let wynik;
    const poprzednia = parseFloat(KSGROUP_POPRZEDNIE_DANE);
    const aktualna = parseFloat(KSGROUP_AKTUALNE_DANE) || parseFloat(KSGROUP_WYNIK.value) || 0;
    
    switch (KSGROUP_OPERACJA) {
        case '+': wynik = poprzednia + aktualna; break;
        case '-': wynik = poprzednia - aktualna; break;
        case '*': wynik = poprzednia * aktualna; break;
        case '/': wynik = aktualna === 0 ? 'Error' : poprzednia / aktualna; break;
        default: return;
    }
    
    if (typeof wynik === 'number' && !isNaN(wynik)) {
        wynik = Math.round(wynik * 100000) / 100000;
    }
    
    if (czyAktualizowacWyswietlacz) {
        KSGROUP_OPERACJE.value = `${KSGROUP_POPRZEDNIE_DANE} ${KSGROUP_OPERACJA} ${KSGROUP_AKTUALNE_DANE || aktualna} = ${wynik}`;
    }
    
    KSGROUP_AKTUALNE_DANE = wynik.toString();
    KSGROUP_POPRZEDNIE_DANE = '';
    KSGROUP_OPERACJA = null;
    KSGROUP_RESETUJ_EKRAN = true;
}

function KSGROUP_AKTUALIZUJ_WYSWIETLACZ() {
    KSGROUP_WYNIK.value = KSGROUP_AKTUALNE_DANE || (KSGROUP_OPERACJA ? '0' : KSGROUP_WYNIK.value);
    
    if (KSGROUP_OPERACJA && KSGROUP_POPRZEDNIE_DANE && !KSGROUP_RESETUJ_EKRAN) {
        KSGROUP_OPERACJE.value = `${KSGROUP_POPRZEDNIE_DANE} ${KSGROUP_OPERACJA}`;
    } else if (!KSGROUP_OPERACJE.value.includes('=')) {
        KSGROUP_OPERACJE.value = '';
    }
}
