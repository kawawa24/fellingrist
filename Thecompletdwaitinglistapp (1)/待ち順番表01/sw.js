self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('app-cache').then((cache) => {
            return cache.addAll([
                '/',
                '/confirm.html',
                '/imege-select.html',
                '/index.html',
                '/mainfest.json',
                '/queue.html',
                '/save.html',
                '/script.js',
                '/style.css',
                '/sw.js',
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
