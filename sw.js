const CACHE_NAME = 'servicia-v14';
const ASSETS = [
  './',
  './index.html',
  './onboarding/',
  './onboarding/index.html',
  './css/styles.css',
  './js/data/categorias.js',
  './js/core/security.js',
  './js/compliance.js',
  './js/core/auth.js',
  './js/services/api.js',
  './js/modules/history.js',
  './js/app.js',
  './js/onboarding.js',
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

  // Solo se cachean archivos de la propia app. Las respuestas de la API (otro origen o con sesión)
  // contienen datos personales y nunca se guardan en el dispositivo.
  if (new URL(request.url).origin !== self.location.origin || request.headers.has('Authorization')) {
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
