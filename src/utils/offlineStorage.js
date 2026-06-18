/**
 * IndexedDB abstraction layer for offline storage
 * Manages queued actions, cached data, and sync metadata
 */

const DB_NAME = "LifeMastery";
const DB_VERSION = 1;

// Store names
const STORES = {
  PENDING_ACTIONS: "pendingActions",
  SYNC_METADATA: "syncMetadata",
  OFFLINE_CACHE: "offlineCache",
};

let dbInstance = null;

/**
 * Initialize IndexedDB
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[IndexedDB] Error opening database:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log("[IndexedDB] Database initialized successfully");
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log("[IndexedDB] Upgrading database schema");

      // Create store for pending actions (offline-queued actions)
      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const actionStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
          keyPath: "id",
          autoIncrement: true,
        });
        actionStore.createIndex("type", "type", { unique: false });
        actionStore.createIndex("createdAt", "createdAt", { unique: false });
        actionStore.createIndex("synced", "synced", { unique: false });
      }

      // Create store for sync metadata
      if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
        db.createObjectStore(STORES.SYNC_METADATA, { keyPath: "key" });
      }

      // Create store for offline cache
      if (!db.objectStoreNames.contains(STORES.OFFLINE_CACHE)) {
        const cacheStore = db.createObjectStore(STORES.OFFLINE_CACHE, {
          keyPath: "key",
        });
        cacheStore.createIndex("type", "type", { unique: false });
        cacheStore.createIndex("expiresAt", "expiresAt", { unique: false });
      }
    };
  });
}

// ==================== PENDING ACTIONS ====================

/**
 * Add action to pending queue (for offline syncing)
 */
export async function addPendingAction(type, data) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], "readwrite");
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);

    const action = {
      type,
      data,
      createdAt: Date.now(),
      synced: false,
      retries: 0,
    };

    const request = store.add(action);

    request.onsuccess = () => {
      console.log(`[Queue] Added pending action: ${type}`, action);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error("[Queue] Error adding pending action:", request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all pending actions
 */
export async function getPendingActions(type = null) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], "readonly");
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);

    let request;
    if (type) {
      const index = store.index("type");
      request = index.getAll(type);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => {
      const actions = request.result.filter((action) => !action.synced);
      console.log(`[Queue] Retrieved ${actions.length} pending actions`);
      resolve(actions);
    };

    request.onerror = () => {
      console.error("[Queue] Error retrieving pending actions:", request.error);
      reject(request.error);
    };
  });
}

/**
 * Mark action as synced
 */
export async function markActionSynced(actionId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], "readwrite");
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);

    const getRequest = store.get(actionId);

    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.synced = true;
        action.syncedAt = Date.now();
        const updateRequest = store.put(action);

        updateRequest.onsuccess = () => {
          console.log(`[Queue] Marked action ${actionId} as synced`);
          resolve(action);
        };

        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      } else {
        resolve(null);
      }
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

/**
 * Delete pending action
 */
export async function deletePendingAction(actionId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], "readwrite");
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.delete(actionId);

    request.onsuccess = () => {
      console.log(`[Queue] Deleted pending action: ${actionId}`);
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ==================== OFFLINE CACHE ====================

/**
 * Cache data for offline access
 */
export async function cacheData(
  key,
  data,
  type,
  expiresIn = 7 * 24 * 60 * 60 * 1000,
) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.OFFLINE_CACHE], "readwrite");
    const store = transaction.objectStore(STORES.OFFLINE_CACHE);

    const cacheEntry = {
      key,
      type,
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + expiresIn,
    };

    const request = store.put(cacheEntry);

    request.onsuccess = () => {
      console.log(`[OfflineCache] Cached: ${key} (${type})`);
      resolve(cacheEntry);
    };

    request.onerror = () => {
      console.error("[OfflineCache] Error caching data:", request.error);
      reject(request.error);
    };
  });
}

/**
 * Get cached data
 */
export async function getCachedData(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.OFFLINE_CACHE], "readonly");
    const store = transaction.objectStore(STORES.OFFLINE_CACHE);
    const request = store.get(key);

    request.onsuccess = () => {
      const entry = request.result;

      if (!entry) {
        console.log(`[OfflineCache] Cache miss: ${key}`);
        resolve(null);
        return;
      }

      // Check if cache has expired
      if (entry.expiresAt < Date.now()) {
        console.log(`[OfflineCache] Cache expired: ${key}`);
        // Delete expired cache
        const deleteRequest = store.delete(key);
        deleteRequest.onsuccess = () => {
          resolve(null);
        };
        return;
      }

      console.log(`[OfflineCache] Cache hit: ${key}`);
      resolve(entry.data);
    };

    request.onerror = () => {
      console.error("[OfflineCache] Error retrieving cache:", request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all cached data by type
 */
export async function getCachedDataByType(type) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.OFFLINE_CACHE], "readonly");
    const store = transaction.objectStore(STORES.OFFLINE_CACHE);
    const index = store.index("type");
    const request = index.getAll(type);

    request.onsuccess = () => {
      const entries = request.result.filter(
        (entry) => entry.expiresAt >= Date.now(),
      );
      console.log(
        `[OfflineCache] Retrieved ${entries.length} cached items of type: ${type}`,
      );
      resolve(entries.map((entry) => entry.data));
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.OFFLINE_CACHE], "readwrite");
    const store = transaction.objectStore(STORES.OFFLINE_CACHE);
    const request = store.getAll();

    request.onsuccess = () => {
      const entries = request.result;
      const now = Date.now();
      let deletedCount = 0;

      entries.forEach((entry) => {
        if (entry.expiresAt < now) {
          store.delete(entry.key);
          deletedCount++;
        }
      });

      console.log(`[OfflineCache] Cleared ${deletedCount} expired entries`);
      resolve(deletedCount);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ==================== SYNC METADATA ====================

/**
 * Save sync metadata (last sync time, version, etc.)
 */
export async function setSyncMetadata(key, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SYNC_METADATA], "readwrite");
    const store = transaction.objectStore(STORES.SYNC_METADATA);

    const request = store.put({ key, value, updatedAt: Date.now() });

    request.onsuccess = () => {
      console.log(`[SyncMeta] Set: ${key} = ${JSON.stringify(value)}`);
      resolve(value);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get sync metadata
 */
export async function getSyncMetadata(key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SYNC_METADATA], "readonly");
    const store = transaction.objectStore(STORES.SYNC_METADATA);
    const request = store.get(key);

    request.onsuccess = () => {
      const entry = request.result;
      resolve(entry ? entry.value : null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ==================== CLEANUP ====================

/**
 * Clear all offline data (debugging only)
 */
export async function clearAllOfflineData() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PENDING_ACTIONS, STORES.OFFLINE_CACHE, STORES.SYNC_METADATA],
      "readwrite",
    );

    const stores = [
      transaction.objectStore(STORES.PENDING_ACTIONS),
      transaction.objectStore(STORES.OFFLINE_CACHE),
      transaction.objectStore(STORES.SYNC_METADATA),
    ];

    const clearRequests = stores.map((store) => store.clear());

    Promise.all(
      clearRequests.map(
        (req) =>
          new Promise((res, rej) => {
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
          }),
      ),
    )
      .then(() => {
        console.log("[OfflineStorage] All offline data cleared");
        resolve();
      })
      .catch(reject);
  });
}

export default {
  initDB,
  addPendingAction,
  getPendingActions,
  markActionSynced,
  deletePendingAction,
  cacheData,
  getCachedData,
  getCachedDataByType,
  clearExpiredCache,
  setSyncMetadata,
  getSyncMetadata,
  clearAllOfflineData,
};
