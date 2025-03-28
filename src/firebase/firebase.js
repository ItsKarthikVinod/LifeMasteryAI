import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export { auth, db };
