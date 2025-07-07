import React from "react";

const GuestButton = ({ onClick, loading = false, className = "" }) => (
  <button
    disabled={loading}
    onClick={onClick}
    className={`
      w-full flex items-center justify-center gap-x-2 py-2.5 px-4 rounded-lg text-base font-semibold mt-2
      bg-white/30 border border-blue-200 text-blue-800 shadow
      hover:bg-blue-100/40 hover:border-blue-300 transition duration-200
      ${loading ? "cursor-not-allowed opacity-60" : ""}
      ${className}
    `}
    style={{ letterSpacing: "0.01em" }}
  >
    <span role="img" aria-label="guest" className="text-lg opacity-70">
      👤
    </span>
    {loading ? "Signing In as Guest..." : "Continue as Guest (Demo Mode)"}
  </button>
);

export default GuestButton;
