import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'
import 'animate.css';
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { AuthProvider } from './contexts/authContext';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 
    <AuthProvider>

        <App />
    </AuthProvider>
    
  
  
);

// index.js
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").then(
        (reg) => {
          console.log("✅ LifeMastery Service Worker registered:", reg);
        },
        (err) => {
          console.error("❌ Service Worker registration failed:", err);
        }
      );
    });
  }
  
serviceWorkerRegistration.register();