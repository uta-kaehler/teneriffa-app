// Tenerife companion — Service Worker
// Dual purpose:
//  1. Serve local push notifications via postMessage
//  2. Cache OSM map tiles + API responses for offline use

const CACHE_TILES = "tenerife-tiles-v1";
const CACHE_API   = "tenerife-api-v1";

// ── Install: skip waiting so the new SW activates immediately
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// ── Activate: claim clients + prune old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_TILES && k !== CACHE_API)
            .map((k) => caches.delete(k)),
        ),
      ),
    ]),
  );
});

// ── Fetch: Cache-first for tiles, network-first for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // OSM tile URLs: *.tile.openstreetmap.org
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open(CACHE_TILES).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const res = await fetch(event.request);
          if (res.ok) {
            // Cache tiles up to 5MB each; OSM allows reasonable caching
            cache.put(event.request, res.clone()).catch(() => {});
          }
          return res;
        } catch {
          return new Response("", { status: 503 });
        }
      }),
    );
    return;
  }

  // Light API responses: network-first with 10-min stale cache
  if (url.pathname.startsWith("/api/light")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_API).then((cache) => cache.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c ?? new Response("{}", { status: 503 }))),
    );
    return;
  }

  // Everything else: network passthrough (no-op, required by PWA criteria on some browsers)
});

// ── Notification via postMessage from the scheduler
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "show-notification") {
    const { title, body, tag, url } = data;
    event.waitUntil(
      self.registration.showNotification(title || "Tenerife", {
        body: body || "",
        tag: tag || "tenerife",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: url || "/" },
        requireInteraction: false,
        silent: false,
        vibrate: [100, 50, 100],
      }),
    );
  }
});

// ── Tap on notification → focus app or open it
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const c of clients) {
          if ("focus" in c) return c.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
