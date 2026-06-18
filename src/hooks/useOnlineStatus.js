import { useState, useEffect, useCallback } from "react";

/**
 * Enhanced hook to detect online/offline status with connection quality
 * Returns: { isOnline, connectionQuality, isSyncing, syncError }
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState("good"); // good, slow, offline
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Detect connection quality using Network Information API if available
  const checkConnectionQuality = useCallback(() => {
    if ("connection" in navigator) {
      const conn = navigator.connection;
      const effectiveType = conn.effectiveType; // slow-2g, 2g, 3g, 4g

      if (effectiveType === "slow-2g" || effectiveType === "2g") {
        setConnectionQuality("slow");
      } else if (effectiveType === "3g") {
        setConnectionQuality("medium");
      } else {
        setConnectionQuality("good");
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log("[Online] User is now online");
      setIsOnline(true);
      checkConnectionQuality();
      setSyncError(null);
    };

    const handleOffline = () => {
      console.log("[Offline] User is now offline");
      setIsOnline(false);
      setConnectionQuality("offline");
    };

    const handleConnectionChange = () => {
      console.log("[Network] Connection quality changed");
      checkConnectionQuality();
    };

    // Listen for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for connection quality changes (if supported)
    if ("connection" in navigator) {
      const conn = navigator.connection;
      conn.addEventListener("change", handleConnectionChange);
      checkConnectionQuality();
    }

    // Listen for service worker messages about sync status
    const handleSWMessage = (event) => {
      const { type, tag } = event.data;

      if (type === "SYNC_STARTED") {
        console.log(`[Sync] Started: ${tag}`);
        setIsSyncing(true);
      } else if (type === "SYNC_COMPLETE") {
        console.log(`[Sync] Complete: ${tag}`);
        setIsSyncing(false);
      } else if (type === "SYNC_ERROR") {
        console.error(`[Sync] Error: ${event.data.message}`);
        setSyncError(event.data.message);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if ("connection" in navigator) {
        navigator.connection.removeEventListener(
          "change",
          handleConnectionChange,
        );
      }

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [checkConnectionQuality]);

  return {
    isOnline,
    connectionQuality,
    isSyncing,
    syncError,
  };
};

export default useOnlineStatus;
