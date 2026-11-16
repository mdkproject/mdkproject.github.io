/* KTRL Room · modo sin conexión
   La página se pide primero a la red (para ver siempre lo último) y, si no hay señal, sale de la caché.
   Scripts, estilos y fuentes se sirven de la caché y se actualizan por detrás. */
var VERSION = 'ktrl-room-v1';
var SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/room.css',
  'js/logo.js', 'js/core.js', 'js/music.js', 'js/charts.js', 'js/pdf.js', 'js/dsp.js', 'js/poster.js', 'js/seed.js',
  'js/views/inicio.js', 'js/views/agenda.js', 'js/views/beats.js', 'js/views/analizar.js', 'js/views/licencias.js',
  'js/views/splits.js', 'js/views/set.js', 'js/views/tempo.js', 'js/views/eventos.js', 'js/views/afiches.js',
  'js/views/lanzamientos.js', 'js/views/textos.js', 'js/views/ajustes.js',
  'icons/icon-192.png', 'icons/icon-512.png', '../favicon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put('index.html', copy); });
      return res;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
