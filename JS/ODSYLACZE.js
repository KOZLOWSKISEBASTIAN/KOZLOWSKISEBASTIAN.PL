(function(){
  const BAZA = new URL('https://kozlowskisebastian.pl', document.baseURI);

  const SCIEZKI = new Map([
    ["KARTY", "KARTY"],
    ["NOTATNIK", "NOTATNIK"],
    ["KALKULATOR", "KALKULATOR"],
    ["LICZYDŁO", "LICZYDLO"],
    ["LATARKA WYŁĄCZONE", null],
    ["POGODA WYŁĄCZONE", null],
    ["GENERATOR", "GENERATOR"],
  ]);

  document.querySelectorAll('[data-klucz]').forEach(EL => {
    const KLUCZ = EL.getAttribute('data-klucz');
    const SCIEZKA = SCIEZKI.get(KLUCZ);
    if (SCIEZKA) {
      EL.href = new URL(SCIEZKA + '/', BAZA).href;
    } else {
      EL.setAttribute('tabindex', '-1');
      EL.addEventListener('click', E => E.preventDefault());
    }
  });
})();
