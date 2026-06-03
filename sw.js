// Service Worker for 仪贞书院
const CACHE_NAME = 'yizhen-v8';
const ASSETS = [
  './',
  './index.html',
  './_zhouyi.js',
  './_daodejing.js',
  './_huangdi_neijing.js',
  './_tongxuanzhenjing.js',
  './_sushu.js',
  './_jieexue.js',
  './_xiyouji.js',
  './_sanguoyanyi.js',
  './_shuihuzhuan.js',
  './_hongloumeng.js',
  './_shiji.js',
  './_zhuangzi.js',
  './_huainanzi.js',
  './_baopuzi.js',
  './_shijing.js',
  './_daxue.js',
  './_liji.js',
  './_zhouyicantongqi.js',
  './_yunjiqijian.js',
  './_caigentan.js',
  './_yinfujing.js',
  './_shanhaijing.js',
  './_ganshixingjing.js',
  './_shangshu.js',
  './_shiben.js',
  './_chunqiu.js',
  './_yuejing.js',
  './_lunyu.js',
  './_guoyu.js',
  './_zhanguoce.js',
  './_zhushujinian.js',
  './_mengzi.js',
  './_xunzi.js',
  './_zhouli.js',
  './_liezi.js',
  './_mozi.js',
  './_shangjunshu.js',
  './_hanfeizi.js',
  './_lizi.js',
  './_sunzibingfa.js',
  './_wuzibingfa.js',
  './_simafa.js',
  './_sunbinbingfa.js',
  './_weiliaozi.js',
  './_liutao.js',
  './_gongsunlongzi.js',
  './_yinwenzi.js',
  './_lushichunqiu.js',
  './_shennong.js',
  './_yelao.js',
  './_lianshan.js',
  './_guizang.js',
  './_lisao.js',
  './_jiuge.js',
  './_tianwen.js',
  './_jiuzhang.js',
  './_jiubian.js',
  './_boxue.js',
  './_cangjiepian.js',
  './_yuanlipian.js',
  './manifest.json'
];

// Install: cache core assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
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

// Fetch: network-first for HTML, cache-first for others
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip browser-sync and chrome-extension
  if (url.pathname.indexOf('browser-sync') !== -1) return;
  if (url.protocol === 'chrome-extension:') return;

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
            return r || caches.match('./index.html');
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
