const CACHE_NAME = 'servichile-v54';
const ASSETS = [
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
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  if (request.url.startsWith('http') === false) {
    return;
  }

  const url = new URL(request.url);

  // Solo se cachean archivos de la propia app. Las respuestas de la API otro origen o con sesion
  // contienen datos personales y nunca se guardan en el dispositivo.
  if (url.origin !== self.location.origin || request.headers.has('Authorization')) {
    return;
  }

  // HTML y JS siempre de red: evita onboarding/perfil viejos por caché del SW.
  const path = url.pathname;
  if (
    path.endsWith('.js') ||
    path.endsWith('.html') ||
    path.endsWith('/') ||
    path.endsWith('/onboarding') ||
    path.endsWith('/onboarding/')
  ) {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match(request);
      })
    );
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
