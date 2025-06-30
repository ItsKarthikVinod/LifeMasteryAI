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
} from "react-icons/fa";
import { db } from "../firebase/firebase";
import { collection, addDoc, setDoc, doc, getDocs } from "firebase/firestore";

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

  useEffect(() => {
      // Scroll to the top of the page when the component is mounted
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
        setAdminList([...ADMIN_EMAILS, ...emails.filter(e => !ADMIN_EMAILS.includes(e))]);
      } catch (err) {
        setAdminList(ADMIN_EMAILS);
      }
      setLoadingAdmins(false);
    };
    fetchAdmins();
  }, []);

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
    await addDoc(collection(db, "motivation"), {
      text: motivationText.trim(),
      createdBy: currentUser.email,
      createdAt: new Date(),
    });
    setMotivationText("");
    setShowMotivationModal(false);
    alert("Motivation quote added!");
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
      prev.includes(adminEmail.trim())
        ? prev
        : [...prev, adminEmail.trim()]
    );
    alert("Admin added!");
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center pt-28 sm:pt-32 px-2 sm:px-4 ${
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
              <FaQuoteLeft className="mr-2" /> Add Motivation Quote
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold shadow hover:from-yellow-500 hover:to-yellow-600 transition"
              type="button"
            >
              <FaUserPlus className="mr-2" /> Add Admin
            </button>
          </div>
        )}

        {/* Motivation Modal */}
        {showMotivationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              onSubmit={handleAddMotivation}
              className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center"
              style={{ minWidth: 320 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-teal-700 flex items-center gap-2">
                <FaQuoteLeft /> Add Motivation Quote
              </h2>
              <textarea
                className="w-full border border-teal-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                rows={3}
                placeholder="Enter a motivational quote..."
                value={motivationText}
                onChange={(e) => setMotivationText(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold shadow hover:bg-teal-700 transition"
                >
                  Add
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-400 transition"
                  onClick={() => setShowMotivationModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Admin Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              onSubmit={handleAddAdmin}
              className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center"
              style={{ minWidth: 320 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-teal-700 flex items-center gap-2">
                <FaUserPlus /> Add Admin
              </h2>
              <input
                className="w-full border border-teal-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                type="email"
                placeholder="Enter admin email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold shadow hover:bg-teal-700 transition"
                  disabled={loadingAdmins}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-400 transition"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ...rest of your settings page... */}
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