import React, { useEffect, useState, useRef } from "react";
import useOnlineStatus from "../hooks/useOnlineStatus";

const StatusBanner = () => {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isOnline) {
      setMessage("Offline - Changes will sync when you're back online");
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      // Only show "Back Online" if coming from offline
      setMessage("Back Online");
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShow(false), 2500);
    }
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOnline]);

  return (
    <div
      className={`transition-all duration-500 ease-in-out fixed left-0 w-full z-40 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-10 pointer-events-none"
      } ${
        isOnline ? "bg-green-500/80" : "bg-red-500/80"
      } text-white text-center py-2`}
      style={{ top: "105px" }} // Adjust if your navbar height is different
    >
      <span className="animate-pulse">{message}</span>
    </div>
  );
};

export default StatusBanner;
