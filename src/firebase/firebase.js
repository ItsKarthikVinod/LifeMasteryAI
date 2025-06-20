import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "lifemaster-37373.firebaseapp.com",
  projectId: "lifemaster-37373",
  storageBucket: "lifemaster-37373.firebasestorage.app",
  messagingSenderId: "717688763336",
  appId: "1:717688763336:web:43e888fb6ee6eeec4e06fd",
  measurementId: "G-5P1D2VD8Z6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Persistence can only be enabled in one tab at a time.");
  } else if (err.code === "unimplemented") {
    console.warn("Persistence is not available in this browser.");
  }
});

export { auth, db, messaging, getToken, onMessage };
