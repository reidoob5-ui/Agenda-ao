// Service Worker do AgendaAO para lidar com notificacoes Push
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Novo Alerta! 📅';
    const options = {
      body: data.body || 'Tens uma nova atualizacao no AgendaAO.',
      icon: '/favicon.svg', // Icon do teu PWA
      badge: '/favicon.svg',
      data: {
        url: data.url || '/dashboard'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Erro ao processar push event:', error);
  }
});

// Lidar com o clique na notificacao
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Se o site ja esta aberto, focar nele
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Caso contrario, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
