const CACHE_NAME = 'dicoding-story-pwa-v1';
const STATIC_CACHE = 'dicoding-story-static-v1';
const DYNAMIC_CACHE = 'dicoding-story-dynamic-v1';

const staticUrlsToCache = [
  '/',
  '/app.bundle.js',
  '/images/logo.png',
  '/favicon.png',
  '/manifest.json'
];

const dynamicCachePatterns = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(?:png|jpg|jpeg|svg|gif)$/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(staticUrlsToCache).catch(err => {
          return Promise.resolve();
        });
      }),
      caches.open(DYNAMIC_CACHE).then(() => {
      })
    ]).then(() => {
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') {
    return;
  }
  
  if (request.url.includes('/v1/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const shouldCache = dynamicCachePatterns.some(pattern => 
              pattern.test(request.url)
            );
            
            if (shouldCache) {
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            if (request.destination === 'document') {
              return caches.match('/');
            }
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

self.addEventListener('push', (event) => {
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {      notificationData = {
        title: 'Dicoding Story',
        body: event.data.text() || 'New story available!',
        icon: '/images/logo.png',
        badge: '/favicon.png',
        tag: 'dicoding-story',
        data: {
          url: '/'
        }
      };
    }
  } else {    notificationData = {
      title: 'Dicoding Story',
      body: 'New story available!',
      icon: '/images/logo.png',
      badge: '/favicon.png',
      tag: 'dicoding-story',
      data: {
        url: '/'
      }
    };
  }

  const options = {
    body: notificationData.body,    icon: notificationData.icon || '/images/logo.png',
    badge: notificationData.badge || '/favicon.png',
    tag: notificationData.tag || 'dicoding-story',
    data: notificationData.data || { url: '/' },
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Story',        icon: '/images/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  let urlToOpen = '/';
  
  if (event.notification.data?.url) {
    urlToOpen = event.notification.data.url;
  } else if (event.notification.data?.storyId) {
    urlToOpen = `#/detail/${event.notification.data.storyId}`;
  } else if (event.action === 'view') {
    urlToOpen = '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            if (event.notification.data?.storyId) {
              client.postMessage({
                type: 'NAVIGATE_TO_STORY',
                storyId: event.notification.data.storyId
              });
            }
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const payload = event.data.payload;
    
    const options = {
      body: payload.body,
      icon: payload.icon || '/public/images/logo.png',
      badge: payload.badge || '/public/favicon.png',
      tag: payload.tag || 'dicoding-story',
      data: payload.data || { url: '/' },
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      actions: payload.actions || []
    };    self.registration.showNotification(payload.title, options);
  }
});
