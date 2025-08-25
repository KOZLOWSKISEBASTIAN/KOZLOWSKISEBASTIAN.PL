(function(){
	const BASE="https://kozlowskisebastian.pl/GRAFIKA/";
	const ICON_H=44;
	const MIN_W=28;

	const MQ_MOBILE=window.matchMedia("(max-width: 1000px)");
	const IS_MOBILE=()=>MQ_MOBILE.matches;

	let rafId=0;
	let OBS_SUSPENDED=false;
	let RECALC_PENDING=false;
	let HOVER_LOCK=0;

	let resizeTimer=null, resizing=false;
	let lastW=window.innerWidth,lastH=window.innerHeight;

	function schedule(fn){if(rafId)return;rafId=requestAnimationFrame(()=>{rafId=0;fn();});}
	function scheduleRecalc(){if(OBS_SUSPENDED||RECALC_PENDING)return;RECALC_PENDING=true;requestAnimationFrame(()=>{RECALC_PENDING=false;recalcAllStable();});}
	function killAllFillers(){document.querySelectorAll(".PRZYCISK.PUSTY").forEach(n=>n.remove());}

	function finalizeAfterResize(){
		recalcAllStable();
		setTimeout(recalcAllStable,120);
		setTimeout(recalcAllStable,360);
		setTimeout(recalcAllStable,800);
		if("requestIdleCallback" in window){requestIdleCallback(()=>recalcAllStable(),{timeout:1200});}
	}

	function onResize(){
		if(IS_MOBILE())return;
		const w=window.innerWidth,h=window.innerHeight;
		const jumped=(Math.abs(w-lastW)>200||Math.abs(h-lastH)>200);
		lastW=w;lastH=h;

		if(!resizing){resizing=true;document.body.setAttribute("data-resizing","");}
		killAllFillers();

		if(resizeTimer)clearTimeout(resizeTimer);
		resizeTimer=setTimeout(()=>{
			resizing=false;
			document.body.removeAttribute("data-resizing");
			finalizeAfterResize();
		}, jumped?120:180);
	}

	function measureLines(items){
		const lines=[],sig=[];let top=null,line=[];
		items.forEach(el=>{
			const t=Math.round(el.getBoundingClientRect().top);
			if(top===null||Math.abs(t-top)<=1){top=top??t;line.push(el);sig.push(lines.length);}
			else{lines.push(line);line=[el];top=t;sig.push(lines.length);}
		});
		if(line.length)lines.push(line);
		return{lines,signature:sig.join(",")};
	}

	function applyIcon(btn){
		let file=(btn.dataset.ikon||"").trim();if(!file)return;
		if(!/\.svg(\?|#|$)/i.test(file))file+=".svg";
		const url=BASE+encodeURIComponent(file);
		btn.textContent="";
		btn.style.setProperty("--mask",`url("${url}")`);
		const img=new Image();
		img.onload=()=>{const nh=img.naturalHeight||ICON_H,nw=img.naturalWidth||ICON_H;const w=Math.max(MIN_W,Math.round(ICON_H*(nw/nh)));btn.style.setProperty("--w",w+"px");btn.style.width=w+"px";scheduleRecalc();};
		img.onerror=()=>{btn.style.setProperty("--w",ICON_H+"px");btn.style.width=ICON_H+"px";scheduleRecalc();};
		img.src=url;
	}

	function lockHover(){HOVER_LOCK++;OBS_SUSPENDED=true;}
	function unlockHover(){if(HOVER_LOCK>0)HOVER_LOCK--;if(HOVER_LOCK===0){OBS_SUSPENDED=false;scheduleRecalc();}}
	function attachFillerHover(el){el.addEventListener("mouseenter",lockHover);el.addEventListener("mouseleave",unlockHover);}

	function rebuildRow(row){
		if(IS_MOBILE()||!row)return;

		row.querySelectorAll(".PRZYCISK.PUSTY").forEach(n=>n.remove());

		const icons=Array.from(row.children).filter(el=>el.classList.contains("PRZYCISK")&&!el.classList.contains("PUSTY"));
		if(!icons.length)return;

		const {lines}=measureLines(icons);

		lines.forEach(line=>{
			if(!line.length)return;
			const first=line[0];
			const last=line[line.length-1];

			const left=document.createElement(first.tagName.toLowerCase()==="a"?"a":"button");
			left.className="PRZYCISK PUSTY";
			left.setAttribute("aria-hidden","true");
			left.setAttribute("tabindex","-1");
			left.setAttribute("data-filler","1");
			attachFillerHover(left);
			first.before(left);

			const right=document.createElement(last.tagName.toLowerCase()==="a"?"a":"button");
			right.className="PRZYCISK PUSTY";
			right.setAttribute("aria-hidden","true");
			right.setAttribute("tabindex","-1");
			right.setAttribute("data-filler","1");
			attachFillerHover(right);
			last.after(right);
		});
	}

	function rebuildAll(){document.querySelectorAll(".ODSYLACZ_WIERSZ").forEach(rebuildRow);}

	function recalcAllStable(){
		if(IS_MOBILE()||OBS_SUSPENDED)return;
		let pass=0;OBS_SUSPENDED=true;
		function run(){rebuildAll();pass++;if(pass<3){requestAnimationFrame(run);}else{setTimeout(()=>{rebuildAll();OBS_SUSPENDED=false;},60);}}
		requestAnimationFrame(run);
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
		const cs=getComputedStyle(btn);
		const basePad=parseFloat(cs.paddingLeft)||0;
		const buttonLeft=btn.getBoundingClientRect().left;
		const contentLeft=getContentLeft(container);
		const delta=Math.round(buttonLeft-contentLeft);
		if(delta>0){btn.style.setProperty("margin-left",(-delta)+"px","important");btn.style.setProperty("padding-left",(basePad+delta)+"px","important");}
		else{btn.style.setProperty("margin-left","0px","important");btn.style.setProperty("padding-left",basePad+"px","important");}
	}
	function prepareMobile(){
		const btns=document.querySelectorAll(".PRZYCISK.ODSYLACZ_GRAFIKA");
		btns.forEach(textify);
		const doSnap=()=>{btns.forEach(stableSnap);};
		schedule(doSnap);
		if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>schedule(doSnap)).catch(()=>{});
		setTimeout(()=>schedule(doSnap),80);
		window.addEventListener("resize",onResize,{passive:true});
		if(window.visualViewport)visualViewport.addEventListener("resize",onResize);
	}

	function showToast(msg){
		try{const el=document.createElement("div");el.textContent=msg;el.style.cssText="position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#333;color:#fff;padding:10px 14px;border-radius:8px;font:12px/1.2 system-ui,sans-serif;opacity:0;transition:opacity .15s ease";document.body.appendChild(el);requestAnimationFrame(()=>{el.style.opacity="0.95";});setTimeout(()=>{el.style.opacity="0";setTimeout(()=>el.remove(),200);},1800);}catch(_){}}	
	function copyFallback(text){try{const ta=document.createElement("textarea");ta.value=text;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";ta.style.inset="0";document.body.appendChild(ta);ta.select();const ok=document.execCommand("copy");ta.remove();return ok;}catch{return false;}}
	async function copyToClipboard(text){try{await navigator.clipboard.writeText(text);return true;}catch{return copyFallback(text);}}
	let blankCooldown=false;function openBlankOnce(){if(blankCooldown)return null;blankCooldown=true;const w=window.open("about:blank","_blank","noopener");setTimeout(()=>{blankCooldown=false;},400);return w;}
	async function handleChromeScheme(href){const ok=await copyToClipboard(href);showToast(ok?"Skopiowano – wklej w nowej karcie.":"Nie udało się skopiować – wklej ręcznie.");openBlankOnce();}

	function initClickHandlers(){
		document.addEventListener("click",e=>{const filler=e.target.closest(".PRZYCISK.PUSTY");if(filler){e.preventDefault();e.stopPropagation();}},{capture:true});
		document.addEventListener("click",e=>{const a=e.target.closest("a");if(!a)return;const href=a.getAttribute("href")||"";if(/^chrome:\/\//i.test(href)){e.preventDefault();handleChromeScheme(href);}},{passive:false});
		document.addEventListener("click",e=>{
			const btn=e.target.closest("[data-open-all]");if(!btn)return;
			e.preventDefault();
			const row=btn.closest(".ODSYLACZ_WIERSZ");if(!row)return;
			const links=Array.from(row.querySelectorAll("a.PRZYCISK.ODSYLACZ_GRAFIKA")).filter(a=>!a.classList.contains("OTWORZ"));
			links.forEach((a,i)=>{const href=a.getAttribute("href")||"";setTimeout(()=>{if(/^chrome:\/\//i.test(href))handleChromeScheme(href);else window.open(href,"_blank","noopener");},i*120);});
		});
	}

	let roRows,roList,moList;
	function ensureObservers(){
		const list=document.querySelector(".ODSYLACZ_LISTA-WIERSZY");
		const rows=Array.from(document.querySelectorAll(".ODSYLACZ_WIERSZ"));
		if(!roRows){roRows=new ResizeObserver(()=>{if(!OBS_SUSPENDED) scheduleRecalc();});}
		rows.forEach(r=>roRows.observe(r));
		if(!roList){roList=new ResizeObserver(()=>{if(!OBS_SUSPENDED) scheduleRecalc();});if(list)roList.observe(list);}
		if(!moList&&list){
			moList=new MutationObserver(muts=>{if(OBS_SUSPENDED)return;for(const m of muts){if(m.type==="childList"){scheduleRecalc();break;}}});
			moList.observe(list,{childList:true,subtree:true});
		}
		window.addEventListener("fullscreenchange",finalizeAfterResize);
		document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible") finalizeAfterResize();});
		window.addEventListener("focus",finalizeAfterResize);
		window.addEventListener("pageshow",finalizeAfterResize);
	}

	function prepareDesktop(){
		document.querySelectorAll(".PRZYCISK.ODSYLACZ_GRAFIKA").forEach(applyIcon);
		recalcAllStable();
	}

	function sync(){if(IS_MOBILE())prepareMobile();else{prepareDesktop();ensureObservers();}}
	function bind(){
		const relayout=()=>sync();
		MQ_MOBILE.addEventListener?MQ_MOBILE.addEventListener("change",relayout):MQ_MOBILE.addListener(relayout);
		window.addEventListener("resize",onResize,{passive:true});
		window.addEventListener("orientationchange",onResize);
		if(window.visualViewport)visualViewport.addEventListener("resize",onResize);
		if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>scheduleRecalc()).catch(()=>{});
	}

	function init(){
		sync();bind();ensureObservers();initClickHandlers();
		recalcAllStable();
		window.addEventListener("load",()=>recalcAllStable());
		setTimeout(()=>recalcAllStable(),80);
	}

	if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
