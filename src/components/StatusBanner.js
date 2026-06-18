import React, { useEffect, useState, useRef } from "react";
import useOnlineStatus from "../hooks/useOnlineStatus";

const StatusBanner = () => {
  const { isOnline, connectionQuality, isSyncing, syncError } =
    useOnlineStatus();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [icon, setIcon] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    let displayMessage = "";
    let displayIcon = "";

    if (isSyncing) {
      displayMessage = "Syncing offline changes...";
      displayIcon = "⏳";
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (syncError) {
      displayMessage = `Sync failed: ${syncError}. Will retry when connection improves.`;
      displayIcon = "⚠️";
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShow(false), 5000);
    } else if (!isOnline) {
      displayMessage = "📡 Offline - Changes will sync when back online";
      displayIcon = "🔴";
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (connectionQuality === "slow") {
      displayMessage = "🐢 Slow connection - Some features may be limited";
      displayIcon = "🟡";
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShow(false), 3000);
    } else if (connectionQuality === "medium") {
      // Don't show for medium - it's fine
      displayMessage = "✅ Online";
      setShow(false);
    } else {
      displayMessage = "✅ Online";
      displayIcon = "🟢";
      setShow(false);
    }

    setMessage(displayMessage);
    setIcon(displayIcon);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOnline, connectionQuality, isSyncing, syncError]);

  // Determine banner color and styling
  const getBannerColor = () => {
    if (isSyncing) return "bg-blue-500/80";
    if (syncError) return "bg-yellow-600/80";
    if (!isOnline) return "bg-red-500/80";
    if (connectionQuality === "slow") return "bg-orange-500/80";
    return "bg-green-500/80";
  };

  return (
    <div
      className={`transition-all duration-500 ease-in-out fixed left-0 w-full z-40 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-10 pointer-events-none"
      } ${getBannerColor()} text-white text-center py-2 px-4`}
      style={{ top: "105px" }} // Adjust if your navbar height is different
    >
      <div className="flex items-center justify-center gap-2">
        <span className={isSyncing ? "animate-spin" : "animate-pulse"}>
          {icon}
        </span>
        <span>{message}</span>
        {isSyncing && (
          <span className="inline-block">
            <svg
              className="animate-spin h-4 w-4 ml-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusBanner;
