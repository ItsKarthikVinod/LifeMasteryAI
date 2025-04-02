import React, { useState } from "react";
import { useAuth } from "../contexts/authContext";
import { updateProfile } from "firebase/auth"; // Import Firebase's updateProfile method
import { FaUser, FaPalette, FaSave, FaCamera, FaUndo } from "react-icons/fa";

const SettingsPage = () => {
  const { currentUser, theme, toggleTheme } = useAuth(); // Use currentUser directly

  // Add the initial Google profile picture dynamically
  const profilePictureOptions = [
    currentUser?.providerData?.[0]?.photoURL , // Initial Google profile picture
    "https://avatar.iran.liara.run/public/31",
    "https://avatar.iran.liara.run/public/17",
    "https://avatar.iran.liara.run/public/73",
    "https://avatar.iran.liara.run/public/98",
    "https://avatar.iran.liara.run/public/49",
    "https://avatar.iran.liara.run/public/85",
  ]; // Remove null values if Google profile picture doesn't exist
   // Log the Google profile picture URL
  // State for display name and profile picture
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || ""
  ); // Initialize with currentUser's displayName
  const [selectedPhoto, setSelectedPhoto] = useState(
    currentUser?.photoURL || profilePictureOptions[0]
  ); // Initialize with currentUser's photoURL

  // Reset to original values
  const handleReset = () => {
    setDisplayName(currentUser?.providerData?.[0]?.displayName || ""); // Reset display name
    setSelectedPhoto(currentUser?.providerData?.[0]?.photoURL); // Reset profile picture
  };

  const handleSave = async () => {
    try {
      // Update the currentUser's profile in Firebase
      await updateProfile(currentUser, {
        displayName,
        photoURL: selectedPhoto,
      });
      alert("Settings Changes Saved Successfully!"); // Notify user of success
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

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

        {/* Save and Reset Buttons */}
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
