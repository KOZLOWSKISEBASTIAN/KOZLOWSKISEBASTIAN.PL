document.querySelectorAll('a:not(.close-btn)').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
});
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('ODSYŁACZ ZOSTAŁ SKOPIOWANY:', text);
    }).catch(err => {
        console.error('BŁĄD PODCZAS KOPIOWANIA:', err);
    });
}
function toggleInstruction() {
    const instruction = document.getElementById('password-instruction');
    if (instruction.style.display === 'block') {
        instruction.style.display = 'none';
    } else {
        instruction.style.display = 'block';
    }
}
document.querySelectorAll('.chrome-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const url = this.href;
        copyToClipboard(url);
        toggleInstruction();
    });
});
document.getElementById('open-new-tab').addEventListener('click', function(e) {
    e.preventDefault();
    window.open('', '_blank');
});
document.getElementById('close-instruction').addEventListener('click', function() {
    const instruction = document.getElementById('password-instruction');
    instruction.style.display = 'none';
});
document.querySelectorAll('.open-all').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const row = this.closest('.row');
        const links = Array.from(row.querySelectorAll('.links a[href]'));
        const openLinksWithDelay = (links, index = 0) => {
            if (index >= links.length) return;
            window.open(links[index].href, '_blank');
            setTimeout(() => {
                openLinksWithDelay(links, index + 1);
            }, 100);
        };
        openLinksWithDelay(links);
    });
});
