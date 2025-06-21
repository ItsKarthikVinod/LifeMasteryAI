importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
// public/service-worker.js
self.addEventListener("install", (e) => {
  console.log("✅ LifeMastery Service Worker Installed");
});

self.addEventListener("activate", (e) => {
  console.log("✅ LifeMastery Service Worker Activated");
});
