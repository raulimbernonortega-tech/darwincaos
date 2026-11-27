// «Ayudante» de la app instalable (service worker): guarda la app en el móvil para que abra al
// instante y funcione sin cobertura. Lo que cambia (noticias, vídeos, órbitas) se pide primero a
// internet y, si no hay conexión, se usa lo último guardado.
const VERSION = '1.8';
const CACHE = `planetario-${VERSION}`;
// Lo imprescindible para arrancar sin conexión
const CORE = [
  './', 'index.html', 'manifest.webmanifest', `app.js?v=${VERSION}`, `objeto.js?v=${VERSION}`, `satelites.js?v=${VERSION}`,
  `vendor/three.module.min.js`, `vendor/astronomy.browser.min.js?v=${VERSION}`, `vendor/satellite.min.js?v=${VERSION}`, `vendor/geomag.min.js?v=${VERSION}`,
  'vendor/addons/GLTFLoader.js', 'vendor/addons/utils/BufferGeometryUtils.js', 'vendor/addons/libs/meshopt_decoder.module.js',
  `data/cielo.json?v=${VERSION}`, `data/descripciones.json?v=${VERSION}`, `data/mitologia.json?v=${VERSION}`,
  'img/logo.png', 'img/icons/icon-192.png', 'img/icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('planetario-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const DYNAMIC = /data\/(eventos|satelites)\.json|starlink\.tle|sol-hoy\.jpg|api\.open-meteo\.com\/v1\/forecast|wheretheiss|celestrak/; // (la búsqueda de ciudades va directa)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  // Datos que cambian y la propia página: primero internet; sin conexión, lo guardado
  if (req.mode === 'navigate' || DYNAMIC.test(url.href)) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  // Resto de archivos de la app (código, texturas, modelos 3D, ilustraciones): lo guardado y, si no está, se descarga y se guarda
  if (same) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
