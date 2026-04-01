import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTrashAlt, FaCheckSquare } from "react-icons/fa";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "../contexts/authContext";
import NOTIF_SOUND_URL from "../assets/notification.mp3";

function playNotificationSound() {
  try {
    const audio = new Audio(NOTIF_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch((err) => console.warn("Sound play failed:", err));
  } catch (err) {
    console.warn("Audio not supported:", err);
  }
}

function NotificationBell() {
  const { currentUser, theme } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const existingIdsRef = useRef(new Set());
  const containerRef = useRef(null);

  // Real-time fetch notifications from Firestore (already ordered by timestamp desc)
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Play sound for new items not part of existing set (unread)
        const newNotify = docs.filter(
          (n) => !existingIdsRef.current.has(n.id) && !n.read,
        );
        if (newNotify.length > 0) {
          playNotificationSound();
        }

        existingIdsRef.current = new Set(docs.map((n) => n.id));
        setNotifications(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Notification snapshot error:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [currentUser?.uid]);

  // Handle click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    // Add listener when notification panel is open
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) =>
      batch.update(doc(db, "notifications", n.id), { read: true }),
    );
    await batch.commit();
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all notifications?")) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
    setOpen(false); // Close panel after deleting all
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const panelClass = `absolute right-0 mt-2 w-80 border rounded-xl shadow-2xl z-[10000] transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
    theme === "dark"
      ? "bg-gradient-to-br from-gray-900 via-teal-900 to-blue-900 border-gray-700 text-gray-100"
      : "bg-gradient-to-br from-white via-blue-100 to-teal-100 border-gray-300 text-gray-800"
  }`;
  const headerClass = `p-4 font-extrabold text-lg flex items-center gap-2 border-b ${
    theme === "dark"
      ? "border-teal-700 bg-gradient-to-r from-teal-900 via-gray-900 to-blue-900 text-teal-300"
      : "border-teal-300 bg-gradient-to-r from-teal-100 via-blue-100 to-white text-teal-700"
  }`;

  const getItemClass = (read) =>
    `p-4 border-b last:border-b-0 flex flex-col gap-1 transition-all duration-200 rounded-lg cursor-pointer ${
      read
        ? theme === "dark"
          ? "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
          : "bg-blue-50 text-gray-400 border-gray-200 hover:bg-blue-100"
        : theme === "dark"
          ? "bg-gradient-to-r from-teal-900 via-gray-900 to-blue-900 text-teal-100 border-gray-700 hover:bg-teal-800"
          : "bg-gradient-to-r from-white via-blue-100 to-teal-100 text-gray-800 border-gray-200 hover:bg-teal-50"
    }`;

  const timeAgo = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left lg:mr-4 ml-4 lg:mt-2"
    >
      <button
        className={`relative focus:outline-none transition-transform duration-200 hover:scale-110 ${
          theme === "dark" ? "hover:text-teal-300" : "hover:text-teal-600"
        }`}
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        aria-label="Notifications"
        type="button"
      >
        <FaBell className="text-2xl text-white drop-shadow-lg" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-2 py-0.5 font-bold shadow-lg border-2 flex items-center justify-center animate-pulse ${
              theme === "dark" ? "border-gray-900" : "border-white"
            }`}
            style={{ minWidth: 22, height: 22, fontSize: 13 }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className={panelClass}>
          <div className={headerClass}>
            <FaBell className="text-xl" />
            <span>Notifications</span>
            <div className="ml-auto flex gap-2">
              <button
                className="text-xs underline hover:opacity-80 transition"
                onClick={handleMarkAllRead}
                title="Mark all as read"
                type="button"
              >
                <FaCheckSquare className="inline size-4 mr-1" />
              </button>
              <button
                className="text-xs underline text-red-300 hover:text-red-400 transition"
                onClick={handleDeleteAll}
                title="Delete all notifications"
                type="button"
              >
                <FaTrashAlt className="inline size-4" />
              </button>
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto custom-scrollbar">
            {loading ? (
              <li
                className={`p-4 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Loading...
              </li>
            ) : notifications.length === 0 ? (
              <li
                className={`p-4 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                No notifications
              </li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className={getItemClass(n.read)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1">{n.text}</span>
                    {!n.read && (
                      <button
                        className={`ml-2 w-5 h-5 border-2 rounded flex items-center justify-center transition-colors hover:scale-110 ${
                          theme === "dark"
                            ? "border-teal-400 bg-gray-900 hover:bg-teal-900"
                            : "border-teal-600 bg-white hover:bg-teal-100"
                        }`}
                        title="Mark as read"
                        onClick={() => handleRead(n.id)}
                        type="button"
                        style={{ padding: 0 }}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                  <span
                    className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {n.timestamp?.toDate ? timeAgo(n.timestamp.toDate()) : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
