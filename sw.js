var CACHE = 'horas-extras-v3';
var ARCHIVOS = ['index.html', 'trabajador.html', 'admin.html', 'styles.css', 'api.js', 'logo.js', 'icon.svg', 'manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ARCHIVOS); }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.indexOf('script.google.com') >= 0) return;
  e.respondWith(
    caches.match(e.request).then(function(cached) { return cached || fetch(e.request); })
  );
});
