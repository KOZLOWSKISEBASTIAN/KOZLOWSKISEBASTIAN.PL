        let db;
        const request = indexedDB.open('NotatnikDB', 8);
        request.onerror = function(event) {
            console.error("Błąd przy otwieraniu bazy danych:", event.target.error);
        };
        request.onsuccess = function(event) {
            db = event.target.result;
            KOZLOWSKISEBASTIAN_NOTATNIK_WYSWIETL_NOTATKI();
        };
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notatki')) {
                const objectStore = db.createObjectStore('notatki', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('text', 'text', { unique: false });
                objectStore.createIndex('file', 'file', { unique: false });
                objectStore.createIndex('filename', 'filename', { unique: false });
                objectStore.createIndex('filetype', 'filetype', { unique: false });
                objectStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
        const KOZLOWSKISEBASTIAN_NOTATNIK_LISTA = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-LISTA');
        const KOZLOWSKISEBASTIAN_NOTATNIK_DODAJ_BTN = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-DODAJ');
        const KOZLOWSKISEBASTIAN_NOTATNIK_DODAJ_PLIK_BTN = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-DODAJ-PLIK');
        const KOZLOWSKISEBASTIAN_NOTATNIK_EKSPORTUJ_BTN = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-EKSPORTUJ');
        const KOZLOWSKISEBASTIAN_NOTATNIK_IMPORTUJ_BTN = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-IMPORTUJ');
        const KOZLOWSKISEBASTIAN_NOTATNIK_PLIK_INPUT = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-PLIK-INPUT');
        const KOZLOWSKISEBASTIAN_NOTATNIK_IMPORT_INPUT = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-IMPORT-INPUT');
        const KOZLOWSKISEBASTIAN_NOTATNIK_NOWA_NOTATKA_INPUT = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-INPUT');
        const KOZLOWSKISEBASTIAN_NOTATNIK_NAZWA_PLIKU_ELEMENT = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-NAZWA-PLIKU');
        const KOZLOWSKISEBASTIAN_NOTATNIK_OVERLAY = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-OVERLAY');
        const KOZLOWSKISEBASTIAN_NOTATNIK_DIALOG = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-DIALOG');
        const KOZLOWSKISEBASTIAN_NOTATNIK_DIALOG_TEKST = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-DIALOG-TEKST');
        const KOZLOWSKISEBASTIAN_NOTATNIK_DIALOG_PRZYCISK = document.getElementById('KOZLOWSKISEBASTIAN_NOTATNIK-DIALOG-PRZYCISK');
        let KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_PLIK = null;
        let KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNA_NAZWA_PLIKU = '';
        let KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_TYP_PLIKU = '';
        function KOZLOWSKISEBASTIAN_NOTATNIK_POKAZ_DIALOG(tekst) {
            KOZLOWSKISEBASTIAN_NOTATNIK_DIALOG_TEKST.textContent = tekst;
            KOZLOWSKISEBASTIAN_NOTATNIK_DIALOG.style.display = 'block';
            KOZLOWSKISEBASTIAN_NOTATNIK_OVERLAY.style.display = 'block';
        }
        function KOZLOWSKISEBASTIAN_NOTATNIK_ZAMKNIJ_DIALOG() {
            KOZLOWSKISEBASTIAN_NOTATNIK_DIALOG.style.display = 'none';
            KOZLOWSKISEBASTIAN_NOTATNIK_OVERLAY.style.display = 'none';
        }
        function KOZLOWSKISEBASTIAN_NOTATNIK_DATA_URL_DO_BLOB(dataURL) {
            const arr = dataURL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {type: mime});
        }
        function KOZLOWSKISEBASTIAN_NOTATNIK_FORMATUJ_DATE(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('pl-PL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        KOZLOWSKISEBASTIAN_NOTATNIK_DIALOG_PRZYCISK.addEventListener('click', KOZLOWSKISEBASTIAN_NOTATNIK_ZAMKNIJ_DIALOG);
        KOZLOWSKISEBASTIAN_NOTATNIK_OVERLAY.addEventListener('click', KOZLOWSKISEBASTIAN_NOTATNIK_ZAMKNIJ_DIALOG);
        function KOZLOWSKISEBASTIAN_NOTATNIK_WYSWIETL_NOTATKI() {
            const transaction = db.transaction(['notatki'], 'readonly');
            const objectStore = transaction.objectStore('notatki');
            const request = objectStore.getAll();
            request.onsuccess = function(event) {
                const notatki = event.target.result;
                KOZLOWSKISEBASTIAN_NOTATNIK_LISTA.innerHTML = '';
                notatki.forEach((item) => {
                    const li = document.createElement('li');
                    li.className = 'KOZLOWSKISEBASTIAN_NOTATNIK-ELEMENT';
                    li.setAttribute('data-id', item.id);
                    let fileHtml = '';
                    if (item.file) {
                        if (item.filetype && item.filetype.startsWith('image/')) {
                            fileHtml = `
                                <div class="KOZLOWSKISEBASTIAN_NOTATNIK-ELEMENT-IMAGE-CONTAINER">
                                    <span class="KOZLOWSKISEBASTIAN_NOTATNIK-USUN-PLIK" title="Usuń plik">X</span>
                                    <img src="${item.file}" class="KOZLOWSKISEBASTIAN_NOTATNIK-ELEMENT-IMAGE" data-file="${item.filename}">
                                </div>
                            `;
                        } else {
                            let iconClass = 'fa-file';
                            if (/pdf/.test(item.filetype)) iconClass = 'fa-file-pdf';
                            else if (/word|document/.test(item.filetype)) iconClass = 'fa-file-word';
                            else if (/text|plain/.test(item.filetype)) iconClass = 'fa-file-alt';
                            else if (/html/.test(item.filetype)) iconClass = 'fa-file-code';
                            else if (/zip|rar|7z/.test(item.filetype)) iconClass = 'fa-file-archive';
                            else if (/excel|spreadsheet/.test(item.filetype)) iconClass = 'fa-file-excel';
                            else if (/powerpoint|presentation/.test(item.filetype)) iconClass = 'fa-file-powerpoint';
                            fileHtml = `
                                <div class="KOZLOWSKISEBASTIAN_NOTATNIK-ELEMENT-PLIK" data-file="${item.filename}">
                                    <span class="KOZLOWSKISEBASTIAN_NOTATNIK-USUN-PLIK" title="Usuń plik">X</span>
                                    <i class="fas ${iconClass}"></i>
                                    ${item.filename}
                                </div>
                            `;
                        }
                    }
                    li.innerHTML = `
                        <span class="KOZLOWSKISEBASTIAN_NOTATNIK-TEKST">${item.text || '&nbsp;'}</span>
                        ${fileHtml}
                        <div class="KOZLOWSKISEBASTIAN_NOTATNIK-AKCJE">
                            <span class="KOZLOWSKISEBASTIAN_NOTATNIK-EDYTUJ"><i class="fas fa-edit"></i></span>
                            <span class="KOZLOWSKISEBASTIAN_NOTATNIK-USUN"><i class="fas fa-trash-alt"></i></span>
                        </div>
                    `;
                    KOZLOWSKISEBASTIAN_NOTATNIK_LISTA.appendChild(li);
                    const tekst = li.querySelector('.KOZLOWSKISEBASTIAN_NOTATNIK-TEKST');
                    const edytuj = li.querySelector('.KOZLOWSKISEBASTIAN_NOTATNIK-EDYTUJ');
                    const usun = li.querySelector('.KOZLOWSKISEBASTIAN_NOTATNIK-USUN');
                    const usunPlik = li.querySelector('.KOZLOWSKISEBASTIAN_NOTATNIK-USUN-PLIK');
                    const plikElement = li.querySelector('.KOZLOWSKISEBASTIAN_NOTATNIK-ELEMENT-IMAGE, .KOZLOWSKISEBASTIAN_NOTATNIK-ELEMENT-PLIK');
                    edytuj.addEventListener('click', () => {
                        tekst.contentEditable = true;
                        tekst.classList.add('EDITING');
                        li.classList.add('EDITING');
                        tekst.focus();
                        const range = document.createRange();
                        range.selectNodeContents(tekst);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                        const KOZLOWSKISEBASTIAN_NOTATNIK_ZAPISZ_ZMIANY = () => {
                            tekst.contentEditable = false;
                            tekst.classList.remove('EDITING');
                            li.classList.remove('EDITING');
                            const nowaWartosc = tekst.textContent.trim();
                            const transaction = db.transaction(['notatki'], 'readwrite');
                            const objectStore = transaction.objectStore('notatki');
                            const getRequest = objectStore.get(item.id);
                            getRequest.onsuccess = function() {
                                const data = getRequest.result;
                                data.text = nowaWartosc || '';
                                objectStore.put(data);
                            };
                        };
                        tekst.addEventListener('blur', KOZLOWSKISEBASTIAN_NOTATNIK_ZAPISZ_ZMIANY);
                        tekst.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                KOZLOWSKISEBASTIAN_NOTATNIK_ZAPISZ_ZMIANY();
                            }
                        });
                    });
                    if (plikElement) {
                        plikElement.addEventListener('click', (e) => {
                            if (e.target.classList.contains('KOZLOWSKISEBASTIAN_NOTATNIK-USUN-PLIK') || 
                                e.target.classList.contains('fa')) return;
                            const transaction = db.transaction(['notatki'], 'readonly');
                            const objectStore = transaction.objectStore('notatki');
                            const getRequest = objectStore.get(item.id);
                            getRequest.onsuccess = function() {
                                const data = getRequest.result;
                                if (data.file) {
                                    const link = document.createElement('a');
                                    link.href = data.file;
                                    link.download = data.filename;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }
                            };
                        });
                    }
                    if (usunPlik) {
                        usunPlik.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const transaction = db.transaction(['notatki'], 'readwrite');
                            const objectStore = transaction.objectStore('notatki');
                            const getRequest = objectStore.get(item.id);
                            getRequest.onsuccess = function() {
                                const data = getRequest.result;
                                data.file = null;
                                data.filename = '';
                                data.filetype = '';
                                objectStore.put(data);
                                KOZLOWSKISEBASTIAN_NOTATNIK_WYSWIETL_NOTATKI();
                            };
                        });
                    }
                    usun.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const transaction = db.transaction(['notatki'], 'readwrite');
                        const objectStore = transaction.objectStore('notatki');
                        objectStore.delete(item.id);
                        li.style.transform = 'translateX(100%)';
                        li.style.opacity = '0';
                        setTimeout(() => {
                            KOZLOWSKISEBASTIAN_NOTATNIK_WYSWIETL_NOTATKI();
                        }, 300);
                    });
                });
            };
        }
        KOZLOWSKISEBASTIAN_NOTATNIK_DODAJ_PLIK_BTN.addEventListener('click', () => {
            KOZLOWSKISEBASTIAN_NOTATNIK_PLIK_INPUT.click();
        });
        KOZLOWSKISEBASTIAN_NOTATNIK_PLIK_INPUT.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNA_NAZWA_PLIKU = file.name;
                KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_TYP_PLIKU = file.type;
                KOZLOWSKISEBASTIAN_NOTATNIK_NAZWA_PLIKU_ELEMENT.textContent = `Wybrany plik: ${KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNA_NAZWA_PLIKU}`;
                const reader = new FileReader();
                reader.onload = (event) => {
                    KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_PLIK = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNA_NAZWA_PLIKU = '';
                KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_TYP_PLIKU = '';
                KOZLOWSKISEBASTIAN_NOTATNIK_NAZWA_PLIKU_ELEMENT.innerHTML = '&nbsp;';
            }
        });
        function KOZLOWSKISEBASTIAN_NOTATNIK_DODAJ_NOTATKE() {
            const tekst = KOZLOWSKISEBASTIAN_NOTATNIK_NOWA_NOTATKA_INPUT.value.trim();
            if (tekst || KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_PLIK) {
                const transaction = db.transaction(['notatki'], 'readwrite');
                const objectStore = transaction.objectStore('notatki');
                const nowaNotatka = {
                    text: tekst || '',
                    file: KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_PLIK || null,
                    filename: KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNA_NAZWA_PLIKU || '',
                    filetype: KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_TYP_PLIKU || '',
                    createdAt: new Date().getTime()
                };
                const request = objectStore.add(nowaNotatka);
                request.onsuccess = function() {
                    KOZLOWSKISEBASTIAN_NOTATNIK_NOWA_NOTATKA_INPUT.value = '';
                    KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_PLIK = null;
                    KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNA_NAZWA_PLIKU = '';
                    KOZLOWSKISEBASTIAN_NOTATNIK_AKTUALNY_TYP_PLIKU = '';
                    KOZLOWSKISEBASTIAN_NOTATNIK_PLIK_INPUT.value = '';
                    KOZLOWSKISEBASTIAN_NOTATNIK_NAZWA_PLIKU_ELEMENT.innerHTML = '&nbsp;';
                    KOZLOWSKISEBASTIAN_NOTATNIK_WYSWIETL_NOTATKI();
                };
            }
        }
        KOZLOWSKISEBASTIAN_NOTATNIK_DODAJ_BTN.addEventListener('click', KOZLOWSKISEBASTIAN_NOTATNIK_DODAJ_NOTATKE);
        KOZLOWSKISEBASTIAN_NOTATNIK_NOWA_NOTATKA_INPUT.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                KOZLOWSKISEBASTIAN_NOTATNIK_DODAJ_NOTATKE();
            }
        });
        KOZLOWSKISEBASTIAN_NOTATNIK_EKSPORTUJ_BTN.addEventListener('click', async () => {
            try {
                const notatki = await new Promise((resolve) => {
                    const trans = db.transaction(['notatki'], 'readonly');
                    trans.objectStore('notatki').getAll().onsuccess = (e) => resolve(e.target.result);
                });
                const zip = new JSZip();
                const notesFolder = zip.folder("notatki");
                const filesFolder = zip.folder("pliki");
                let txtContent = "PRZYBORNIK NOTATNIK - EKSPORT\n";
                txtContent += `Data eksportu: ${KOZLOWSKISEBASTIAN_NOTATNIK_FORMATUJ_DATE(new Date().getTime())}\n\n`;
                txtContent += "================================\n\n";
                notatki.forEach((note, index) => {
                    txtContent += `NOTATKA ${index + 1}\n`;
                    txtContent += `Data utworzenia: ${KOZLOWSKISEBASTIAN_NOTATNIK_FORMATUJ_DATE(note.createdAt || new Date().getTime())}\n`;
                    txtContent += `Treść: ${note.text || '(brak tekstu)'}\n`;
                    if (note.filename) {
                        txtContent += `Załącznik: ${note.filename}\n`;
                        txtContent += `Typ pliku: ${note.filetype || 'nieznany'}\n`;
                    } 
                    txtContent += "\n================================\n\n";
                });
                notesFolder.file("PRZYBORNIK_NOTATNIK.txt", txtContent);
                let fileCount = 0;
                for (const note of notatki) {
                    if (note.file) {
                        const blob = KOZLOWSKISEBASTIAN_NOTATNIK_DATA_URL_DO_BLOB(note.file);
                        filesFolder.file(note.filename, blob);
                        fileCount++;
                    }
                }
                const currentDate = new Date();
                const formattedDate = [
                    currentDate.getFullYear(),
                    (currentDate.getMonth() + 1).toString().padStart(2, '0'),
                    currentDate.getDate().toString().padStart(2, '0')
                ].join('-');
                const content = await zip.generateAsync({type: "blob"});
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `PRZYBORNIK_NOTATNIK_${formattedDate}.zip`;
                a.click();
                URL.revokeObjectURL(url);
                KOZLOWSKISEBASTIAN_NOTATNIK_POKAZ_DIALOG(`Wyeksportowano ${notatki.length} notatek i ${fileCount} plików do ZIP!`);
            } catch (error) {
                KOZLOWSKISEBASTIAN_NOTATNIK_POKAZ_DIALOG("Błąd podczas eksportu: " + error.message);
            }
        });
        KOZLOWSKISEBASTIAN_NOTATNIK_IMPORTUJ_BTN.addEventListener('click', () => {
            KOZLOWSKISEBASTIAN_NOTATNIK_IMPORT_INPUT.click();
        });
        KOZLOWSKISEBASTIAN_NOTATNIK_IMPORT_INPUT.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const zip = new JSZip();
                const content = await zip.loadAsync(file);
                if (!content.files["notatki/PRZYBORNIK_NOTATNIK.txt"]) {
                    throw new Error("Nieprawidłowy format pliku ZIP - brak pliku PRZYBORNIK_NOTATNIK.txt");
                }
                const pliki = {};
                for (const [path, file] of Object.entries(content.files)) {
                    if (path.startsWith("pliki/") && !file.dir) {
                        const filename = path.replace("pliki/", "");
                        const fileData = await file.async("base64");
                        pliki[filename] = `data:application/octet-stream;base64,${fileData}`;
                    }
                }
                const clearTransaction = db.transaction(['notatki'], 'readwrite');
                const clearRequest = clearTransaction.objectStore('notatki').clear();
                clearRequest.onsuccess = () => {
                    const addTransaction = db.transaction(['notatki'], 'readwrite');
                    const objectStore = addTransaction.objectStore('notatki');
                    let addedCount = 0;
                    for (const [filename, fileData] of Object.entries(pliki)) {
                        const nowaNotatka = {
                            text: `Załączony plik: ${filename}`,
                            file: fileData,
                            filename: filename,
                            filetype: filename.split('.').pop(),
                            createdAt: new Date().getTime()
                        };
                        objectStore.add(nowaNotatka);
                        addedCount++;
                    }
                    addTransaction.oncomplete = () => {
                        KOZLOWSKISEBASTIAN_NOTATNIK_WYSWIETL_NOTATKI();
                        KOZLOWSKISEBASTIAN_NOTATNIK_POKAZ_DIALOG(`Zaimportowano ${addedCount} plików z archiwum ZIP!`);
                        KOZLOWSKISEBASTIAN_NOTATNIK_IMPORT_INPUT.value = '';
                    };
                };
            } catch (error) {
                KOZLOWSKISEBASTIAN_NOTATNIK_POKAZ_DIALOG("Błąd importu: " + error.message);
                KOZLOWSKISEBASTIAN_NOTATNIK_IMPORT_INPUT.value = '';
            }
        });
        window.addEventListener('load', KOZLOWSKISEBASTIAN_NOTATNIK_WYSWIETL_NOTATKI);
