import React from "react";
import Logo from "../assets/LifeMasteryLogo.png"; // Adjust path if needed

const Loader = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-teal-400 to-blue-500">
    <div className="relative flex flex-col items-center">
      <div className="animate-spin-slow rounded-full border-8 border-teal-200 border-t-teal-600 w-32 h-32 flex items-center justify-center shadow-lg">
        <img
          src={Logo}
          alt="Logo"
          className="w-20 h-20 rounded-full object-cover shadow-xl"
        />
      </div>
      <span className="mt-6 text-5xl font-extrabold text-white tracking-widest drop-shadow-lg animate-pulse">
        KV
      </span>
      <span className="mt-2 text-lg text-white opacity-80 animate-pulse">
        Loading...
      </span>
    </div>
    <style>
      {`
        .animate-spin-slow {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}
    </style>
  </div>
);

export default Loader;
