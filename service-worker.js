// Generate version using current date to ensure updates
const CACHE_VERSION = 'v' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
const CACHE_NAMES = {
  static: `static-cache-${CACHE_VERSION}`,
  dynamic: `dynamic-cache-${CACHE_VERSION}`,
  fonts: `fonts-cache-${CACHE_VERSION}`
};

// Stuff we need right from the get-go
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/main.js',
  '/js/utils.js',
  '/js/formHandler.js',
  '/js/fieldManager.js',
  '/js/uiManager.js',
  '/js/formatters.js',
  '/js/paginationManager.js',
  '/js/dataStorage.js',
  '/app.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/offline.html',
];

// Fonts get special treatment - cached separately
const FONT_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Keep the dynamic cache from eating all the memory
const DYNAMIC_CACHE_LIMIT = 50;

// When the service worker is first installed, grab all the essential files
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Stash the main app files
      caches.open(CACHE_NAMES.static)
        .then(cache => {
          console.log('Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      
      // Grab the fonts while we're at it
      caches.open(CACHE_NAMES.fonts)
        .then(cache => {
          console.log('Caching font assets');
          return cache.addAll(FONT_ASSETS);
        })
    ])
    .then(() => self.skipWaiting())
  );
});

// When a new version takes over, ditch the old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Chuck out any caches that aren't part of our current version
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Keep the cache from growing out of control
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Kick out the oldest item to make room
    await cache.delete(keys[0]);
    // Keep trimming until we're under the limit
    await trimCache(cacheName, maxItems);
  }
};

// Try the network first, fall back to cache for most requests
const networkFirst = async (request) => {
  try {
    // Hit the network and hope for the best
    const networkResponse = await fetch(request);

    // If we got a good response, stash it for later just in case
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      await cache.put(request, networkResponse.clone());
      
      // Don't let the cache get too bloated
      await trimCache(CACHE_NAMES.dynamic, DYNAMIC_CACHE_LIMIT);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, falling back to cache', error);
    
    // Network's dead, let's see if we've got a cached version
    const cachedResponse = await caches.match(request);
    
    // Return what we've got or the offline page
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If they're looking for an HTML page, show the offline version
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }

    
    // For other stuff, just have to fail gracefully
    throw error;
  }
};

// For static assets, check the cache first - it's faster
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAMES.static);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log('Cache-first strategy failed for:', request.url);
    // For HTML, show offline page
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return new Response('Resource not available offline', {
      status: 408,
      headers: {'Content-Type': 'text/plain'}
    });
  }
};

// For fonts, use what we have but update in the background
const staleWhileRevalidate = async (request) => {
  const cachedResponse = await caches.match(request);
  
  // Kick off a fetch to update the cache, but don't wait for it
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        return caches.open(CACHE_NAMES.fonts)
          .then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
      }
      return networkResponse;
    })
    .catch(err => {
      console.log('Failed to update font in background', err);
    });
  
  // Immediately return what we have, or wait for the network if we have nothing
  return cachedResponse || fetchPromise;
};

// Here's where we decide what strategy to use for each request
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Don't mess with non-GET requests or browser extensions
  if (request.method !== 'GET' || 
      url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:') {
    return;
  }
  
  // Pick the right strategy based on what they're asking for
  if (request.url.includes('fonts.googleapis.com') || 
      request.url.includes('fonts.gstatic.com')) {
    // Fonts: grab what we have, update in the background
    event.respondWith(staleWhileRevalidate(request));
  } else if (STATIC_ASSETS.some(asset => 
      request.url.endsWith(asset) || 
      (request.destination === 'image' && !request.url.includes('api')))) {
    // Static stuff and images: check cache first, it's faster
    event.respondWith(cacheFirst(request));
  } else {
    // For everything else, try network first since content might have changed
    event.respondWith(networkFirst(request));
  }
});

// Listen for the app telling us to wake up
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// When we get back online, sync any data saved while offline
self.addEventListener('sync', event => {
  if (event.tag === 'sync-citations') {
    event.waitUntil(syncCitations());
  }
});

// Push saved citations to the server when we're back online
const syncCitations = async () => {
  try {
    // Get data from IndexedDB
    const data = await getOfflineData();
    
    if (!data || data.length === 0) {
      return;
    }

    // Send each item to the server
    const successfulItems = [];
    
    for (const item of data) {
      try {
        const response = await fetch('/api/citations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        });
        
        if (response.ok) {
          successfulItems.push(item.id);
        }
      } catch (error) {
        console.error('Failed to sync item:', error);
      }
    }
    
    // Remove the items we successfully sent
    if (successfulItems.length > 0) {
      await clearSyncedData(successfulItems);
    }
    
  } catch (error) {
    console.error('Failed to sync citations:', error);
  }
};

// Grab the stuff we saved while offline
function getOfflineData() {
  // Implementation would go here to get data from IndexedDB
  return Promise.resolve([]);
}

// Clean up after successful sync
function clearSyncedData() {
  // Implementation would go here to remove synced data from IndexedDB
  return Promise.resolve();
} 