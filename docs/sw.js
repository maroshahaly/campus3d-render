const V='sayad-SYD-20261004-C55342F0',TILES='sayad-tiles-v1',CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const TILE_HOSTS=/(server\.arcgisonline\.com)$/;
const TILE_CAP=600; /* أقصى عدد بلاطات خريطة محفوظة، لمنع تضخّم التخزين */
async function trimTiles(){const c=await caches.open(TILES),ks=await c.keys();if(ks.length>TILE_CAP)for(const k of ks.slice(0,ks.length-TILE_CAP))await c.delete(k);}
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(x=>new Request(x,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return; const u=new URL(r.url);
  if(u.hostname.endsWith('open-meteo.com'))return;              /* التوقعات الحية: بدون تخزين هنا */
  if(TILE_HOSTS.test(u.hostname)){                               /* بلاطات الخريطة الحقيقية وصور الأقمار الصناعية: تُحفظ لتظهر بلا إنترنت لاحقًا */
    e.respondWith(caches.open(TILES).then(c=>c.match(r).then(h=>{
      const n=fetch(r).then(x=>{ if(x&&x.ok) c.put(r,x.clone()).then(trimTiles); return x; }).catch(()=>h);
      return h||n;
    })));
    return;
  }
  if(/version\.json$/.test(u.pathname)){e.respondWith(fetch(r,{cache:'no-store'}));return}  /* رقم النسخة دايمًا من الإنترنت */
  if(u.origin===location.origin){e.respondWith(caches.match(r,{ignoreSearch:true}).then(h=>h||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x}).catch(()=>caches.match('index.html'))));return}
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){e.respondWith(caches.open(V).then(c=>c.match(r).then(h=>{const n=fetch(r).then(x=>{c.put(r,x.clone());return x}).catch(()=>h);return h||n})))}
});
/* إشعارات «هل تعرف؟»: الصفحة بتحفظ دفعة معلومات في الكاش، والعامل بيعرض واحدة يوميًا (تزامن دوري) */
async function factNote(){const c=await caches.open('sayad-facts'),r=await c.match('facts.json');if(!r)return;const d=await r.json();const L=d.f||[];if(!L.length)return;const i=(d.i||0)%L.length;d.i=i+1;await c.put('facts.json',new Response(JSON.stringify(d)));
  return self.registration.showNotification('🤔 هل تعرف؟ — الصنّارة',{body:L[i],icon:'icon-192.png',badge:'icon-192.png',tag:'sayad-fact',lang:'ar',dir:'rtl',data:{u:'./index.html'}});}
self.addEventListener('periodicsync',e=>{if(e.tag==='sayad-fact')e.waitUntil(factNote())});
self.addEventListener('message',e=>{if(e.data==='sayad-fact-now')e.waitUntil(factNote())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(w=>w.length?w[0].focus():clients.openWindow('./index.html')))});
