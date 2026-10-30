const CACHE_NAME = 'servicia-v7';
const ASSETS = [
  './',
  './index.html',
  './onboarding/',
  './onboarding/index.html',
  './css/styles.css',
  './js/app.js',
  './js/compliance.js',
  './js/security.js',
  './js/auth.js',
  './js/history.js',
  './js/onboarding.js',
  './js/data/categorias.js',
  './js/core/security.js',
  './js/core/auth.js',
  './js/services/api.js',
  './js/modules/history.js',
  './js/modules/convenios.js',
  './js/modules/referidos.js',
  './js/modules/planes.js',
  './js/modules/demo.js',
  './demo/',
  './demo/index.html',
  './panel/',
  './panel/index.html',
  './panel/panel.js',
  './panel/panel.css',
  './manifest.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).catch(function () {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) {
          return name !== CACHE_NAME;
        }).map(function (name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  if (request.url.startsWith('http') === false) {
    return;
  }

  event.respondWith(
    fetch(request).then(function (response) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, clone);
      }).catch(function () {});
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
