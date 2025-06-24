// Push notification handling for Workbox-generated SW
self.addEventListener('push', (event) => {
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
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
  } else {
    notificationData = {
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
    body: notificationData.body,
    icon: notificationData.icon || '/images/logo.png',
    badge: notificationData.badge || '/favicon.png',
    tag: notificationData.tag || 'dicoding-story',
    data: notificationData.data || { url: '/' },
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Story',
        icon: '/images/logo.png'
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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  let urlToOpen = '/';
  
  if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].navigate(urlToOpen).then(() => clientList[0].focus());
        }
        return self.clients.openWindow(urlToOpen);
      })
  );
});
