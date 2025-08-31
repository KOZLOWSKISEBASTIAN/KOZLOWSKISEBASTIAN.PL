(function(){
	/* ====== INDEXEDDB ====== */
	let db;
	const request = indexedDB.open('NotatnikDB', 17);

	request.onerror = (e) => console.error('BŁĄD DB:', e.target.error);
	request.onsuccess = (e) => { db = e.target.result; renderList(); };
	request.onupgradeneeded = (e) => {
		const udb = e.target.result;
		if (!udb.objectStoreNames.contains('notatki')) {
			const os = udb.createObjectStore('notatki', { keyPath: 'id', autoIncrement: true });
			os.createIndex('text','text',{unique:false});
			os.createIndex('file','file',{unique:false});
			os.createIndex('filename','filename',{unique:false});
			os.createIndex('filetype','filetype',{unique:false});
			os.createIndex('createdAt','createdAt',{unique:false});
		}
	};

	/* ====== DOM ====== */
	const lista      = document.getElementById('notatnik-lista');
	const btnAdd     = document.getElementById('notatnik-dodaj');
	const btnFile    = document.getElementById('notatnik-dodaj-plik');
	const btnExport  = document.getElementById('notatnik-eksportuj');
	const btnImport  = document.getElementById('notatnik-importuj');
	const inpFile    = document.getElementById('notatnik-plik-input');
	const inpImport  = document.getElementById('notatnik-import-input');
	const editor     = document.getElementById('notatnik-edytor');
	const fileNameEl = document.getElementById('notatnik-nazwa-pliku');

	const overlay    = document.getElementById('notatnik-overlay');
	const dlg        = document.getElementById('notatnik-dialog');
	const dlgText    = document.getElementById('notatnik-dialog-tekst');
	const dlgBtn     = document.getElementById('notatnik-dialog-przycisk');

	const panelNew   = document.getElementById('notatnik-formatowanie-nowa');
	const colorNewBg = document.getElementById('notatnik-kolor-input-nowa');
	const colorNewTx = document.getElementById('notatnik-kolor-tekst-input-nowa');
	const btnSaveNew = document.getElementById('notatnik-zapisz-nowa');

	const dlgTbl     = document.getElementById('notatnik-dialog-tabela');
	const tblRowsInp = document.getElementById('notatnik-tabela-wiersze');
	const tblColsInp = document.getElementById('notatnik-tabela-kolumny');
	const tblOk      = document.getElementById('notatnik-dialog-tabela-ok');
	const tblCancel  = document.getElementById('notatnik-dialog-tabela-anuluj');

	const dlgTblMod  = document.getElementById('notatnik-dialog-modyfikuj-tabele');
	const modRowsInp = document.getElementById('notatnik-tabela-dodaj-wiersze');
	const modColsInp = document.getElementById('notatnik-tabela-dodaj-kolumny');
	const modOk      = document.getElementById('notatnik-dialog-modyfikuj-tabele-ok');
	const modCancel  = document.getElementById('notatnik-dialog-modyfikuj-tabele-anuluj');

	const linkDlg    = document.getElementById('notatnik-link-dialog');
	const linkUrlInp = document.getElementById('notatnik-link-url');
	const linkOk     = document.getElementById('notatnik-link-zatwierdz');
	const linkCancel = document.getElementById('notatnik-link-anuluj');
	const linkBtnNew = document.getElementById('notatnik-wstaw-link');

	/* ====== STAN ====== */
	let curFile = null;
	let curFileName = '';
	let curFileType = '';
	let editingEl = null;
	let editingPanel = null;
	let originalHTML = '';
	let selectionText = '';
	let tableToModify = null;

	/* ====== POMOCNICZE ====== */
	function showDialog(txt){
		dlgText.innerHTML = txt;
		dlg.style.display = 'block';
		overlay.style.display = 'block';
	}
	function closeDialog(){
		dlg.style.display = 'none';
		overlay.style.display = 'none';
	}

	function showTblDialog(){ dlgTbl.style.display = 'block'; overlay.style.display = 'block'; }
	function closeTblDialog(){ dlgTbl.style.display = 'none'; overlay.style.display = 'none'; }
	function showTblModDialog(tbl){
		tableToModify = tbl;
		modRowsInp.value = 0; modColsInp.value = 0;
		dlgTblMod.style.display = 'block'; overlay.style.display = 'block';
	}
	function closeTblModDialog(){
		dlgTblMod.style.display = 'none'; overlay.style.display = 'none';
		tableToModify = null;
	}

	function showLinkDialog(){
		const sel = window.getSelection();
		selectionText = sel.toString();
		const rect = (editingEl || editor).getBoundingClientRect();
		linkDlg.style.top  = (rect.bottom + window.scrollY) + 'px';
		linkDlg.style.left = (rect.left + window.scrollX) + 'px';
		linkDlg.style.display = 'block';
		linkUrlInp.focus();
	}
	function closeLinkDialog(){
		linkDlg.style.display = 'none';
		linkUrlInp.value = '';
	}
	function insertLink(url){
		if (!url) return;
		const text = selectionText || url;
		document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
		(editingEl || editor).focus();
	}

	function dataURLtoBlob(dataURL){
		const arr = dataURL.split(',');
		const mime = arr[0].match(/:(.*?);/)[1];
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8 = new Uint8Array(n);
		while(n--) u8[n] = bstr.charCodeAt(n);
		return new Blob([u8], { type: mime });
	}
	function fmtDate(ts){
		const d = new Date(ts);
		return d.toLocaleString('pl-PL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
	}
	function colLetter(n){
		let r=''; while(n>0){ const m=(n-1)%26; r=String.fromCharCode(65+m)+r; n=Math.floor((n-1)/26); } return r||'A';
	}

	async function tlumaczTekst(tekst){
		try{
			const detect = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(tekst)}&langpair=auto|pl`);
			const detectData = await detect.json();
			let pair;
			if (detectData?.responseData?.langFrom?.toLowerCase() === 'pl') pair = 'pl|en';
			else pair = (detectData?.responseData?.langFrom ? `${detectData.responseData.langFrom}|pl` : 'en|pl');
			const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(tekst)}&langpair=${pair}`);
			const data = await res.json();
			return data?.responseData?.translatedText || '(Błąd tłumaczenia)';
		}catch(err){
			console.error(err);
			return 'Błąd tłumaczenia: ' + err.message;
		}
	}

	function exec(cmd, val=null){
		document.execCommand(cmd,false,val);
		(editingEl || editor).focus();
	}

	function saveEdited(element){
		if (!element) return;
		const li = element.closest('.NOTATNIK_EL');
		const id = parseInt(li.getAttribute('data-id'),10);
		const tx = db.transaction(['notatki'],'readwrite');
		const os = tx.objectStore('notatki');
		const getReq = os.get(id);
		getReq.onsuccess = () => {
			const data = getReq.result;
			data.text = element.innerHTML || '';
			os.put(data);
			if (editingPanel){ editingPanel.remove(); editingPanel = null; }
			element.contentEditable = false;
			element.classList.remove('editing');
			li.classList.remove('editing');
			editingEl = null;
			// szerokie tabele -> przewijanie
			li.querySelectorAll('.NOTATNIK_TABELA').forEach(t => { if (t.scrollWidth > t.clientWidth) t.style.overflowX='auto'; });
			renderList();
		};
	}
	function cancelEdit(element){
		if(!element) return;
		const li = element.closest('.NOTATNIK_EL');
		element.innerHTML = originalHTML;
		if (editingPanel){ editingPanel.remove(); editingPanel = null; }
		element.contentEditable = false;
		element.classList.remove('editing');
		li.classList.remove('editing');
		editingEl = null;
		renderList();
	}

	function makeTable(rows, cols){
		let html = '<table class="NOTATNIK_TABELA"><thead><tr><th></th>';
		for (let j=1;j<=cols;j++){ html += `<th>${colLetter(j)}</th>`; }
		html += '</tr></thead><tbody>';
		for (let i=1;i<=rows;i++){
			html += `<tr><td style="text-align:center;">${i}</td>`;
			for (let j=1;j<=cols;j++) html += '<td>&nbsp;</td>';
			html += '</tr>';
		}
		html += '</tbody></table>';
		const range = document.createRange();
		range.selectNodeContents(editingEl || editor);
		range.deleteContents();
		range.insertNode(document.createRange().createContextualFragment(html));
		(editingEl || editor).focus();
	}
	function modTable(tbl, addRows, addCols){
		if (!tbl) return;
		const ths = tbl.querySelectorAll('th');
		const curCols = ths.length - 1;
		if (addCols>0){
			for(let j=curCols+1;j<=curCols+addCols;j++){
				const th = document.createElement('th');
				th.textContent = colLetter(j);
				ths[0].parentNode.appendChild(th);
			}
			tbl.querySelectorAll('tr').forEach(tr=>{
				for(let j=0;j<addCols;j++){ const td=document.createElement('td'); td.innerHTML='&nbsp;'; tr.appendChild(td); }
			});
		}
		if (addRows>0){
			const tbody = tbl.querySelector('tbody');
			for(let i=1;i<=addRows;i++){
				const tr = document.createElement('tr');
				tr.innerHTML = `<td style="text-align:center;">${tbody.children.length+1}</td>`;
				for(let j=0;j<curCols+Math.max(0,addCols);j++) tr.innerHTML += '<td>&nbsp;</td>';
				tbody.appendChild(tr);
			}
		}
		if (tbl.scrollWidth > tbl.clientWidth) tbl.style.overflowX='auto';
	}

	/* ====== DIALOGI ====== */
	dlgBtn.addEventListener('click', closeDialog);
	overlay.addEventListener('click', ()=>{
		closeDialog(); closeTblDialog(); closeTblModDialog(); closeLinkDialog();
	});

	tblOk.addEventListener('click', ()=>{
		const r = parseInt(tblRowsInp.value)||2;
		const c = parseInt(tblColsInp.value)||2;
		makeTable(r,c); closeTblDialog();
	});
	tblCancel.addEventListener('click', closeTblDialog);

	modOk.addEventListener('click', ()=>{
		const r = parseInt(modRowsInp.value)||0;
		const c = parseInt(modColsInp.value)||0;
		if (r>0 || c>0) modTable(tableToModify, r, c);
		closeTblModDialog();
	});
	modCancel.addEventListener('click', closeTblModDialog);

	linkBtnNew.addEventListener('click', (e)=>{ e.preventDefault(); showLinkDialog(); });
	linkOk.addEventListener('click', ()=>{ const url = (linkUrlInp.value||'').trim(); if(url) insertLink(url); closeLinkDialog(); });
	linkCancel.addEventListener('click', closeLinkDialog);

	/* ====== Formatowanie – nowa notatka ====== */
	document.querySelectorAll('#notatnik-formatowanie-nowa .NOTATNIK_BTN_F').forEach(btn=>{
		btn.addEventListener('click', (e)=>{
			e.preventDefault();
			const cmd = btn.getAttribute('data-cmd');
			const val = btn.getAttribute('data-value');
			if (cmd === 'formatBlock' && val === 'div'){ showTblDialog(); }
			else { exec(cmd, val); }
			editor.focus();
			return false;
		});
	});
	document.querySelectorAll('.NOTATNIK_KOLOR_OK').forEach(b=>{
		b.addEventListener('click', (e)=>{
			e.preventDefault();
			const cmd = b.getAttribute('data-cmd');
			const input = b.parentNode.querySelector('.NOTATNIK_KOLOR');
			exec(cmd, input.value);
			(editingEl || editor).focus();
			return false;
		});
	});

	/* ====== Zapis nowej notatki ====== */
	btnSaveNew.addEventListener('click', (e)=>{ e.preventDefault(); addNote(); return false; });

	/* Pokaż/ukryj pasek formatowania podczas edycji nowej */
	editor.addEventListener('focus', ()=>{ panelNew.style.display='flex'; });
	editor.addEventListener('blur', ()=>{
		setTimeout(()=>{ if (!panelNew.contains(document.activeElement)) panelNew.style.display='none'; }, 200);
	});
	editor.addEventListener('paste', (e)=>{
		e.preventDefault();
		const text = (e.clipboardData||window.clipboardData).getData('text/plain');
		document.execCommand('insertText', false, text);
	});
	editor.addEventListener('keydown', (e)=>{
		if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); document.execCommand('insertLineBreak'); }
	});
	editor.addEventListener('input', ()=>{ /* auto-height niepotrzebny przy flex; placeholder działa */ });

	/* ====== Render listy ====== */
	function renderList(){
		const tx = db.transaction(['notatki'],'readonly');
		tx.objectStore('notatki').getAll().onsuccess = (ev)=>{
			const notes = ev.target.result || [];
			lista.innerHTML = '';
			notes.forEach(item=>{
				const li = document.createElement('li');
				li.className = 'NOTATNIK_EL';
				li.setAttribute('data-id', item.id);

				let fileHtml = '';
				if (item.file){
					if (item.filetype && item.filetype.startsWith('image/')){
						fileHtml = `
							<div class="NOTATNIK_IMG_WRAP">
								<span class="NOTATNIK_DEL_FILE" title="USUŃ PLIK">✕</span>
								<img src="${item.file}" class="NOTATNIK_IMG" data-file="${item.filename}">
							</div>
						`;
					} else {
						fileHtml = `
							<div class="NOTATNIK_FILE" data-file="${item.filename}">
								<span class="NOTATNIK_DEL_FILE" title="USUŃ PLIK">✕</span>
								<span>📄</span><span>${item.filename}</span>
							</div>
						`;
					}
				}

				li.innerHTML = `
					<span class="NOTATNIK_TEKST">${item.text || '&nbsp;'}</span>
					${fileHtml}
					<div class="NOTATNIK_AKCJE">
						<button class="NOTATNIK_EDYTUJ" title="EDYTUJ">✎</button>
						<button class="NOTATNIK_USUN" title="USUŃ">🗑</button>
						<button class="NOTATNIK_ZAPISZ_INLINE" title="ZAPISZ">✔</button>
						<button class="NOTATNIK_ANULUJ_INLINE" title="ANULUJ">✕</button>
					</div>
				`;
				lista.appendChild(li);

				const textEl  = li.querySelector('.NOTATNIK_TEKST');
				const btnEd   = li.querySelector('.NOTATNIK_EDYTUJ');
				const btnRm   = li.querySelector('.NOTATNIK_USUN');
				const btnOk   = li.querySelector('.NOTATNIK_ZAPISZ_INLINE');
				const btnCan  = li.querySelector('.NOTATNIK_ANULUJ_INLINE');
				const delFile = li.querySelector('.NOTATNIK_DEL_FILE');
				const fileEl  = li.querySelector('.NOTATNIK_IMG, .NOTATNIK_FILE');

				/* Edycja */
				btnEd.addEventListener('click', ()=>{
					if (editingPanel) editingPanel.remove();

					// Pasek formatowania dla elementu
					const bar = document.createElement('div');
					bar.className = 'NOTATNIK_FORMATOWANIE';
					bar.innerHTML = `
						<button class="NOTATNIK_BTN_F" data-cmd="bold" title="POGRUBIENIE">𝐁</button>
						<button class="NOTATNIK_BTN_F" data-cmd="italic" title="KURSYWA">𝑰</button>
						<button class="NOTATNIK_BTN_F" data-cmd="underline" title="PODKREŚLENIE">U̲</button>
						<button class="NOTATNIK_BTN_F" data-cmd="strikeThrough" title="PRZEKREŚLENIE">̶S̶</button>
						<button class="NOTATNIK_BTN_F" data-cmd="insertUnorderedList" title="LISTA WYPUNKTOWANA">•◦</button>
						<button class="NOTATNIK_BTN_F" data-cmd="insertOrderedList" title="LISTA NUMEROWANA">1.</button>
						<button class="NOTATNIK_BTN_F" id="btn-link-ed" title="LINK">🔗</button>
						<button class="NOTATNIK_BTN_F" data-cmd="formatBlock" data-value="div" title="TABELA">▦</button>
						<button class="NOTATNIK_BTN_F" id="btn-tbl-mod" title="MODYFIKUJ TABELĘ">⤢</button>

						<button class="NOTATNIK_BTN_F" data-cmd="hiliteColor" data-value="#333333" title="CIEMNE TŁO">A</button>
						<button class="NOTATNIK_BTN_F" data-cmd="hiliteColor" data-value="#FF00FF" title="AKCENT TŁO">A</button>
						<button class="NOTATNIK_BTN_F" data-cmd="hiliteColor" data-value="#FFFFFF" title="BIAŁE TŁO">A</button>
						<div class="NOTATNIK_KOLOR_WRAP">
							<input type="color" class="NOTATNIK_KOLOR" value="#FF00FF">
							<button class="NOTATNIK_KOLOR_OK" data-cmd="hiliteColor">OK</button>
						</div>

						<button class="NOTATNIK_BTN_F" data-cmd="foreColor" data-value="#FFFFFF" title="BIAŁY TEKST">A</button>
						<button class="NOTATNIK_BTN_F" data-cmd="foreColor" data-value="#FF00FF" title="AKCENT TEKST">A</button>
						<div class="NOTATNIK_KOLOR_WRAP">
							<input type="color" class="NOTATNIK_KOLOR" value="#FF00FF">
							<button class="NOTATNIK_KOLOR_OK" data-cmd="foreColor">OK</button>
						</div>

						<button class="NOTATNIK_BTN_F" id="btn-tlumacz" title="TŁUMACZ">🌐</button>
					`;
					li.parentNode.insertBefore(bar, li);
					editingPanel = bar;

					originalHTML = textEl.innerHTML;
					textEl.contentEditable = true;
					textEl.classList.add('editing');
					li.classList.add('editing');
					editingEl = textEl;

					btnEd.style.display = 'none';
					btnRm.style.display = 'none';
					btnOk.style.display = 'inline-block';
					btnCan.style.display = 'inline-block';

					textEl.focus();
					const range = document.createRange(); range.selectNodeContents(textEl);
					const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);

					bar.querySelectorAll('.NOTATNIK_BTN_F').forEach(b=>{
						b.addEventListener('click',(e)=>{
							e.preventDefault();
							const cmd = b.getAttribute('data-cmd');
							const val = b.getAttribute('data-value');
							if (cmd === 'formatBlock' && val === 'div'){ showTblDialog(); }
							else exec(cmd, val);
							textEl.focus();
							return false;
						});
					});
					bar.querySelectorAll('.NOTATNIK_KOLOR_OK').forEach(b=>{
						b.addEventListener('click',(e)=>{
							e.preventDefault();
							const cmd = b.getAttribute('data-cmd');
							const inp = b.parentNode.querySelector('.NOTATNIK_KOLOR');
							exec(cmd, inp.value);
							textEl.focus();
							return false;
						});
					});

					bar.querySelector('#btn-tbl-mod').addEventListener('click',(e)=>{
						e.preventDefault();
						const sel = window.getSelection();
						let node = sel.anchorNode;
						while(node && node.nodeName !== 'TABLE') node = node.parentNode;
						if (node && node.nodeName === 'TABLE') showTblModDialog(node);
						else alert('Zaznacz tabelę do modyfikacji');
						return false;
					});
					bar.querySelector('#btn-link-ed').addEventListener('click',(e)=>{ e.preventDefault(); showLinkDialog(); });
					bar.querySelector('#btn-tlumacz').addEventListener('click', async (e)=>{
						e.preventDefault();
						const sel = window.getSelection();
						if (!sel.toString().trim()){ alert('Zaznacz tekst do tłumaczenia'); return; }
						const translated = await tlumaczTekst(sel.toString());
						document.execCommand('insertText', false, translated);
						textEl.focus();
						return false;
					});
				});

				/* Zapis / anulowanie */
				btnOk.addEventListener('click', (e)=>{ e.stopPropagation(); saveEdited(textEl); });
				btnCan.addEventListener('click', (e)=>{ e.stopPropagation(); cancelEdit(textEl); });

				/* Pobieranie pliku przy kliknięciu w załącznik (poza X) */
				if (fileEl){
					fileEl.addEventListener('click', (e)=>{
						if (e.target.classList.contains('NOTATNIK_DEL_FILE')) return;
						const tx = db.transaction(['notatki'],'readonly');
						const os = tx.objectStore('notatki');
						os.get(item.id).onsuccess = (gr)=>{
							const data = gr.result;
							if (data.file){
								const a = document.createElement('a');
								a.href = data.file; a.download = data.filename;
								document.body.appendChild(a); a.click(); a.remove();
							}
						};
					});
				}

				/* Usuwanie załącznika */
				if (delFile){
					delFile.addEventListener('click',(e)=>{
						e.stopPropagation();
						const tx = db.transaction(['notatki'],'readwrite');
						const os = tx.objectStore('notatki');
						os.get(item.id).onsuccess = (gr)=>{
							const data = gr.result;
							data.file = null; data.filename = ''; data.filetype = '';
							os.put(data); renderList();
						};
					});
				}

				/* Usuwanie notatki */
				btnRm.addEventListener('click',(e)=>{
					e.stopPropagation();
					const tx = db.transaction(['notatki'],'readwrite');
					tx.objectStore('notatki').delete(item.id);
					li.style.transform = 'translateX(100%)'; li.style.opacity = '0';
					setTimeout(renderList, 220);
				});
			});
		};
	}

	/* ====== Dodawanie pliku ====== */
	btnFile.addEventListener('click', ()=> inpFile.click());
	inpFile.addEventListener('change', (e)=>{
		const file = e.target.files[0];
		if (file){
			curFileName = file.name;
			curFileType = file.type;
			fileNameEl.textContent = `WYBRANY PLIK: ${curFileName}`;
			const r = new FileReader();
			r.onload = (ev)=>{ curFile = ev.target.result; };
			r.readAsDataURL(file);
		} else {
			curFile = null; curFileName=''; curFileType='';
			fileNameEl.innerHTML = '&nbsp;';
		}
	});

	/* ====== Dodawanie notatki ====== */
	function addNote(){
		const text = editor.innerHTML.trim();
		if (!(text || curFile)) return;
		const tx = db.transaction(['notatki'],'readwrite');
		const os = tx.objectStore('notatki');
		const note = {
			text: text || '',
			file: curFile || null,
			filename: curFileName || '',
			filetype: curFileType || '',
			createdAt: Date.now()
		};
		const req = os.add(note);
		req.onsuccess = ()=>{
			editor.innerHTML = '';
			curFile = null; curFileName=''; curFileType='';
			inpFile.value = '';
			fileNameEl.innerHTML = '&nbsp;';
			renderList();
		};
	}
	btnAdd.addEventListener('click', addNote);

	/* ====== Eksport ZIP ====== */
	btnExport.addEventListener('click', async ()=>{
		try{
			const notes = await new Promise(res=>{
				const t = db.transaction(['notatki'],'readonly');
				t.objectStore('notatki').getAll().onsuccess = (e)=> res(e.target.result||[]);
			});
			const zip = new JSZip();
			const folder = zip.folder('notatki');

			const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
	<sheets><sheet name="Notatki" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

			let sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
	<row>
		<c t="inlineStr"><is><t>Tytuł</t></is></c>
		<c t="inlineStr"><is><t>Data utworzenia</t></is></c>
		<c t="inlineStr"><is><t>Treść</t></is></c>
		<c t="inlineStr"><is><t>Załącznik</t></is></c>
	</row>`;
			notes.forEach((n, i)=>{
				sheet += `
	<row>
		<c t="inlineStr"><is><t>Notatka ${i+1}</t></is></c>
		<c t="inlineStr"><is><t>${fmtDate(n.createdAt||Date.now())}</t></is></c>
		<c t="inlineStr"><is><t>${(n.text||'(BRAK TEKSTU)')}</t></is></c>
		<c t="inlineStr"><is><t>${n.filename||''}</t></is></c>
	</row>`;
			});
			sheet += `</sheetData></worksheet>`;

			zip.file('notatki/[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
	<Default Extension="xml" ContentType="application/xml"/>
	<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
	<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
	<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
			zip.file('notatki/_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
	<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
			zip.file('notatki/xl/workbook.xml', workbook);
			zip.file('notatki/xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
	<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
			zip.file('notatki/xl/worksheets/sheet1.xml', sheet);

			let fileCount = 0;
			for (const n of notes){
				if (n.file){
					const blob = dataURLtoBlob(n.file);
					zip.file(`pliki/${n.filename}`, blob);
					fileCount++;
				}
			}
			const d = new Date();
			const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
			const content = await zip.generateAsync({type:'blob'});
			const url = URL.createObjectURL(content);
			const a = document.createElement('a');
			a.href = url; a.download = `PRZYBORNIK_NOTATNIK_${stamp}.zip`; a.click();
			URL.revokeObjectURL(url);

			showDialog(`WYEKSPORTOWANO ${notes.length} NOTATEK I ${fileCount} PLIKÓW DO ZIP!`);
		}catch(err){
			showDialog('BŁĄD PODCZAS EKSPORTU: ' + err.message);
		}
	});

	/* ====== Import ZIP ====== */
	btnImport.addEventListener('click', ()=> inpImport.click());
	inpImport.addEventListener('change', async (e)=>{
		const file = e.target.files[0]; if (!file) return;
		try{
			const zip = new JSZip();
			const content = await zip.loadAsync(file);

			const notesFile = content.files['notatki/xl/worksheets/sheet1.xml'];
			if (!notesFile) throw new Error('NIEPRAWIDŁOWY ZIP – brak notatki/xl/worksheets/sheet1.xml');

			const filesMap = {};
			for (const [path, zf] of Object.entries(content.files)){
				if (path.startsWith('pliki/') && !zf.dir){
					const filename = path.replace('pliki/','');
					const base64 = await zf.async('base64');
					filesMap[filename] = `data:application/octet-stream;base64,${base64}`;
				}
			}

			const xmlText = await notesFile.async('text');
			const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
			const rows = xml.getElementsByTagName('row');
			const parsed = [];
			for(let i=1;i<rows.length;i++){
				const cells = rows[i].getElementsByTagName('c');
				if (cells.length >= 4){
					const text = cells[2]?.getElementsByTagName('t')[0]?.textContent || '';
					const fname = cells[3]?.getElementsByTagName('t')[0]?.textContent || '';
					const item = { text, filename: fname };
					if (fname && filesMap[fname]) item.file = filesMap[fname];
					parsed.push(item);
				}
			}

			// nadpisujemy bazę – jak w starym pliku
			const clearTx = db.transaction(['notatki'],'readwrite');
			clearTx.objectStore('notatki').clear().onsuccess = ()=>{
				const addTx = db.transaction(['notatki'],'readwrite');
				const os = addTx.objectStore('notatki');
				let addedNotes = 0, addedFiles = 0;
				for (const p of parsed){
					const n = {
						text: p.text||'',
						file: p.file||null,
						filename: p.filename||'',
						filetype: p.filetype||'',
						createdAt: Date.now()
					};
					if (p.file) addedFiles++;
					os.add(n); addedNotes++;
				}
				addTx.oncomplete = ()=>{
					renderList();
					showDialog(`ZAIMPORTOWANO ${addedNotes} NOTATEK (W TYM ${addedFiles} Z ZAŁĄCZNIKAMI) Z ARCHIWUM ZIP!`);
					inpImport.value = '';
				};
			};
		}catch(err){
			showDialog('BŁĄD IMPORTU: ' + err.message);
			inpImport.value = '';
		}
	});

	/* ====== Zachowanie paska formatowania nowej notatki ====== */
	document.querySelectorAll('#notatnik-formatowanie-nowa .NOTATNIK_BTN_F').forEach(()=>{});
	editor.addEventListener('focus', ()=>{ panelNew.style.display='flex'; });
	editor.addEventListener('blur', ()=>{
		setTimeout(()=>{ if (!panelNew.contains(document.activeElement)) panelNew.style.display='none'; }, 200);
	});

	/* ====== Inicjalizacja ====== */
	window.addEventListener('load', renderList);
})();
