import React from "react";
import {
  FaChalkboard,
  FaDice,
  FaSyncAlt,
  FaImages
} from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Add this import
import { useAuth } from "../contexts/authContext"; // Import the auth context

const MotivationReminderWidget = ({ openRouletteModal }) => {
  const theme = useAuth().theme; // Get the theme from context
  const navigate = useNavigate();
  const dailyQuotes = [
    "Every day is a new beginning.",
    "Small steps lead to big results.",
    "You are capable of amazing things.",
    "Stay positive, work hard.",
    "Progress, not perfection.",
  ];

  const getRandomQuote = () =>
    dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];

  const [motivation, setMotivation] = React.useState(getRandomQuote());

  // Quick Access actions (replace with your actual handlers)
  const handleQuickWhiteBoard = () => navigate("/whiteboard");
  const handleQuickGallery = () => navigate("/whiteboard-gallery");
  

  return (
    <div
      className={`p-4  rounded-lg shadow flex flex-col gap-2 ${
        theme === "dark"
          ? "bg-gray-800/30 text-gray-300"
          : "bg-teal-100/70 text-gray-700"
      } relative`}
      style={{
        minWidth: 220,
        maxWidth: 500,
      }}
    >
      {/* Motivation */}
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center w-full">
          <span
            className={`font-semibold text-lg text-center ${
              theme === "dark" ? "text-teal-300 " : "text-teal-700 "
            }`}
          >
            🌟 Motivation
          </span>
          <button
            onClick={() => setMotivation(getRandomQuote())}
            className={`ml-2 ${
              theme === "dark"
                ? "text-teal-300 hover:text-teal-100"
                : "text-teal-500 hover:text-teal-700"
            }`}
            title="Refresh Quote"
          >
            <FaSyncAlt />
          </button>
        </div>
        <p
          className={`mb-1 mt-1 text-center truncate w-full ${
            theme === "dark" ? "text-gray-200 text-sm" : "text-gray-700 text-sm"
          }`}
        >
         "{motivation}"
        </p>
      </div>
      {/* Roulette */}
      <div className="mt-1">
        <span
          className={`block mb-2 font-medium text-center text-md ${
            theme === "dark" ? "text-gray-300 " : "text-gray-600 "
          }`}
        >
          Feeling overwhelmed? Let Roulette pick a task!
        </span>
        <button
          onClick={openRouletteModal}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded shadow transition text-base w-full font-semibold
            ${
              theme === "dark"
                ? "bg-teal-700 text-white hover:bg-teal-600"
                : "bg-teal-500 text-white hover:bg-teal-600"
            }
          `}
          title="Open Roulette"
        >
          <FaDice /> Roulette
        </button>
      </div>

      {/* Quick Access Toolbar (inline) */}
      <div className="flex justify-around items-center mt-2">
        <button
          onClick={handleQuickWhiteBoard}
          className={`flex flex-col items-center text-sm ${
            theme === "dark"
              ? "text-teal-300 hover:text-teal-100"
              : "text-teal-700 hover:text-teal-900"
          }`}
          title="Quick WhiteBoard"
        >
          <FaChalkboard className="mb-0.5" /> WhiteBoard
        </button>
        <button
          onClick={handleQuickGallery}
          className={`flex flex-col items-center text-sm ${
            theme === "dark"
              ? "text-teal-300 hover:text-teal-100"
              : "text-teal-700 hover:text-teal-900"
          } `}
          title="Quick Habit"
        >
          <FaImages className="mb-0.5" /> Gallery
        </button>
      </div>
    </div>
  );
};

export default MotivationReminderWidget;
