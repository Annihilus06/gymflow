// GymFlow Service Worker (PWA)
const SHELL_CACHE = 'gymflow-shell-v2';
const API_CACHE = 'gymflow-api-v2';

const PRECACHE_SHELL_ASSETS = [
  '/',
  '/dashboard',
  '/calendar',
  '/workout',
  '/progress',
  '/goals',
  '/nutrition',
  '/manifest.json',
  '/icons/icon.svg',
];

// List of API routes suitable for Stale-While-Revalidate caching
const SWR_API_ROUTES = [
  '/api/calendar/week',
  '/api/calendar/month',
  '/api/profile',
  '/api/goals/active',
  '/api/stats',
  '/api/exercises',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== API_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip non-GET requests (handled by Offline Queue on client)
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Read-Only API Caching: Stale-While-Revalidate with Cache Fallback
  if (SWR_API_ROUTES.some((route) => url.pathname.startsWith(route))) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Navigation Requests: Network-First with Offline Shell Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return (await caches.match('/dashboard')) || (await caches.match('/'));
        })
    );
    return;
  }

  // 4. Static Assets (JS, CSS, SVGs, Fonts): Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});

// Push Notification Event Listener
self.addEventListener('push', (event) => {
  let payload = {
    title: 'GymFlow Notification',
    body: 'Stay on track with your fitness goals today!',
    url: '/dashboard',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon.svg',
    badge: payload.badge || '/icons/icon.svg',
    data: { url: payload.url || '/dashboard' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open GymFlow' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
