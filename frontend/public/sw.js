// ============================================================
// Agenda Aqui Admin — Service Worker
// Cache offline + Notificações de pagamentos pendentes
// ============================================================

// Mudar este número apaga as versões antigas guardadas e obriga a descarregar o site novo
const CACHE_NAME = 'agendaao-admin-v4';
const ADMIN_ROUTE = '/gestao-x7k3m9';

// Ficheiros a fazer cache para funcionamento offline
const URLS_PARA_CACHE = [
  '/',
  ADMIN_ROUTE,
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
  '/images/hero-profissional.webp?v=3',
];

// ── Install: pré-cache dos assets estáticos ──────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] A fazer cache dos assets...');
      return cache.addAll(URLS_PARA_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: limpar caches antigos ──────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────
// - API: rede primeiro (cache só como recurso offline)
// - Páginas (HTML): rede primeiro, para o site novo aparecer logo após cada publicação
// - Ficheiros com hash (JS/CSS/imagens): cache primeiro, porque o nome muda a cada versão
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Pedidos à API: sempre tentar rede primeiro
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Páginas: rede primeiro; offline usa a última versão guardada
  const ehPagina = event.request.mode === 'navigate' || event.request.destination === 'document';
  if (ehPagina) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Ficheiros estáticos: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

// ── Push: Notificação de pagamento pendente ───────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || '💳 Novo Pagamento Pendente!';
    const options = {
      body: data.body || 'Tens um pagamento a aguardar confirmação no painel.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'pagamento-pendente',
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: 'abrir', title: '📋 Ver Painel', icon: '/icon-192.png' },
        { action: 'fechar', title: 'Ignorar' },
      ],
      data: { url: data.url || ADMIN_ROUTE },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Erro no push:', err);
  }
});

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'fechar') return;

  const targetUrl = event.notification.data?.url || ADMIN_ROUTE;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se o painel já está aberto, focar nele
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Caso contrário, abrir
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Background Sync: verificar pendentes a cada 5 min ─────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'verificar-pendentes') {
    event.waitUntil(verificarPendentes());
  }
});

async function verificarPendentes() {
  try {
    const res = await fetch('/api/admin/pagamentos-pendentes', {
      headers: { 'x-admin-secret': '' }, // A chave é gerida pelo AdminPage
    });
    if (!res.ok) return;
    const pendentes = await res.json();
    if (pendentes.length > 0) {
      await self.registration.showNotification('💳 Pagamentos Pendentes', {
        body: `Tens ${pendentes.length} pagamento(s) a aguardar confirmação.`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'pendentes-bg',
        data: { url: ADMIN_ROUTE },
      });
    }
  } catch (_) {
    // Silencioso — sem internet ou backend em baixo
  }
}
