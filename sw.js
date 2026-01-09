const CACHE = 'dart-pwa-debug-v1';
const CORE = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});
self.addEventListener('activate', e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(k=>k===CACHE?null:caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')){
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const fresh=await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      }catch(err){
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req,{ignoreSearch:true});
    if(cached) return cached;
    const fresh=await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  })());
});