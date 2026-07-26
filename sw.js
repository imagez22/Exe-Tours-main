const CACHE_NAME = "exetours-static-v4";
const PRECACHE_URLS = [
    "/",
    "/index.html",
    "/login.html",
    "/account.html",
    "/admin.html",
    "/booking-confirmation.html",
    "/css/style.css",
    "/css/responsive.css",
    "/js/api.js",
    "/js/auth.js",
    "/js/account.js",
    "/js/site.js",
    "/js/script.js",
    "/manifest.json",
    "/img/mountain.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET" || request.url.includes("/api/")) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request)
                .then((response) => {
                    if (response.ok && request.url.startsWith(self.location.origin)) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => cached);
        })
    );
});
