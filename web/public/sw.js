// public/sw.js
const CACHE_NAME = 'stride-campus-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim any clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/logo.png',
      badge: data.badge || '/favicon.ico',
      data: data.data || {},
      tag: data.tag || 'stride-notification',
      requireInteraction: true,
      actions: data.actions || [],
      silent: false,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Stride Campus', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data;
  const urlToOpen = notificationData.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if any window is already open
      for (const client of clientList) {
        if (client.url.includes(new URL(urlToOpen, self.location.origin).pathname) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Check if any Stride Campus window is open
      for (const client of clientList) {
        if (client.url.includes('app.stridecampus.com') && 'focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_TO_URL',
            url: urlToOpen
          });
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    
    const options = {
      body: body,
      icon: '/logo.png',
      badge: '/favicon.ico',
      data: data || {},
      tag: 'stride-test',
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };

    self.registration.showNotification(title, options);
  }
});

// Background sync for failed notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-notification') {
    event.waitUntil(
      // Retry logic here if needed
      console.log('Background sync: retry-notification')
    );
  }
});