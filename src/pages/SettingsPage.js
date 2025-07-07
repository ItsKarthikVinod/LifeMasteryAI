import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/authContext";
import { updateProfile } from "firebase/auth";
import {
  FaUser,
  FaPalette,
  FaSave,
  FaCamera,
  FaUndo,
  FaClock,
  FaQuoteLeft,
  FaUserPlus,
  FaTrash,
  FaEdit,
  FaTimes,
} from "react-icons/fa";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";

const ADMIN_EMAILS = [];

const SettingsPage = () => {
  const { currentUser, theme, toggleTheme } = useAuth();

  const profilePictureOptions = [
    ...(currentUser?.providerData?.[0]?.providerId === "google.com" &&
    currentUser?.providerData?.[0]?.photoURL
      ? [currentUser?.providerData?.[0]?.photoURL]
      : ""),
    "https://raw.githubusercontent.com/ItsKarthikVinod/lifemastery-assets/refs/heads/main/av-1.png",
    "https://raw.githubusercontent.com/ItsKarthikVinod/lifemastery-assets/refs/heads/main/av-2.png",
    "https://raw.githubusercontent.com/ItsKarthikVinod/lifemastery-assets/refs/heads/main/av-3.png",
    "https://raw.githubusercontent.com/ItsKarthikVinod/lifemastery-assets/refs/heads/main/av-4.png",
    "https://raw.githubusercontent.com/ItsKarthikVinod/lifemastery-assets/refs/heads/main/av-5.png",
  ];

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || ""
  );
  const [selectedPhoto, setSelectedPhoto] = useState(
    currentUser?.photoURL || profilePictureOptions[0]
  );
  const [initialMinutes, setInitialMinutes] = useState(25);

  // Admin features
  const [motivationText, setMotivationText] = useState("");
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminList, setAdminList] = useState(ADMIN_EMAILS);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Motivation quotes state
  const [motivationQuotes, setMotivationQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [editQuoteId, setEditQuoteId] = useState(null);
  const [editQuoteText, setEditQuoteText] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load initial minutes from localStorage on component mount
  useEffect(() => {
    const storedMinutes = localStorage.getItem("pomodoroInitialMinutes");
    if (storedMinutes) {
      setInitialMinutes(parseInt(storedMinutes, 10));
    }
  }, []);

  // Fetch admin list from Firestore
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoadingAdmins(true);
      try {
        const snapshot = await getDocs(collection(db, "admins"));
        const emails = snapshot.docs.map((doc) => doc.id);
        setAdminList([
          ...ADMIN_EMAILS,
          ...emails.filter((e) => !ADMIN_EMAILS.includes(e)),
        ]);
      } catch (err) {
        setAdminList(ADMIN_EMAILS);
      }
      setLoadingAdmins(false);
    };
    fetchAdmins();
  }, []);

  // Fetch motivation quotes from Firestore
  useEffect(() => {
    const fetchQuotes = async () => {
      setLoadingQuotes(true);
      try {
        const q = query(
          collection(db, "motivation"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setMotivationQuotes(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (err) {
        setMotivationQuotes([]);
      }
      setLoadingQuotes(false);
    };
    fetchQuotes();
  }, []);

  // Helper: check if current user is admin
  const isAdmin =
    currentUser &&
    (ADMIN_EMAILS.includes(currentUser.email) ||
      adminList.includes(currentUser.email));

  const handleReset = () => {
    setDisplayName(currentUser?.providerData?.[0]?.displayName || "");
    setSelectedPhoto(currentUser?.providerData?.[0]?.photoURL);
  };

  const handleSave = async () => {
    try {
      await updateProfile(currentUser, {
        displayName,
        photoURL: selectedPhoto,
      });

      localStorage.setItem("pomodoroInitialMinutes", initialMinutes);

      alert("Settings Changes Saved Successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  // Add motivation quote to Firestore
  const handleAddMotivation = async (e) => {
    e.preventDefault();
    if (!motivationText.trim()) return;
    const docRef = await addDoc(collection(db, "motivation"), {
      text: motivationText.trim(),
      createdBy: currentUser.email,
      createdAt: new Date(),
    });
    setMotivationQuotes((prev) => [
      {
        id: docRef.id,
        text: motivationText.trim(),
        createdBy: currentUser.email,
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setMotivationText("");
    setShowMotivationModal(false);
    alert("Motivation quote added!");
  };

  // Edit motivation quote
  const handleEditQuote = (quote) => {
    setEditQuoteId(quote.id);
    setEditQuoteText(quote.text);
  };

  const handleUpdateQuote = async (e) => {
    e.preventDefault();
    if (!editQuoteText.trim()) return;
    await updateDoc(doc(db, "motivation", editQuoteId), {
      text: editQuoteText.trim(),
    });
    setMotivationQuotes((prev) =>
      prev.map((q) =>
        q.id === editQuoteId ? { ...q, text: editQuoteText.trim() } : q
      )
    );
    setEditQuoteId(null);
    setEditQuoteText("");
    alert("Motivation quote updated!");
  };

  // Delete motivation quote
  const handleDeleteQuote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quote?")) return;
    await deleteDoc(doc(db, "motivation", id));
    setMotivationQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  // Add new admin to Firestore
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim()) return;
    await setDoc(doc(db, "admins", adminEmail.trim()), {
      addedBy: currentUser.email,
      addedAt: new Date(),
    });
    setAdminEmail("");
    setShowAdminModal(false);
    setAdminList((prev) =>
      prev.includes(adminEmail.trim()) ? prev : [...prev, adminEmail.trim()]
    );
    alert("Admin added!");
  };

  const isGuest = currentUser && currentUser.isAnonymous;

  // Delete admin
  const handleDeleteAdmin = async (email) => {
    if (!window.confirm("Are you sure you want to remove this admin?")) return;
    await deleteDoc(doc(db, "admins", email));
    setAdminList((prev) => prev.filter((e) => e !== email));
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center pt-28 sm:pt-32 px-2 sm:px-4 ${
        isGuest === true ? "pt-[7rem] lg:pt-16" : "pt-0"
      }  ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-teal-900 to-gray-800 text-white"
          : "bg-gradient-to-br from-teal-100 via-teal-300 to-blue-200 text-gray-800"
      }`}
    >
      <div
        className={`max-w-4xl mx-auto my-auto shadow-lg rounded-lg p-8 ${
          theme === "dark" ? "bg-gray-800/40" : "bg-white/80"
        }`}
      >
        <h1
          className={`text-4xl font-extrabold mb-8 text-center ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
        >
          Settings
        </h1>

        {/* Admin features */}
        {isAdmin && (
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <button
              onClick={() => setShowMotivationModal(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold shadow hover:from-yellow-500 hover:to-yellow-600 transition"
              type="button"
            >
              <FaQuoteLeft className="mr-2" /> Manage Motivation Quotes
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold shadow hover:from-yellow-500 hover:to-yellow-600 transition"
              type="button"
            >
              <FaUserPlus className="mr-2" /> Manage Admins
            </button>
          </div>
        )}

        {/* Motivation Quotes Modal */}
        {showMotivationModal && (
          <div
            className={`fixed inset-0 ${
              theme === "dark" ? "bg-white/80" : "bg-gray-800/70"
            } flex items-center justify-center z-50`}
          >
            <div
              className={`rounded-xl ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              } shadow-lg p-8 flex flex-col items-center max-h-[90vh] overflow-y-auto`}
              style={{ minWidth: 350, width: "100%", maxWidth: 500 }}
            >
              <div className="flex w-full justify-between items-center mb-4">
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-teal-300" : "text-teal-700"
                  } flex items-center gap-2`}
                >
                  <FaQuoteLeft /> Motivation Quotes
                </h2>
                <button
                  className="ml-2 px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick={() => setShowMotivationModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              {/* Add new quote */}
              <form
                onSubmit={handleAddMotivation}
                className="w-full flex flex-col gap-2 mb-4"
              >
                <textarea
                  className="w-full border border-teal-300 rounded-lg px-3 text-black py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                  rows={2}
                  placeholder="Enter a motivational quote..."
                  value={motivationText}
                  onChange={(e) => setMotivationText(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold shadow hover:bg-teal-700 transition self-end"
                >
                  Add
                </button>
              </form>
              {/* Quotes list */}
              {loadingQuotes ? (
                <div className="text-center text-gray-500">
                  Loading quotes...
                </div>
              ) : motivationQuotes.length === 0 ? (
                <div className="text-center text-gray-500">
                  No motivation quotes found.
                </div>
              ) : (
                <ul className="space-y-4 w-full">
                  {motivationQuotes.map((quote) => (
                    <li
                      key={quote.id}
                      className={`p-3 rounded-lg shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        theme === "dark"
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {editQuoteId === quote.id ? (
                        <form
                          onSubmit={handleUpdateQuote}
                          className="flex flex-col sm:flex-row gap-2 w-full"
                        >
                          <input
                            className="flex-1 px-3 py-2 rounded border border-teal-400 text-black"
                            value={editQuoteText}
                            onChange={(e) => setEditQuoteText(e.target.value)}
                            required
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              onClick={() => setEditQuoteId(null)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="block">{quote.text}</span>
                            <span className="block text-xs mt-1 text-gray-500">
                              {quote.createdBy}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                              onClick={() => handleEditQuote(quote)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                              onClick={() => handleDeleteQuote(quote.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Admins Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-h-[90vh] overflow-y-auto"
              style={{ minWidth: 350, width: "100%", maxWidth: 500 }}
            >
              <div className="flex w-full justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-teal-700 flex items-center gap-2">
                  <FaUserPlus /> Admins
                </h2>
                <button
                  className="ml-2 px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick={() => setShowAdminModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              {/* Add new admin */}
              <form
                onSubmit={handleAddAdmin}
                className="w-full flex flex-col gap-2 mb-4"
              >
                <input
                  className="w-full border border-teal-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition text-black"
                  type="email"
                  placeholder="Enter admin email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold shadow hover:bg-teal-700 transition self-end"
                  disabled={loadingAdmins}
                >
                  Add
                </button>
              </form>
              {/* Admins list */}
              {loadingAdmins ? (
                <div className="text-center text-gray-500">
                  Loading admins...
                </div>
              ) : adminList.length === 0 ? (
                <div className="text-center text-gray-500">
                  No admins found.
                </div>
              ) : (
                <ul className="space-y-2 w-full">
                  {adminList.map((email) => (
                    <li
                      key={email}
                      className={`p-3 rounded flex items-center justify-between ${
                        theme === "dark"
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <span>{email}</span>
                      <button
                        className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => handleDeleteAdmin(email)}
                        disabled={email === currentUser.email}
                        title={
                          email === currentUser.email
                            ? "You can't remove yourself"
                            : "Remove admin"
                        }
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Display Name Section */}
        <div className="mb-8">
          <label className="text-lg font-medium mb-2 flex items-center">
            <FaUser className="mr-2" />
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
                : "bg-gray-100 border-gray-300 text-gray-800 focus:ring-teal-400"
            }`}
            placeholder="Enter your display name"
          />
        </div>

        {/* Profile Picture Section */}
        <div className="mb-8">
          <label className="text-lg font-medium mb-4 flex items-center">
            <FaCamera className="mr-2" />
            Profile Picture
          </label>
          <div className="flex flex-wrap gap-4">
            {profilePictureOptions.map((option, index) => (
              <img
                key={index}
                src={option}
                alt={`Profile Option ${index + 1}`}
                className={`w-24 h-24 rounded-full cursor-pointer border-4 ${
                  selectedPhoto === option
                    ? "border-teal-500"
                    : "border-transparent"
                } transition-transform transform hover:scale-105`}
                onClick={() => setSelectedPhoto(option)}
              />
            ))}
          </div>
        </div>

        {/* Pomodoro Initial Minutes Section */}
        <div className="mb-8">
          <label className="text-lg font-medium mb-4 flex items-center">
            <FaClock className="mr-2" />
            Pomodoro Timer Initial Minutes
          </label>
          <input
            type="number"
            value={initialMinutes}
            onChange={(e) => setInitialMinutes(parseInt(e.target.value, 10))}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
                : "bg-gray-100 border-gray-300 text-gray-800 focus:ring-teal-400"
            }`}
            placeholder="Enter initial minutes"
            min="1"
          />
          <p className="text-sm mt-2 text-gray-500">
            Set the default duration for your Pomodoro timer.
          </p>
        </div>

        {/* Theme Section */}
        <div className="mb-8">
          <label className="block text-lg font-medium mb-4 flex items-center">
            <FaPalette className="mr-2" />
            Theme
          </label>
          <button
            onClick={toggleTheme}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-bold shadow-md transition-transform transform hover:scale-105 ${
              theme === "dark"
                ? "bg-gradient-to-r from-teal-700 to-teal-600 text-white hover:from-teal-500 hover:to-teal-400"
                : "bg-gradient-to-r from-teal-500 to-teal-400 text-white hover:from-teal-300 hover:to-teal-200"
            }`}
          >
            Switch to {theme === "light" ? "Dark" : "Light"} Mode
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleSave}
            className={`px-8 py-3 rounded-lg font-bold shadow-md transition-transform transform hover:scale-105 ${
              theme === "dark"
                ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:from-blue-500 hover:to-teal-400"
                : "bg-gradient-to-r from-blue-500 to-teal-400 text-white hover:from-blue-400 hover:to-teal-300"
            }`}
          >
            <FaSave className="inline-block mr-2" />
            Save Changes
          </button>
          {currentUser.providerData[0]?.providerId === "google.com" && (
            <button
              onClick={handleReset}
              className={`px-8 py-3 rounded-lg font-bold shadow-md transition-transform transform hover:scale-105 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-gray-600 to-gray-500 text-white hover:from-gray-500 hover:to-gray-400"
                  : "bg-gradient-to-r from-gray-300 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-100"
              }`}
            >
              <FaUndo className="inline-block mr-2" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;