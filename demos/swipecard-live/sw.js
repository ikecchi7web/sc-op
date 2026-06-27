const CACHE_NAME = "swipecard-live-mvp-v3";
const APP_SHELL = [
    "./",
    "./index.html",
    "./index.css",
    "./main.js",
    "./manifest.webmanifest",
    "./assets/backgrounds/catalog.json",
    "./assets/media/ikedo_keitai.png",
    "./assets/media/logo_swipecard.png",
    "./assets/media/logo/X.png",
    "./assets/media/logo/I.png",
    "./assets/media/logo/L.png",
    "./assets/media/logo/F.png",
    "./assets/media/logo/Y.png",
    "./assets/media/logo/QR.png",
    "./assets/data/card.vcf",
    "./vendor/qrcode-generator/qrcode.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        ))
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
