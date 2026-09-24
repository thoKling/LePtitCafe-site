---
layout: null
---
// Service worker: keeps the site's pages and assets on the device.
// The cache name changes on every build, so a new deploy replaces old files.
const CACHE = "ptit-cafe-{{ site.time | date: '%s' }}";
const BASE = "{{ site.baseurl }}/";
const v = "?v={{ site.time | date: '%s' }}";

const PRECACHE = [
  "",
  "carte/",
  "a-emporter/",
  "reservation/",
  "groupes/",
  "contact/",
  "mentions-legales/",
  "assets/css/style.css" + v,
  "assets/js/main.js" + v,
  "assets/fonts/inter.woff2",
  "assets/fonts/fraunces.woff2",
  "assets/fonts/caveat.woff2",
  "assets/img/favicon.svg",
  "assets/img/hero.webp",
].map((path) => BASE + path);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ptit-cafe-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;

  const isPage = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")
    || url.pathname.endsWith("/");

  if (isPage) {
    // Stale-while-revalidate: answer instantly from cache, refresh it in the background.
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request, { ignoreSearch: true });
        const network = fetch(request)
          .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
          .catch(() => cached);
        if (cached) { event.waitUntil(network); return cached; }
        return network;
      })
    );
    return;
  }

  // Assets (images, fonts, CSS, JS): cache first.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
  );
});
