export default function initButtons() {
    document.querySelectorAll('.KOZLOWSKISEBASTIAN_PRZYBORNIK-PRZYCISK').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const polish = {'Ą':'A','Ć':'C','Ę':'E','Ł':'L','Ń':'N','Ó':'O','Ś':'S','Ź':'Z','Ż':'Z','ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z'};
            const path = btn.innerText.toUpperCase().replace(/[ĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, m => polish[m]).replace(/ /g, '-');
            if (btn.innerText.trim() !== '') {
                location.href = `https://kozlowskisebastian.pl/${path}/`;
            }
        });
    });
}