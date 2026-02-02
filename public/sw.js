// Service Worker - Offline va caching support
const CACHE_NAME = 'vocab-app-v1';
const RUNTIME_CACHE = 'vocab-app-runtime-v1';

const ASSETS_TO_CACHE = [
  '/',
  './index.html',
  './script.js',
  './styles.css',
  './manifest.json'
];

// Installation - assets'ni cache'da saqlab qo'yish
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('⚠️ Some assets failed to cache:', err);
        // Partial caching - ba'zi fayllar cache qilina olmasa ham davom etsin
        return cache.addAll(ASSETS_TO_CACHE.filter(url => 
          url.includes('.html') || url.includes('.css') || url.includes('.json')
        ));
      });
    })
  );
});

// Activation - eski cache'larni o'chirish
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch events - Network first, Cache fallback strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // API requests - Network first, cache fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Response'ni cache'da saqlab qo'yish (faqat GET so'rovlar)
          if (response.ok && request.method === 'GET') {
            const cacheClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, cacheClone);
            });
          }
          return response;
        })
        .catch(error => {
          console.log('📡 Network error, checking cache:', request.url);
          // Network bilan muammo, cache'dan olib berish
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('✅ Returning cached response:', request.url);
              return cachedResponse;
            }
            // Cache'da ham yo'q bo'lsa, error response berish
            return new Response(
              JSON.stringify({ 
                error: 'Offline - ma\'lumot yuklab olib bo\'lmadi',
                cached: false 
              }),
              { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - Cache first, Network fallback
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('⚡ Serving from cache:', request.url);
        return cachedResponse;
      }

      return fetch(request)
        .then(response => {
          // CSS va JS fayllarini cache'da saqlab qo'yish
          if (response.ok && 
              (request.url.includes('.css') || 
               request.url.includes('.js') || 
               request.url.includes('.json'))) {
            const cacheClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, cacheClone);
            });
          }
          return response;
        })
        .catch(error => {
          console.log('❌ Fetch failed:', request.url, error);
          
          // HTML request - offline page qaytarish
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          // API so'rovi - offline message
          if (request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ 
                error: 'Offline - internet bilan ulanish yo\'q',
                offline: true 
              }),
              { 
                status: 0,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          return new Response('Offline - sahifa yuklab olib bo\'lmadi', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});

// Message handling - Cache clearing, version updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Clearing all caches...');
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => caches.delete(cacheName));
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting and claiming clients...');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'VERSION_CHECK') {
    if (event.ports && event.ports.length > 0) {
      event.ports[0].postMessage({ version: CACHE_NAME });
    }
  }
});

// Background sync - offline data sync when online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-words') {
    console.log('🔄 Background sync: syncing words...');
    event.waitUntil(
      // Offline'da savedlarini sync qilish
      fetch('/api/sync').catch(err => {
        console.log('Sync failed:', err);
      })
    );
  }
});

console.log('✅ Service Worker loaded and ready!');
