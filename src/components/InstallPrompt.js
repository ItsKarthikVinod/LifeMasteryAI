import React, { useEffect, useState } from "react";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setShowBanner(false);
    }
  };

  const handleClose = () => setShowBanner(false);

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[95vw] max-w-md
        transition-all duration-500 ease-out
        ${
          showBanner
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }
      `}
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl shadow-lg px-6 py-4 animate-slide-up">
        <span className="font-semibold text-lg">
          🚀 Install <span className="font-bold">LifeMastery</span> for the best
          experience!
        </span>
        <div className="flex items-center ml-4">
          <button
            className="bg-white text-orange-600 font-bold px-4 py-2 rounded-lg shadow hover:bg-orange-100 transition-colors duration-200 mr-2"
            onClick={handleInstall}
          >
            Install
          </button>
          <button
            className="text-white text-2xl font-bold hover:text-orange-200 transition-colors duration-200"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
      <style>
        {`
          @keyframes slide-up {
            0% { opacity: 0; transform: translateY(40px);}
            100% { opacity: 1; transform: translateY(0);}
          }
          .animate-slide-up {
            animation: slide-up 0.5s cubic-bezier(0.4,0,0.2,1);
          }
        `}
      </style>
    </div>
  );
}
