const CACHE_NAME = "cloud-storage-v3";
const RUNTIME_CACHE = "cloud-storage-runtime-v3";
const IMAGE_CACHE = "cloud-storage-images-v3";

const isLocalhost =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";
const BASE_PATH = isLocalhost ? "/" : "/cloud/";

const MAX_RUNTIME_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;
const CACHE_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

const PRECACHE_URLS = [
  BASE_PATH + "index.html",
  BASE_PATH + "style.css",
  BASE_PATH + "script.js",
  BASE_PATH + "manifest.json",
  BASE_PATH + "offline.html",
  "https://cdn.jsdelivr.net/npm/appwrite@21.5.0",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico",
];
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Pre-caching app shell");
        return Promise.allSettled(
          PRECACHE_URLS.map((url) => {
            return cache.add(url).catch((err) => {
              console.warn("[ServiceWorker] Failed to cache:", url, err);
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Pre-caching complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[ServiceWorker] Pre-caching failed:", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== IMAGE_CACHE
            ) {
              console.log("[ServiceWorker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    console.log(
      `[ServiceWorker] Trimmed ${cacheName}: removed ${keysToDelete.length} items`
    );
  }
}

function isCacheExpired(cachedResponse) {
  const cachedDate = cachedResponse.headers.get("sw-cache-date");
  if (!cachedDate) return false;

  const age = Date.now() - parseInt(cachedDate);
  return age > CACHE_EXPIRATION_TIME;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (
    !event.request.url.startsWith(self.location.origin) &&
    !event.request.url.startsWith("https://cdn.jsdelivr.net") &&
    !event.request.url.startsWith("https://cdnjs.cloudflare.com") &&
    !event.request.url.startsWith("https://raw.githubusercontent.com")
  ) {
    return;
  }

  if (event.request.url.includes("cloud.appwrite.io")) {
    return;
  }

  const isImage =
    event.request.destination === "image" ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);
  const targetCache = isImage ? IMAGE_CACHE : RUNTIME_CACHE;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse && isCacheExpired(cachedResponse)) {
        console.log(
          "[ServiceWorker] Cache expired, fetching fresh:",
          event.request.url
        );
        cachedResponse = null;
      }

      if (cachedResponse) {
        return cachedResponse;
      }

      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type === "error"
          ) {
            return response;
          }

          const responseToCache = response.clone();
          const headers = new Headers(responseToCache.headers);
          headers.append("sw-cache-date", Date.now().toString());

          const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers,
          });
          caches.open(targetCache).then(async (cache) => {
            await cache.put(event.request, modifiedResponse);
            const maxSize = isImage
              ? MAX_IMAGE_CACHE_SIZE
              : MAX_RUNTIME_CACHE_SIZE;
            await trimCache(targetCache, maxSize);
          });

          return response;
        })
        .catch((error) => {
          console.log("[ServiceWorker] Fetch failed:", error);
          if (event.request.mode === "navigate") {
            return caches.match(BASE_PATH + "offline.html");
          }
          return caches.match(BASE_PATH + "index.html");
        });
    })
  );
});
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-uploads") {
    console.log("[ServiceWorker] Background sync triggered");
  }
});
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification",
    icon: "https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico",
    badge:
      "https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };
  event.waitUntil(
    self.registration
      .getNotifications()
      .then(() => {
        return Notification.permission === "granted"
          ? self.registration.showNotification("Cloud Storage", options)
          : Promise.resolve();
      })
      .catch((err) => {
        console.log(
          "[ServiceWorker] Notification not shown - permission not granted"
        );
        return Promise.resolve(); // Don't fail the event
      })
  );
});
self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification clicked");
  event.notification.close();

  event.waitUntil(clients.openWindow("https://soraxpl.github.io/cloud/"));
});
self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }

  if (event.data.action === "clearCache") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log("[ServiceWorker] Loaded");
