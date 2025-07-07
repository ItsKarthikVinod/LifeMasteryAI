import React from "react";

const DemoModeBanner = () => (
  <div
    className="fixed left-0 w-full bg-blue-100/80 border-b border-blue-300 text-blue-900 px-4 py-2 shadow-sm font-medium text-sm flex items-center justify-center backdrop-blur-md z-30 mb-2 transition-all duration-500 ease-in opacity-100"
    style={{ top: '105px' }} 
  >
    <span className="mr-2 text-base">👤</span>
    <span>
      <b>Demo Mode:</b> You are signed in as <b>Guest</b>. Your data will{" "}
      <b>not</b> be saved permanently and may be cleared at any time.
    </span>
  </div>
);

export default DemoModeBanner;
