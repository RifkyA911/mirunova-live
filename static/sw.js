// MiruNova Live Service Worker for Progressive Web App (PWA)
const CACHE_NAME = 'mirunova-cache-v1';
const STATIC_ASSETS = [
	'/',
	'/manifest.webmanifest',
	'/favicon.svg'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS).catch(() => {});
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
			);
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	// Only cache GET requests, bypass range requests and streaming
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);

	// Let external CDNs or heavy models stream through network first
	if (url.pathname.endsWith('.moc3') || url.pathname.endsWith('.png') || url.pathname.endsWith('.wasm')) {
		return;
	}

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				if (response.status === 200) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
				}
				return response;
			})
			.catch(() => caches.match(event.request))
	);
});
