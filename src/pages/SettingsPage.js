import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/authContext";
import { updateProfile } from "firebase/auth"; // Import Firebase's updateProfile method
import {
  FaUser,
  FaPalette,
  FaSave,
  FaCamera,
  FaUndo,
  FaClock,
} from "react-icons/fa";

const SettingsPage = () => {
  const { currentUser, theme, toggleTheme } = useAuth(); // Use currentUser directly

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

  const [initialMinutes, setInitialMinutes] = useState(25); // State for Pomodoro initial minutes

  // Load initial minutes from localStorage on component mount
  useEffect(() => {
    const storedMinutes = localStorage.getItem("pomodoroInitialMinutes");
    if (storedMinutes) {
      setInitialMinutes(parseInt(storedMinutes, 10));
    }
  }, []);

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

      // Save initial minutes to localStorage
      localStorage.setItem("pomodoroInitialMinutes", initialMinutes);

      alert("Settings Changes Saved Successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  // const [blockedSites, setBlockedSites] = useState([]);
  // const [newSite, setNewSite] = useState("");
  // const [isBlockingEnabled, setIsBlockingEnabled] = useState(false);

  // useEffect(() => {
  //   const storedSites = JSON.parse(localStorage.getItem("blockedSites")) || [];
  //   setBlockedSites(storedSites);

  //   const blockingStatus =
  //     JSON.parse(localStorage.getItem("isBlockingEnabled")) || false;
  //   setIsBlockingEnabled(blockingStatus);
  // }, []);

  // const saveBlockedSites = (sites) => {
  //   localStorage.setItem("blockedSites", JSON.stringify(sites));
  //   setBlockedSites(sites);
  // };

  // const addBlockedSite = () => {
  //   if (newSite.trim() && !blockedSites.includes(newSite.trim())) {
  //     const updatedSites = [...blockedSites, newSite.trim()];
  //     saveBlockedSites(updatedSites);
  //     setNewSite("");
  //   }
  // };

  // const removeBlockedSite = (site) => {
  //   const updatedSites = blockedSites.filter((s) => s !== site);
  //   saveBlockedSites(updatedSites);
  // };

  // const toggleBlocking = () => {
  //   const newStatus = !isBlockingEnabled;
  //   setIsBlockingEnabled(newStatus);
  //   localStorage.setItem("isBlockingEnabled", JSON.stringify(newStatus));
  // };

  return (
    <div
      className={`p-6 min-h-screen flex items-center justify-center ${
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

        {/* <div className="mb-6">
            <label className="flex items-center mb-4">
              <span className="mr-2 text-lg font-semibold">
                Enable Site Blocking
              </span>
              <div
                className={`relative inline-block w-12 h-6 ${
            isBlockingEnabled ? "bg-teal-500" : "bg-gray-300"
                } rounded-full cursor-pointer transition`}
                onClick={toggleBlocking}
              >
                <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
              isBlockingEnabled ? "transform translate-x-6" : ""
            }`}
                ></span>
              </div>
            </label>

            {isBlockingEnabled && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Blocked Sites</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {blockedSites.map((site, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <span className="text-gray-800 truncate max-w-[70%]">
                  {site}
                </span>
                <button
                  onClick={() => removeBlockedSite(site)}
                  className="text-red-500 hover:text-red-600 transition"
                  title="Remove Site"
                >
                  ✕
                </button>
              </div>
            ))}
                </div>

                <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="Add a site (e.g., facebook.com)"
              className={`flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
                  : "bg-gray-100 border-gray-300 text-gray-800 focus:ring-teal-400"
              }`}
            />
            <button
              onClick={addBlockedSite}
              className="bg-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-600 transition"
            >
              Add
            </button>
                </div>

                <div className="text-sm text-gray-500 italic">
            Tip: You can block sites by entering their domain name (e.g., "example.com").
                </div>
              </div>
            )}
          </div> */}

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
