// Service Worker for 仪贞书院
const CACHE_NAME = 'yizhen-v510';
const ASSETS = [
  './',
  './index.html',
  './仪贞书院.html',
  './styles.css',
  './favicon.svg',
  './_covers.js',
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
  './_guoqinlun.js',
  './_diaoquyuanfu.js',
  './_zixufu.js',
  './_shanglinfu.js',
  './_hanshu.js',
  './_kongquedongnanfei.js',
  './_gushishijiushou.js',
  './_caocaoshiji.js',
  './_caozhishiji.js',
  './_caopiji.js',
  './_chushibiao.js',
  './_yushanjuyuanjuejiaoshu.js',
  './_yonghuaishi.js',
  './_taoyuanmingji.js',
  './_soushenji.js',
  './_shishuoxinyu.js',
  './_wenxindiaolong.js',
  './_mengxibitan.js',
  './_mazhiyuanji.js',
  './_baipuji.js',
  './_zhengguangzuji.js',
  './_wangshifuji.js',
  './_zhangyanghaoji.js',
  './_wangmianji.js',
  './_yuanhaowenji.js',
  './_sadulaji.js',
  './_liujiji.js',
  './_songlianji.js',
  './_yuqianji.js',
  './_yangshenji.js',
  './_guiyouguangji.js',
  './_xuwei_huishengyaun.js',
  './_tangxianzuji.js',
  './_lizhiji.js',
  './_yuanhongdaoji.js',
  './_fengmenglongji.js',
  './_xuxiakeji.js',
  './_bencaogangmu.js',
  './_tiangongkaiwu.js',
  './_yongledadian.js',
  './_zengguofanjia书.js',
  './_zhugeliang_jiezi书.js',
  './_luyou_jiaxun.js',
  './_zhengbanqiao_jia书.js',
  './_yanshijiaxun.js',
  './_houhanshu.js',
  './_sanguozhi.js',
  './_shuijingzhu.js',
  './_mulan.js',
  './_wangboji.js',
  './_yangjiongji.js',
  './_luzhaolinji.js',
  './_luobinwangji.js',
  './_chenziangji.js',
  './_wangweiji.js',
  './_menghaoranji.js',
  './_gaoshiji.js',
  './_censhenji.js',
  './_wangchanglingji.js',
  './_wangzhihuanji.js',
  './_libaiji.js',
  './_dufuji.js',
  './_hanyuji.js',
  './_liuzongyuanji.js',
  './_baijuyiji.js',
  './_liuyuxiji.js',
  './_mengjiaoji.js',
  './_liheji.js',
  './_lishangyinji.js',
  './_dumuji.js',
  './_liyuji.js',
  './_liuyongji.js',
  './_yanshuji.js',
  './_ouyangxiuji.js',
  './_wanganshiji.js',
  './_sushiji.js',
  './_suxunji.js',
  './_suzheji.js',
  './_zenggongji.js',
  './_qinguanji.js',
  './_liqingzhaoji.js',
  './_luyouji.js',
  './_xinqijiji.js',
  './_fanzhongyanji.js',
  './_zizhitongjian.js',
  './_yehangchuan.js',
  './_zixiayizhuan.js',
  './_guanhanqingji.js',
  './_qianziwen.js',
  './_weishengji.js',
  './_huangshigong_zhouyizhu.js',
  './_jiaoyanshou_yilin_shangjing.js',
  './_jiaoyanshou_yilin_xiajing.js',
  './_jingfang_jingshiyizhuan.js',
  './_zhengxuan_zhouyizhu.js',
  './_wangbi_zhouyizhu.js',
  './_hankangbo_zhouyizhu.js',
  './_kongyingda_zhouyizhengyi.js',
  './_lidingzuo_zhouyijijie.js',
  './_chengyi_zhouyichengshizhuan.js',
  './_shaoyong_huangjijingshi.js',
  './_zhuzhen_hanshangyizhuan.js',
  './_zhuxi_zhouyibenyi.js',
  './_yangwanli_chengzhaiyizhuan.js',
  './_wangfuzhi_zhouyiwaizhuan.js',
  './_wangfuzhi_zhouyineizhuan.js',
  './_laizhide_zhouyiwaizhuan.js',
  './_laizhide_zhouyijizhu.js',
  './_liguangdi_zhouyizhezhong.js',
  './_liguangdi_zhouyiguantui.js',
  './_huidong_zhouyishu.js',
  './_lidaoping_zhouyijijiezuanshu.js',
  './_huangzongxi_yixuexiangshulun.js',
  './_zeng_data.js',
  './manifest.json'
];

// Install: cache core assets
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

// Activate: clean ALL old caches, then notify clients to refresh
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) { return caches.delete(key); }));
    }).then(function() {
      // Notify all clients to refresh so they get the new files
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ action: 'sw-updated' });
        });
      });
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
  // Skip CDN script updates (let browser cache handle them)
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
