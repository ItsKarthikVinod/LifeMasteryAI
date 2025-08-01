import React from "react";
import {
  FaChalkboard,
  FaDice,
  FaSyncAlt,
  FaImages,
  FaShoppingCart,
  FaUtensils,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

const MotivationReminderWidget = ({ openRouletteModal }) => {
  const theme = useAuth().theme;
  const navigate = useNavigate();

  const [quotes, setQuotes] = React.useState([]);
  const [motivation, setMotivation] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  // Fetch quotes from Firestore on mount
  React.useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "motivation"));
        const fetchedQuotes = snapshot.docs
          .map((doc) => doc.data().text)
          .filter(Boolean);
        setQuotes(
          fetchedQuotes.length > 0
            ? fetchedQuotes
            : [
                "Every day is a new beginning.",
                "Small steps lead to big results.",
                "You are capable of amazing things.",
                "Stay positive, work hard.",
                "Progress, not perfection.",
              ]
        );
      } catch (err) {
        setQuotes([
          "Every day is a new beginning.",
          "Small steps lead to big results.",
          "You are capable of amazing things.",
          "Stay positive, work hard.",
          "Progress, not perfection.",
        ]);
      }
      setLoading(false);
    };
    fetchQuotes();
  }, []);

  // Set a random quote when quotes are loaded
  React.useEffect(() => {
    if (quotes.length > 0) {
      setMotivation(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [quotes]);

  const handleRefreshQuote = () => {
    if (quotes.length > 0) {
      setMotivation(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  };

  // Quick Access actions
  const handleQuickWhiteBoard = () => navigate("/whiteboard");
  const handleQuickGallery = () => navigate("/whiteboard-gallery");
  const handleQuickGrocery = () => navigate("/grocery");
  const handleQuickRecipes = () => navigate("/recipes");

  return (
    <div
      className={`p-4 rounded-lg shadow flex flex-col gap-2 ${
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
            onClick={handleRefreshQuote}
            className={`ml-2 ${
              theme === "dark"
                ? "text-teal-300 hover:text-teal-100"
                : "text-teal-500 hover:text-teal-700"
            }`}
            title="Refresh Quote"
            disabled={loading}
          >
            <FaSyncAlt />
          </button>
        </div>
        <p
          className={`mb-1 mt-1 text-center w-full break-words ${
            theme === "dark" ? "text-gray-200 text-sm" : "text-gray-700 text-sm"
          }`}
        >
          {loading ? "Loading..." : `"${motivation}"`}
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
          onClick={handleQuickGrocery}
          className={`flex flex-col items-center text-sm ${
            theme === "dark"
              ? "text-teal-300 hover:text-teal-100"
              : "text-teal-700 hover:text-teal-900"
          } `}
          title="Grocery List"
        >
          <FaShoppingCart className="mb-0.5" /> Grocery
        </button>
        <button
          onClick={handleQuickRecipes}
          className={`flex flex-col items-center text-sm ${
            theme === "dark"
              ? "text-teal-300 hover:text-teal-100"
              : "text-teal-700 hover:text-teal-900"
          } `}
          title="Food Recipes"
        >
          <FaUtensils className="mb-0.5" /> Recipes
        </button>
        <button
          onClick={handleQuickGallery}
          className={`flex flex-col items-center text-sm ${
            theme === "dark"
              ? "text-teal-300 hover:text-teal-100"
              : "text-teal-700 hover:text-teal-900"
          } `}
          title="Whiteboard Gallery"
        >
          <FaImages className="mb-0.5" /> Gallery
        </button>
      </div>
    </div>
  );
};
export default MotivationReminderWidget;