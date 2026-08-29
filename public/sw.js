self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'إشعار جديد';
      const options = {
        body: data.body || '',
        icon: data.icon || '/ic_launcher.png',
        badge: data.badge || '/ic_launcher.png',
        image: data.image || undefined,
        data: {
          url: data.url || '/'
        },
        dir: 'rtl',
        lang: 'ar'
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('تنبيه جديد', {
          body: text,
          icon: '/ic_launcher.png',
          dir: 'rtl'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  let targetUrl = event.notification.data?.url || '/';
  
  // Make sure targetUrl is absolute if it's relative
  if (targetUrl.startsWith('/')) {
    targetUrl = self.location.origin + targetUrl;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Find if we already have the app open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          if (client.url !== targetUrl) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
