const CACHE_NAME = "runas-ruinas-v6";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/game.js",
  "./manifest.webmanifest",
  "./assets/app-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("runas-ruinas-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function saveResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    console.error("No se pudo guardar un recurso en caché:", error);
  }
}

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) await saveResponse("./index.html", response);
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          const cachedIndex = await caches.match("./index.html");
          return cachedPage || cachedIndex || Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(async (response) => {
        if (response.ok) await saveResponse(event.request, response);
        return response;
      });
    }),
  );
});
