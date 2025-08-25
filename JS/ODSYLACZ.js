(function(){
	const BASE="https://kozlowskisebastian.pl/GRAFIKA/";
	const ICON_H=44;
	const MIN_W=28;

	const MQ_MOBILE=window.matchMedia("(max-width: 1000px)");
	const IS_MOBILE=()=>MQ_MOBILE.matches;

	const EPS=1;
	let rafId=0;
	let blankCooldown=false;

	function schedule(fn){if(rafId)return;rafId=requestAnimationFrame(()=>{rafId=0;fn();});}
	function getGapPx(row){const cs=getComputedStyle(row);return Math.max(0,parseFloat(cs.columnGap||cs.gap||"7")||7);}
	function rowEdges(row){const r=row.getBoundingClientRect(),cs=getComputedStyle(row);const L=r.left+(parseFloat(cs.borderLeftWidth)||0)+(parseFloat(cs.paddingLeft)||0);const R=r.right-(parseFloat(cs.borderRightWidth)||0)-(parseFloat(cs.paddingRight)||0);return{L,R};}
	function measureLines(items){
		const lines=[],sig=[];let top=null,buf=[];
		items.forEach(el=>{
			const t=Math.round(el.getBoundingClientRect().top);
			if(top===null||Math.abs(t-top)<=1){top=top??t;buf.push(el);sig.push(lines.length);}
			else{lines.push(buf);buf=[el];top=t;sig.push(lines.length);}
		});
		if(buf.length)lines.push(buf);
		return {lines,signature:sig.join(",")};
	}

	function applyIcon(btn){
		let file=(btn.dataset.ikon||"").trim();if(!file)return;
		if(!/\.svg(\?|#|$)/i.test(file))file+=".svg";
		const url=BASE+encodeURIComponent(file);
		btn.textContent="";
		btn.style.setProperty("--mask",`url("${url}")`);
		const img=new Image();
		img.onload=()=>{const nh=img.naturalHeight||ICON_H,nw=img.naturalWidth||ICON_H;const w=Math.max(MIN_W,Math.round(ICON_H*(nw/nh)));btn.style.setProperty("--w",w+"px");btn.style.width=w+"px";const row=btn.closest(".ODSYLACZ_WIERSZ");if(row)schedule(()=>rebuildFillersForRow(row));};
		img.onerror=()=>{btn.style.setProperty("--w",ICON_H+"px");btn.style.width=ICON_H+"px";const row=btn.closest(".ODSYLACZ_WIERSZ");if(row)schedule(()=>rebuildFillersForRow(row));};
		img.src=url;
	}

	function blockFillerClick(el){
		el.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();},{capture:true});
	}
	function hookFillerHover(el){
		if(!el.querySelector("span")){const s=document.createElement("span");el.appendChild(s);}
		el.addEventListener("mouseenter",()=>{el.classList.add("HOV");});
		el.addEventListener("mouseleave",()=>{el.classList.remove("HOV");});
	}

	function trackHoverOnRow(row){
		if(row._hovBound)return;
		row._hovBound=true;
		row.addEventListener("mousemove",e=>{
			if(IS_MOBILE())return;
			const fillers=Array.from(row.querySelectorAll(".PRZYCISK.PUSTY"));
			if(!fillers.length)return;
			const x=e.clientX,y=e.clientY;
			let hit=null;
			for(const f of fillers){
				const r=f.getBoundingClientRect();
				if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){hit=f;break;}
			}
			for(const f of fillers){if(f!==hit)f.classList.remove("HOV");}
			if(hit)hit.classList.add("HOV");
		});
		row.addEventListener("mouseleave",()=>{row.querySelectorAll(".PRZYCISK.PUSTY.HOV").forEach(n=>n.classList.remove("HOV"));});
	}

	function rebuildFillersForRow(row){
		if(IS_MOBILE()||!row)return;
		row.querySelectorAll(".PRZYCISK.PUSTY").forEach(n=>n.remove());

		const gap=getGapPx(row);
		const {R:rowR}=rowEdges(row);
		const icons=Array.from(row.children).filter(el=>el.classList.contains("PRZYCISK")&&!el.classList.contains("PUSTY"));
		if(!icons.length)return;

		for(let pass=0;pass<2;pass++){
			const {lines}=measureLines(icons);
			lines.forEach(line=>{
				const last=line[line.length-1];
				const lastR=last.getBoundingClientRect().right;
				const freeR=Math.round(rowR-lastR);
				const need=Math.max(0,freeR-gap);
				if(need>EPS){
					const tag=line[0].tagName.toLowerCase();
					const filler=document.createElement(tag==="a"?"a":"button");
					filler.className="PRZYCISK PUSTY";
					filler.setAttribute("aria-hidden","true");
					filler.setAttribute("tabindex","-1");
					filler.style.width=need+"px";
					filler.style.pointerEvents="auto";
					blockFillerClick(filler);
					hookFillerHover(filler);
					line[0].before(filler);
				}
			});
		}
		trackHoverOnRow(row);
	}

	function adjustAllRows(){document.querySelectorAll(".ODSYLACZ_WIERSZ").forEach(rebuildFillersForRow);}

	function prepareDesktop(){
		document.querySelectorAll(".PRZYCISK.ODSYLACZ_GRAFIKA").forEach(btn=>{
			btn.style.removeProperty("margin-left");
			btn.style.removeProperty("padding-left");
			btn.style.removeProperty("padding-right");
			btn.style.removeProperty("text-align");
			btn.style.removeProperty("width");
			btn.style.removeProperty("WebkitMaskImage");
			btn.style.removeProperty("maskImage");
			btn.style.removeProperty("backgroundImage");
			btn.style.removeProperty("display");
			applyIcon(btn);
		});
		schedule(adjustAllRows);
	}

	function getContainer(){return document.querySelector(".PANEL")||document.querySelector(".KONTENER")||document.querySelector(".RAMKA")||document.body;}
	function getContentLeft(el){const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.left+(parseFloat(cs.borderLeftWidth)||0)+(parseFloat(cs.paddingLeft)||0);}
	function textify(btn){
		let label=btn.getAttribute("aria-label")||btn.dataset.label||"";
		if(!label){const href=btn.getAttribute("href")||"";try{label=new URL(href).hostname.replace(/^www\./,"");}catch{label="LINK";}}
		btn.textContent=label;
		btn.style.removeProperty("--mask");
		btn.style.removeProperty("--w");
		btn.style.removeProperty("width");
		btn.style.webkitMaskImage="none";
		btn.style.maskImage="none";
		btn.style.backgroundImage="none";
		btn.style.marginLeft="0px";
		btn.style.paddingRight="0px";
		btn.style.removeProperty("padding-left");
		btn.style.width="100%";
		btn.style.textAlign="left";
	}
	function stableSnap(btn){
		const container=getContainer();
		btn.style.marginLeft="0px";
		btn.style.removeProperty("padding-left");
		const basePad=parseFloat(getComputedStyle(btn).paddingLeft)||0;
		const buttonLeft=btn.getBoundingClientRect().left;
		const contentLeft=getContentLeft(container);
		const delta=Math.round(buttonLeft-contentLeft);
		if(delta>0){btn.style.marginLeft=(-delta)+"px";btn.style.paddingLeft=(basePad+delta)+"px";}
		else{btn.style.marginLeft="0px";btn.style.paddingLeft=basePad+"px";}
	}
	function prepareMobile(){
		const btns=document.querySelectorAll(".PRZYCISK.ODSYLACZ_GRAFIKA");
		btns.forEach(textify);
		const doSnap=()=>{btns.forEach(stableSnap);};
		schedule(doSnap);
		if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>schedule(doSnap)).catch(()=>{});
		setTimeout(()=>schedule(doSnap),80);
	}

	function showToast(msg){
		try{
			const el=document.createElement("div");
			el.textContent=msg;
			el.style.cssText="position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#333;color:#fff;padding:10px 14px;border-radius:8px;font:12px/1.2 system-ui,sans-serif;opacity:0;transition:opacity .15s ease";
			document.body.appendChild(el);
			requestAnimationFrame(()=>{el.style.opacity="0.95";});
			setTimeout(()=>{el.style.opacity="0";setTimeout(()=>el.remove(),200);},1800);
		}catch(_){}
	}
	function copySyncFallback(text){
		try{
			const ta=document.createElement("textarea");
			ta.value=text;ta.setAttribute("readonly","");
			ta.style.position="fixed";ta.style.opacity="0";ta.style.inset="0";
			document.body.appendChild(ta);ta.select();
			const ok=document.execCommand("copy");
			ta.remove();
			return ok;
		}catch{return false;}
	}
	async function copyAsync(text){try{await navigator.clipboard.writeText(text);return true;}catch{return false;}}
	function openBlankOnce(){if(blankCooldown)return null;blankCooldown=true;const w=window.open("about:blank","_blank","noopener");setTimeout(()=>{blankCooldown=false;},400);return w;}
	async function handleChromeScheme(url,{openBlank=true}={}){let copied=copySyncFallback(url);if(!copied)copied=await copyAsync(url);showToast(copied?"Skopiowano – wklej w nowej karcie.":"Nie udało się skopiować (spróbuj ręcznie).");if(openBlank)openBlankOnce();}

	function initClickHandlers(){
		document.addEventListener("click",e=>{const filler=e.target.closest(".PRZYCISK.PUSTY");if(filler){e.preventDefault();e.stopPropagation();}},{capture:true});
		document.addEventListener("click",e=>{
			const btn=e.target.closest("[data-open-all]");if(!btn)return;
			e.preventDefault();
			const row=btn.closest(".ODSYLACZ_WIERSZ");if(!row)return;
			const links=Array.from(row.querySelectorAll("a.PRZYCISK.ODSYLACZ_GRAFIKA")).filter(a=>!a.classList.contains("OTWORZ"));
			links.forEach((a,i)=>{const href=a.getAttribute("href")||"";setTimeout(()=>{if(/^chrome:\/\//i.test(href))handleChromeScheme(href,{openBlank:true});else window.open(href,"_blank","noopener");},i*120);});
		});
		document.addEventListener("click",e=>{
			const a=e.target.closest("a");if(!a)return;
			const href=a.getAttribute("href")||"";if(!/^chrome:\/\//i.test(href))return;
			e.preventDefault();
			handleChromeScheme(href,{openBlank:true});
		},{passive:false});
	}

	let roRows,roList,moList;
	function ensureObservers(){
		const list=document.querySelector(".ODSYLACZ_LISTA-WIERSZY");
		const rows=Array.from(document.querySelectorAll(".ODSYLACZ_WIERSZ"));
		if(!roRows){roRows=new ResizeObserver(()=>schedule(adjustAllRows));}
		rows.forEach(r=>roRows.observe(r));
		if(!roList){roList=new ResizeObserver(()=>schedule(adjustAllRows));if(list)roList.observe(list);}
		if(!moList&&list){
			moList=new MutationObserver(muts=>{
				let needIcons=false;
				for(const m of muts){
					m.addedNodes&&m.addedNodes.forEach(n=>{
						if(n.nodeType===1){
							n.matches?.(".PRZYCISK.ODSYLACZ_GRAFIKA")&&(needIcons=true);
							n.querySelectorAll?.(".PRZYCISK.ODSYLACZ_GRAFIKA").forEach(()=>needIcons=true);
						}
					});
				}
				if(!IS_MOBILE()&&needIcons){document.querySelectorAll(".PRZYCISK.ODSYLACZ_GRAFIKA").forEach(applyIcon);}
				schedule(adjustAllRows);
			});
			moList.observe(list,{childList:true,subtree:true});
		}
	}

	function sync(){if(IS_MOBILE())prepareMobile();else{prepareDesktop();ensureObservers();}}
	function bind(){
		const relayout=()=>sync();
		MQ_MOBILE.addEventListener?MQ_MOBILE.addEventListener("change",relayout):MQ_MOBILE.addListener(relayout);
		window.addEventListener("resize",()=>schedule(adjustAllRows));
		window.addEventListener("orientationchange",relayout);
		if(window.visualViewport)visualViewport.addEventListener("resize",()=>schedule(adjustAllRows));
		if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>schedule(adjustAllRows)).catch(()=>{});
	}

	function init(){sync();bind();ensureObservers();initClickHandlers();}

	if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
