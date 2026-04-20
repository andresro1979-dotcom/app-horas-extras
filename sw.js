self.addEventListener('install', e => e.waitUntil(
  caches.open('horas-v1').then(c => c.addAll([
    './index.html','./trabajador.html','./admin.html',
    './css/styles.css','./js/auth.js','./js/trabajador.js','./js/admin.js'
  ]))
));
self.addEventListener('fetch', e => e.respondWith(
  caches.match(e.request).then(r => r || fetch(e.request))
));