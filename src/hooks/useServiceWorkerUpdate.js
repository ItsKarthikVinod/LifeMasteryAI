import { useEffect, useState } from "react";

/**
 * Hook to detect and handle service worker updates
 * Notifies user when a new version is available
 */
export function useServiceWorkerUpdate(onUpdateAvailable) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log("[PWA] Service Workers not supported");
      return;
    }

    const handleControllerChange = () => {
      console.log("[PWA] Service Worker updated, reloading page");
      // Reload the page to load the new service worker
      window.location.reload();
    };

    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          console.log("[PWA] No service worker registration found");
          return;
        }

        setRegistration(reg);

        // Check for updates periodically (every 6 hours)
        const updateInterval = setInterval(
          async () => {
            try {
              await reg.update();
              console.log("[PWA] Checked for SW updates");
            } catch (error) {
              console.error("[PWA] Error checking for SW updates:", error);
            }
          },
          6 * 60 * 60 * 1000,
        ); // 6 hours

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          console.log("[PWA] New service worker version found");
          const newWorker = reg.installing;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is ready
              console.log("[PWA] New SW installed and ready to activate");
              setUpdateAvailable(true);

              // Notify callback if provided
              if (onUpdateAvailable) {
                onUpdateAvailable({
                  registration: reg,
                  newWorker,
                  skipWaiting: () => {
                    console.log("[PWA] Requesting SW to skip waiting");
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  },
                });
              }
            }
          });
        });

        // Listen for controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          handleControllerChange,
        );

        return () => {
          clearInterval(updateInterval);
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            handleControllerChange,
          );
        };
      } catch (error) {
        console.error("[PWA] Error in useServiceWorkerUpdate:", error);
      }
    };

    checkForUpdates();
  }, [onUpdateAvailable]);

  return {
    updateAvailable,
    registration,
    skipWaiting: () => {
      if (registration?.installing) {
        registration.installing.postMessage({ type: "SKIP_WAITING" });
      }
    },
  };
}

export default useServiceWorkerUpdate;
