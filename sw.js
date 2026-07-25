/* 在庫管理 PWA — 最小サービスワーカー（アプリの骨組みだけキャッシュ） */
var CACHE = 'inv-shell-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function(){}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  /* API・Google・CDN は常にネットワーク（キャッシュしない） */
  if (e.request.method !== 'GET' ||
      url.indexOf('script.google.com') > -1 ||
      url.indexOf('googleusercontent.com') > -1 ||
      url.indexOf('accounts.google.com') > -1 ||
      url.indexOf('jsdelivr.net') > -1) {
    return; /* デフォルト（ネットワーク） */
  }
  /* アプリ本体はネットワーク優先、失敗時キャッシュ */
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match(e.request); })
  );
});
