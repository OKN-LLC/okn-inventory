// OKN在庫管理 Service Worker v1.3
const CACHE = 'okn-inventory-v4';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(url => fetch(url, { cache: 'reload' }).then(res => c.put(url, res))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // APIリクエスト（script.google.com）はキャッシュしない
  if (e.request.url.includes('script.google.com')) return;

  // ページ本体（HTML）はネット優先：更新がすぐ反映されるように
  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
