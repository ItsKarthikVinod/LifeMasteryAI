// ===========================================
// LifeMastery Progressive Web App Service Worker
// Consolidated PWA handler with tiered caching, offline support, and background sync
// ===========================================

// Import external scripts for notifications and messaging
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

// ==================== CONFIGURATION ====================
const CACHE_VERSION = "lifemastery-v1";
const CACHE_PREFIXES = {
  APP_SHELL: `${CACHE_VERSION}-shell`,
  STATIC_ASSETS: `${CACHE_VERSION}-static`,
  API_DATA: `${CACHE_VERSION}-api`,
  DYNAMIC: `${CACHE_VERSION}-dynamic`,
};

// App shell URLs - critical for offline functionality
const APP_SHELL_URLS = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

// Static assets that rarely change
const STATIC_ASSET_PATTERNS = [
  /\.(js|css|woff|woff2|ttf|eot)$/,
  /\.(jpg|jpeg|png|gif|svg|webp|ico)$/,
  /fonts\.googleapis\.com/,
  /cdn\.jsdelivr\.net/,
];

// API endpoints for which we should cache responses
const API_PATTERNS = [
  /\/api\//,
  /firestore\.googleapis\.com/,
  /storage\.googleapis\.com/,
];

// URLs to never cache
const NO_CACHE_PATTERNS = [/localhost/, /\/admin\//];

// ==================== FIREBASE INITIALIZATION ====================
try {
  firebase.initializeApp({
    apiKey: "AIzaSyAD2WMTMltBMpX_ljeSK7b1WgG_4ZfUH0Y",
    authDomain: "lifemaster-37373.firebaseapp.com",
    projectId: "lifemaster-37373",
    storageBucket: "lifemaster-37373.appspot.com",
    messagingSenderId: "717688763336",
    appId: "1:717688763336:web:43e888fb6ee6eeec4e06fd",
    measurementId: "G-5P1D2VD8Z6",
  });

  const messaging = firebase.messaging();

  // Handle background Firebase messages
  messaging.onBackgroundMessage((payload) => {
    console.log("[Firebase] Background message received:", payload);
    const notificationTitle = payload.notification.title || "LifeMastery";
    const notificationOptions = {
      body: payload.notification.body || "",
      icon: "/android-chrome-192x192.png",
      badge: "/favicon.ico",
      tag: "firebase-notification",
      requireInteraction: false,
      data: payload.data || {},
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.warn(
    "[Firebase] Initialization error (may be expected):",
    error.message,
  );
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Determine which cache strategy to use for a given request
 */
function getCacheStrategy(url) {
  const urlObj = new URL(url);

  // App shell → cache-first
  if (APP_SHELL_URLS.includes(urlObj.pathname)) {
    return "cache-first";
  }

  // Static assets → cache-first
  if (STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url))) {
    return "cache-first";
  }

  // API calls → network-first with cache fallback
  if (API_PATTERNS.some((pattern) => pattern.test(url))) {
    return "network-first";
  }

  // Dynamic content → network-first
  return "network-first";
}

/**
 * Get the appropriate cache name for a URL
 */
function getCacheName(url, strategy) {
  const urlObj = new URL(url);

  if (APP_SHELL_URLS.includes(urlObj.pathname)) {
    return CACHE_PREFIXES.APP_SHELL;
  }

  if (STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url))) {
    return CACHE_PREFIXES.STATIC_ASSETS;
  }

  if (API_PATTERNS.some((pattern) => pattern.test(url))) {
    return CACHE_PREFIXES.API_DATA;
  }

  return CACHE_PREFIXES.DYNAMIC;
}

/**
 * Cache-first strategy: try cache first, then network
 */
async function cacheFirst(request) {
  const cacheName = getCacheName(request.url, "cache-first");
  const cache = await caches.open(cacheName);

  try {
    const response = await cache.match(request);
    if (response) {
      console.log(`[Cache] HIT (cache-first): ${request.url}`);
      return response;
    }
  } catch (error) {
    console.warn(`[Cache] Error matching request:`, error);
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      // Clone and cache the response
      cache.put(request, response.clone());
      console.log(
        `[Cache] MISS → fetched & cached (cache-first): ${request.url}`,
      );
    }
    return response;
  } catch (error) {
    console.log(`[Offline] Network unavailable for: ${request.url}`);
    // Return offline fallback if available
    return cache.match("/index.html") || createOfflineFallback();
  }
}

/**
 * Network-first strategy: try network first, fallback to cache
 */
async function networkFirst(request) {
  const cacheName = getCacheName(request.url, "network-first");
  const cache = await caches.open(cacheName);

  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000),
      ),
    ]);

    if (response && response.status === 200) {
      // Update cache with fresh response
      cache.put(request, response.clone());
      console.log(`[Cache] Updated (network-first): ${request.url}`);
    }
    return response;
  } catch (error) {
    console.log(`[Cache] Network failed, trying cache: ${request.url}`);

    // Try to return cached version
    try {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log(`[Cache] HIT (fallback): ${request.url}`);
        return cachedResponse;
      }
    } catch (cacheError) {
      console.warn(`[Cache] Error reading cache:`, cacheError);
    }

    // No cache available, return fallback
    console.log(`[Offline] No cache for: ${request.url}`);
    return createOfflineFallback();
  }
}

/**
 * Create offline fallback response
 */
function createOfflineFallback() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Offline - LifeMastery</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .offline-container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 400px;
          }
          h1 { color: #2e3a59; margin: 0 0 1rem 0; }
          p { color: #666; line-height: 1.6; margin: 1rem 0; }
          .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>You're Offline</h1>
          <p>LifeMastery is loading your cached data...</p>
          <p style="font-size: 0.9rem; color: #999;">If you see this message, go back and try accessing a cached page, or reconnect to the internet.</p>
        </div>
      </body>
    </html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

/**
 * Should this request be skipped from caching?
 */
function shouldSkipCache(url) {
  return NO_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

// ==================== SERVICE WORKER LIFECYCLE ====================

/**
 * Install event: Pre-cache app shell
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Install event fired");

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_PREFIXES.APP_SHELL);
        await cache.addAll(APP_SHELL_URLS);
        console.log("[SW] App shell cached successfully");
        self.skipWaiting(); // Activate immediately
      } catch (error) {
        console.error("[SW] Install error:", error);
      }
    })(),
  );
});

/**
 * Activate event: Clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event fired");

  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const currentCacheNames = Object.values(CACHE_PREFIXES);

        const deletePromises = cacheNames
          .filter((name) => !currentCacheNames.includes(name))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          });

        await Promise.all(deletePromises);
        // Claim all clients immediately
        await self.clients.claim();
        console.log("[SW] Activation complete, claimed all clients");
      } catch (error) {
        console.error("[SW] Activate error:", error);
      }
    })(),
  );
});

// ==================== FETCH EVENT HANDLER ====================

/**
 * Main fetch handler with tiered caching strategy
 */
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  const { method } = event.request;

  // Only handle GET requests (POST, PUT, DELETE require special handling)
  if (method !== "GET") {
    return;
  }

  // Skip caching for certain URLs
  if (shouldSkipCache(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  const strategy = getCacheStrategy(url);

  if (strategy === "cache-first") {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

// ==================== BACKGROUND SYNC ====================

/**
 * Background Sync for offline-queued actions
 * Tag: 'sync-todos', 'sync-habits', 'sync-notes', 'sync-journals'
 */
self.addEventListener("sync", (event) => {
  console.log(`[Background Sync] Syncing with tag: ${event.tag}`);

  if (event.tag.startsWith("sync-")) {
    event.waitUntil(
      (async () => {
        try {
          // Notify all clients that sync is in progress
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: "SYNC_STARTED",
              tag: event.tag,
            });
          });

          // Here you would fetch queued items from IndexedDB and sync them
          // For now, we just notify completion
          await new Promise((resolve) => setTimeout(resolve, 1000));

          clients.forEach((client) => {
            client.postMessage({
              type: "SYNC_COMPLETE",
              tag: event.tag,
            });
          });

          console.log(`[Background Sync] Completed: ${event.tag}`);
        } catch (error) {
          console.error(`[Background Sync] Error:`, error);
          throw error; // Retry sync
        }
      })(),
    );
  }
});

// ==================== MESSAGE HANDLERS ====================

/**
 * Handle messages from clients
 */
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  console.log(`[SW Message] Received: ${type}`, data);

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (type === "CLIENTS_CLAIM") {
    self.clients.claim();
  } else if (type === "CLEAR_CACHE") {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log("[SW] All caches cleared");
      })(),
    );
  } else if (type === "REQUEST_SYNC") {
    // Trigger background sync from client
    event.waitUntil(
      self.registration.sync.register(data.tag).then(() => {
        console.log(`[SW] Background sync registered: ${data.tag}`);
      }),
    );
  }
});

// ==================== PUSH NOTIFICATION ====================

/**
 * Handle push notifications
 */
self.addEventListener("push", (event) => {
  console.log("[Push] Notification received:", event);

  if (!event.data) {
    console.warn("[Push] No data in push event");
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || "LifeMastery";
    const options = {
      body: data.body || "",
      icon: "/android-chrome-192x192.png",
      badge: "/favicon.ico",
      tag: data.tag || "lifemastery-notification",
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("[Push] Error processing push:", error);
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener("notificationclick", (event) => {
  console.log("[Notification] Clicked:", event.notification);

  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window" });

      // Check if LifeMastery is already open
      for (const client of clients) {
        if (client.url === "/" && "focus" in client) {
          // Notify the client about the notification click
          client.postMessage({
            type: "NOTIFICATION_CLICKED",
            notification: event.notification,
          });
          return client.focus();
        }
      }

      // If not open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })(),
  );
});

console.log("[SW] LifeMastery Service Worker loaded successfully");
