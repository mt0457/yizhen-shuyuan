// Service Worker for 仪贞书院
const CACHE_NAME = 'yizhen-v519';
const ASSETS = [
  './',
  './index.html',
  './仪贞书院.html',
  './styles.css',
  './favicon.svg',
  './_covers.js',
  './_api.js',
  './_zhouyi.js',
  './_daodejing.js',
  './manifest.json'
];

// Install: cache core assets only (not all books)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all(ASSETS.map(function(url) {
        return cache.add(url).catch(function(err) {
          console.warn('SW: failed to cache ' + url, err);
        });
      }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches, keep current
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.action === 'clear-cache') {
    event.waitUntil(
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(key) { return caches.delete(key); }));
      }).then(function() {
        return self.clients.matchAll().then(function(clients) {
          clients.forEach(function(c) { c.postMessage({ action: 'cache-cleared' }); });
        });
      })
    );
  }
});

// Fetch: network-first for HTML, cache-first for others
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip browser-sync and chrome-extension
  if (url.pathname.indexOf('browser-sync') !== -1) return;
  if (url.protocol === 'chrome-extension:') return;

  // Skip Supabase API calls (don't cache auth/database requests)
  if (url.hostname.endsWith('.supabase.co')) return;
  // Skip CDN script updates
  if (url.hostname === 'cdn.jsdelivr.net') return;

  // HTML: network first, fallback to cache
  if (event.request.headers.get('accept') && event.request.headers.get('accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request).then(function(r) {
            return r || caches.match('./仪贞书院.html');
          });
        })
    );
    return;
  }

  // Everything else: cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var fetched = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached || new Response('Offline', { status: 503 });
      });
      return cached || fetched;
    })
  );
});
