// Caches only the app shell so the site opens fast. API calls and audio are never cached.
var CACHE = 'ytunes-shell-v8';
var SHELL = ['./', 'style.css', 'app.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || r.url.indexOf('/api/') !== -1 || r.url.indexOf('/auth/') !== -1) return;
  e.respondWith(fetch(r).then(function (res) {
    var copy = res.clone();
    if (res.ok && new URL(r.url).origin === location.origin) caches.open(CACHE).then(function (c) { c.put(r, copy); });
    return res;
  }).catch(function () { return caches.match(r); }));
});
