// Service Worker — handles background Web Push notifications

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data?.json() } catch { data = { title: '🔔 Prisnivå nådd', body: event.data?.text() } }

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 Prisnivå nådd', {
      body:  data.body  || '',
      icon:  '/kamyab-trading/icon.svg',
      badge: '/kamyab-trading/icon.svg',
      tag:   'price-alert',
      renotify: true,
      data: { url: '/kamyab-trading/' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const url = event.notification.data?.url || '/kamyab-trading/'
      const existing = clients.find(c => c.url.includes('kamyab-trading'))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
