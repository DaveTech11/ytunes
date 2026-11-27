/* Xyron service worker: shows admin broadcasts as phone/desktop notifications
   even when the site is closed, and opens the app when one is tapped. */
/* Speed: hashed build files (/assets/*) never change, so they are cached and reused.
   Pages try the network first and fall back to the last copy when the connection is bad.
   API calls, uploads, music/video streams and anything non-GET are never cached. */
const CACHE = "xyron-shell-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith("xyron-shell-") && k !== CACHE).map((k) => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/listen") || req.headers.has("range")) return;

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") cache.put("/__shell", res.clone());
        return res;
      } catch {
        return (await cache.match("/__shell")) || Response.error();
      }
    })());
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : "" }; }
  const title = data.title || "Xyron";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/popup/xyron-x.jpg",
      tag: data.id ? `broadcast-${data.id}` : undefined,
      data: { url: data.url || "/", id: data.id || "" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url = "/", id = "" } = event.notification.data || {};
  const target = new URL(url, self.location.origin);
  const sameOrigin = target.origin === self.location.origin;
  event.waitUntil((async () => {
    if (!sameOrigin) { await self.clients.openWindow(target.href); return; }
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = open.find((c) => new URL(c.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      existing.postMessage({ type: "xyron-notification-click", url: target.pathname + target.search + target.hash, id });
      return;
    }
    if (id) target.searchParams.set("bc", id);
    await self.clients.openWindow(target.href);
  })());
});
