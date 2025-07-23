import React, { useState, useEffect } from "react";
import { FaBell, FaTrashAlt } from "react-icons/fa";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch
} from "firebase/firestore";
import { useAuth } from "../contexts/authContext";

function NotificationBell() {
  const { currentUser, theme } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time fetch notifications from Firestore for the current user
  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Mark notification as read
  const handleRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  // Mark all as read for a notification type
  const handleMarkAllReadType = async (type) => {
    const unread = notifications.filter((n) => !n.read && n.type === type);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  // Delete all notifications of a type
  const handleDeleteAllType = async (type) => {
    if (!window.confirm(`Delete all '${type}' notifications?`)) return;
    const batch = writeBatch(db);
    notifications.filter((n) => n.type === type).forEach((n) => {
      batch.delete(doc(db, "notifications", n.id));
    });
    await batch.commit();
  };

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Panel styling for dark/light mode
  const panelClass = `absolute right-0 mt-2 w-80 border rounded-xl shadow-2xl z-[10000] transition-all duration-300
    ${
      theme === "dark"
        ? "bg-gradient-to-br from-gray-900 via-teal-900 to-blue-900 border-gray-700 text-gray-100"
        : "bg-gradient-to-br from-white via-blue-100 to-teal-100 border-gray-300 text-gray-800"
    }`;

  // Header styling
  const headerClass = `p-4 font-extrabold text-lg flex items-center gap-2 border-b
    ${
      theme === "dark"
        ? "border-teal-700 bg-gradient-to-r from-teal-900 via-gray-900 to-blue-900 text-teal-300"
        : "border-teal-300 bg-gradient-to-r from-teal-100 via-blue-100 to-white text-teal-700"
    }`;

  // Notification item styling
  const getItemClass = (read) =>
    `p-4 border-b last:border-b-0 flex flex-col gap-1 transition-all duration-200 rounded-lg
    ${
      read
        ? theme === "dark"
          ? "bg-gray-800 text-gray-400 border-gray-700"
          : "bg-blue-50 text-gray-400 border-gray-200"
        : theme === "dark"
        ? "bg-gradient-to-r from-teal-900 via-gray-900 to-blue-900 text-teal-100 border-gray-700 hover:bg-teal-800"
        : "bg-gradient-to-r from-white via-blue-100 to-teal-100 text-gray-800 border-gray-200 hover:bg-teal-50"
    }`;

  // Icon for notification type
  const getTypeIcon = (type) => {
    switch (type) {
      case "reward":
        return <span className="mr-2 text-yellow-400">🎁</span>;
      case "habit":
        return <span className="mr-2 text-green-400">🔥</span>;
      case "milestone":
        return <span className="mr-2 text-blue-400">🏆</span>;
      case "reminder":
        return <span className="mr-2 text-teal-400">⏰</span>;
      case "inactive":
        return <span className="mr-2 text-gray-400">💤</span>;
      case "community":
        return <span className="mr-2 text-purple-400">👥</span>;
      case "system":
        return <span className="mr-2 text-gray-500">🛠️</span>;
      default:
        return <span className="mr-2 text-teal-400">🔔</span>;
    }
  };

  // Group notifications by type for grouped actions
  const grouped = notifications.reduce((acc, n) => {
    acc[n.type] = acc[n.type] || [];
    acc[n.type].push(n);
    return acc;
  }, {});

  return (
    <div className="relative inline-block text-left lg:mr-4 ml-4 lg:mt-2">
      <button
        className={`relative focus:outline-none transition-transform duration-200 hover:scale-110 ${
          theme === "dark" ? "hover:text-teal-300" : "hover:text-teal-600"
        }`}
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        aria-label="Notifications"
      >
        <FaBell
          className={`text-2xl text-white drop-shadow-lg`}
        />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-2 py-0.5 font-bold shadow-lg border-2 flex items-center justify-center ${
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
            Notifications
          </div>
          <ul className="max-h-64 overflow-y-auto custom-scrollbar">
            {loading ? (
              <li
                className={`p-4 text-center ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Loading...
              </li>
            ) : notifications.length === 0 ? (
              <li
                className={`p-4 text-center ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No notifications
              </li>
            ) : (
              Object.entries(grouped).map(([type, group]) => (
                <li key={type} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-semibold text-base">
                      {getTypeIcon(type)}
                      <span>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {group.some((n) => !n.read) && (
                        <button
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition
                            ${
                              theme === "dark"
                                ? "bg-teal-800 text-teal-200 hover:bg-teal-700"
                                : "bg-teal-100 text-teal-700 hover:bg-teal-200"
                            }`}
                          onClick={() => handleMarkAllReadType(type)}
                          title="Mark all as read"
                        >
                          <span
                            className={` w-4 h-4 border-2 rounded bg-white flex items-center justify-center ${
                              theme === "dark"
                                ? "border-teal-400"
                                : "border-teal-600"
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14">
                              <rect width="14" height="14" rx="3" fill="none" />
                              <polyline
                                points="3,7 6,10 11,4"
                                fill="none"
                                stroke={theme === "dark" ? "#14b8a6" : "#0d9488"}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          Mark all as read
                        </button>
                      )}
                      {group.length > 0 && (
                        <button
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition
                            ${
                              theme === "dark"
                                ? "bg-red-900 text-red-200 hover:bg-red-800"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          onClick={() => handleDeleteAllType(type)}
                          title="Delete all"
                        >
                          <FaTrashAlt className="text-base" />
                          Delete all
                        </button>
                      )}
                    </div>
                  </div>
                  <ul>
                    {group.map((n) => (
                      <li
                        key={n.id}
                        className={getItemClass(n.read)}
                        style={{
                          opacity: n.read ? 0.7 : 1,
                          cursor: n.read ? "default" : "pointer",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex-1">{n.text}</span>
                          {!n.read && (
                            <button
                              className={`ml-2 w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                theme === "dark"
                                  ? "border-teal-400 bg-gray-900 hover:bg-teal-900"
                                  : "border-teal-600 bg-white hover:bg-teal-100"
                              }`}
                              title="Mark as read"
                              onClick={() => handleRead(n.id)}
                              style={{ padding: 0 }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16">
                                <rect width="16" height="16" rx="4" fill="none" />
                                <polyline
                                  points="4,8 7,11 12,5"
                                  fill="none"
                                  stroke={theme === "dark" ? "#14b8a6" : "#0d9488"}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                        <span
                          className={`text-xs ${
                            theme === "dark" ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {n.timestamp?.toDate ? timeAgo(n.timestamp.toDate()) : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))
            )}
          </ul>
          <div
            className={`w-full h-2 rounded-b-xl ${
              theme === "dark"
                ? "bg-gradient-to-r from-teal-900 via-blue-900 to-gray-900"
                : "bg-gradient-to-r from-teal-200 via-blue-100 to-white"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
}

// Helper: time ago formatting
function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default NotificationBell;