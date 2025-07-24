importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

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

messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
