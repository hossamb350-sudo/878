self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const notif = data.notification || {};
      const customData = data.data || {};
      
      const title = notif.title || data.title || customData.title || 'المنصة الإعلامية';
      const rawBody = notif.body !== undefined ? notif.body : (data.body !== undefined ? data.body : customData.body);
      const body = rawBody ? String(rawBody).trim() : '';
      const icon = notif.icon || data.icon || '/ic_launcher.png';
      const badge = data.badge || '/ic_launcher.png';
      const image = notif.image || data.image || customData.image || undefined;
      const url = customData.url || data.url || notif.click_action || '/';

      const options = {
        body: body,
        icon: icon,
        badge: badge,
        image: image,
        data: {
          url: url,
          ...customData
        },
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200]
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('المنصة الإعلامية', {
          body: text || '',
          icon: '/ic_launcher.png',
          badge: '/ic_launcher.png',
          dir: 'rtl',
          lang: 'ar'
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
