(function(){
	'use strict';
	const ORIGIN='https://kozlowskisebastian.pl';
	const CACHE_NAME='KOZLOWSKISEBASTIANKARTY';
	const TTL_MS=14*24*60*60*1000;
	const URL_INDEX=ORIGIN+'/KARTY/index.html';
	const BASE_PNG=ORIGIN+'/GRAFIKA/KARTY/';
	const CORE=[
		URL_INDEX,
		ORIGIN+'/CSS/HEXAGON.css',
		ORIGIN+'/CSS/KOLORY.css',
		ORIGIN+'/CSS/PRZYBORNIK.css',
		ORIGIN+'/CSS/KARTY.css',
		ORIGIN+'/JS/HEXAGON.js',
		ORIGIN+'/JS/MOTYWAUTO.js',
		ORIGIN+'/JS/PRZYBORNIK.js',
		ORIGIN+'/JS/KARTY.js',
		ORIGIN+'/JS/KARTYPAMIEC.js'
	];
	if(location.search.includes('v=PUSTO')&&'serviceWorker'in navigator){
		navigator.serviceWorker.ready.then(reg=>{
			reg.active?.postMessage({type:'FORCE_CLEAR'});
			alert('Cache wyczyszczony.');
		});
	}
	if('serviceWorker'in navigator){
		const swCode=`
			const CACHE_NAME='${CACHE_NAME}';
			const BASE_PNG='${BASE_PNG}';
			const URL_INDEX='${URL_INDEX}';
			const LAST_KEY='__lastClean';
			const TTL_MS=${TTL_MS};
			self.addEventListener('install',e=>{self.skipWaiting()});
			self.addEventListener('activate',e=>{
				e.waitUntil((async()=>{
					const names=await caches.keys();
					await Promise.all(names.map(n=>n===CACHE_NAME?null:caches.delete(n)));
					await cleanupIfExpired();
					await self.clients.claim();
				})());
			});
			self.addEventListener('message',async(event)=>{
				const data=event.data||{};
				const cache=await caches.open(CACHE_NAME);
				if(data.type==='PRECACHE_ALL'){
					const urls=uniq((data.urls||[]).filter(Boolean));
					for(const u of urls){await safePut(cache,u)}
					await stampNow(cache);
				}
				if(data.type==='CHECK_CLEANUP'){
					await cleanupIfExpired();
				}
				if(data.type==='FORCE_CLEAR'){
					await caches.delete(CACHE_NAME);
					const fresh=await caches.open(CACHE_NAME);
					await stampNow(fresh);
				}
			});
			self.addEventListener('fetch',event=>{
				const req=event.request;
				if(req.method!=='GET')return;
				const url=new URL(req.url);
				if(url.href.startsWith(BASE_PNG)){
					event.respondWith(cacheFirst(req));
					return;
				}
				if(req.mode==='navigate'){
					event.respondWith((async()=>{
						const cache=await caches.open(CACHE_NAME);
						const cached=await cache.match(req);
						if(cached){
							fetchAndUpdate(cache,req).catch(()=>{});
							return cached;
						}
						try{
							const net=await fetch(req);
							if(okish(net))await cache.put(req,net.clone());
							return net;
						}catch{
							const fallback=await cache.match(URL_INDEX);
							return fallback||new Response('Offline',{status:503});
						}
					})());
					return;
				}
				if(url.origin===location.origin){
					event.respondWith(cacheFirst(req,true));
					return;
				}
			});
			async function cacheFirst(request,revalidate=false){
				const cache=await caches.open(CACHE_NAME);
				const cached=await cache.match(request);
				if(cached){
					if(revalidate)fetchAndUpdate(cache,request).catch(()=>{});
					return cached;
				}
				try{
					const net=await fetch(request);
					if(okish(net))await cache.put(request,net.clone());
					return net;
				}catch{
					return new Response('Offline i brak w cache',{status:503});
				}
			}
			async function fetchAndUpdate(cache,request){
				const req=typeof request==='string'?new Request(request):request;
				try{
					const net=await fetch(req,{cache:'reload'});
					if(okish(net))await cache.put(req,net.clone());
				}catch{}
			}
			function okish(resp){return resp&&(resp.ok||resp.type==='opaque')}
			function uniq(arr){return Array.from(new Set(arr))}
			async function safePut(cache,url){
				try{
					const resp=await fetch(url,{cache:'reload'});
					if(okish(resp))await cache.put(url,resp.clone());
				}catch{}
			}
			async function stampNow(cache){
				try{await cache.put(LAST_KEY,new Response(String(Date.now())))}catch{}
			}
			async function readLast(cache){
				try{
					const r=await cache.match(LAST_KEY);
					if(!r)return 0;
					const t=parseInt(await r.text(),10);
					return Number.isFinite(t)?t:0;
				}catch{return 0}
			}
			async function cleanupIfExpired(){
				const cache=await caches.open(CACHE_NAME);
				const last=await readLast(cache);
				const now=Date.now();
				if(!last||(now-last)>TTL_MS){
					await caches.delete(CACHE_NAME);
					const fresh=await caches.open(CACHE_NAME);
					await stampNow(fresh);
				}
			}
		`;
		const blobUrl=URL.createObjectURL(new Blob([swCode],{type:'application/javascript'}));
		navigator.serviceWorker.register(blobUrl,{scope:'./'})
			.then(()=>navigator.serviceWorker.ready)
			.then(reg=>{
				const urls=new Set(CORE);
				try{
					const list=document.getElementById('KARTY_LISTA');
					if(list){
						const pngs=Array.from(list.querySelectorAll('li[data-grupa="KARTY_PODSTAWOWE"] a.PRZYCISK_ODSYLACZ'))
							.map(a=>a.getAttribute('data-image')).filter(Boolean);
						pngs.forEach(u=>urls.add(u));
					}
				}catch{}
				reg.active?.postMessage({type:'PRECACHE_ALL',urls:Array.from(urls)});
				reg.active?.postMessage({type:'CHECK_CLEANUP'});
			})
			.catch(()=>{});
	}
})();