// Service Worker для PWA мобильной оптимизации

const CACHE_NAME = 'magnum-star-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Ресурсы для кэширования
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/src/main.jsx',
  '/src/App.jsx',
  // Добавьте другие критические ресурсы
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Установка');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Кэширование ресурсов');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Установка завершена');
        // Принудительная активация нового SW
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Ошибка установки:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Активация');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Удаление старого кэша:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Активация завершена');
        // Взять контроль над всеми клиентами
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Ошибка активации:', error);
      })
  );
});

// Обработка запросов (стратегия Cache First для статических ресурсов)
self.addEventListener('fetch', (event) => {
  // Игнорируем запросы к внешним API
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Игнорируем запросы к Telegram SDK
  if (event.request.url.includes('telegram.org') || 
      event.request.url.includes('libtl.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Если ресурс есть в кэше, возвращаем его
        if (cachedResponse) {
          return cachedResponse;
        }

        // Если нет в кэше, пытаемся загрузить из сети
        return fetch(event.request)
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ для кэширования
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Если сеть недоступна, показываем офлайн страницу
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Периодическая синхронизация (для фоновых обновлений)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Фоновая синхронизация');
    event.waitUntil(doBackgroundSync());
  }
});

// Функция фоновой синхронизации
async function doBackgroundSync() {
  try {
    // Здесь можно добавить логику для синхронизации данных
    console.log('📡 Service Worker: Выполнение фоновой синхронизации');
  } catch (error) {
    console.error('❌ Service Worker: Ошибка фоновой синхронизации:', error);
  }
}

// Push уведомления (для будущих функций)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'magnum-star-notification',
        requireInteraction: false,
        actions: [
          {
            action: 'open',
            title: 'Открыть приложение'
          }
        ]
      })
    );
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('🏁 Service Worker: Загружен и готов к работе');
