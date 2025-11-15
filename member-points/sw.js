const CACHE_NAME = 'member-points-v1.0';

self.addEventListener('install', event => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('离线模式');
    })
  );
});