import React, { useState } from "react";
import { useAuth } from "../contexts/authContext";

// Accept theme as a prop for light/dark mode
export default function GroceryAIModal({
  open,
  onClose,
  onAddItems,
  existingItems,
}) {
  const [input, setInput] = useState("");
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { theme } = useAuth();

  const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;

  const isDark = theme === "dark";
  const modalBg = isDark ? "bg-gray-900" : "bg-white";
  const modalText = isDark ? "text-teal-200" : "text-teal-900";
  const borderColor = isDark ? "border-teal-700" : "border-teal-200";
  const inputBg = isDark ? "bg-gray-800" : "bg-white";
  const inputText = isDark ? "text-teal-200 placeholder-gray-400" : "text-teal-900 placeholder-gray-400";
  const btnPrimary = isDark
    ? "bg-teal-700 hover:bg-teal-800 text-white"
    : "bg-teal-600 hover:bg-teal-700 text-white";
  const btnSecondary = isDark
    ? "bg-gray-700 hover:bg-gray-800 text-teal-200"
    : "bg-gray-300 hover:bg-gray-400 text-teal-900";
  const btnAdd = isDark
    ? "bg-teal-700 hover:bg-teal-800 text-white"
    : "bg-teal-600 hover:bg-teal-700 text-white";
  const shadow = isDark ? "shadow-2xl" : "shadow-xl";
  const scrollBg = isDark ? "bg-gray-800" : "bg-teal-50";
  const scrollBar =
    "scrollbar-thin scrollbar-thumb-teal-400 scrollbar-track-teal-100 dark:scrollbar-thumb-teal-700 dark:scrollbar-track-gray-800";

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setSuggested([]);
    try {
      const response = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "command-r-plus",
          message: `Extract a simple list of grocery items from these recipe ingredients. Only return a JSON array of strings, no explanation:\n${input}`,
        }),
      });
      const data = await response.json();
      // Try to extract JSON array from response
      const match = data.text.match(/\[.*\]/s);
      let items = [];
      if (match) {
        try {
          items = JSON.parse(match[0]);
        } catch {}
      }
      // Remove duplicates and already existing items
      items = items
        .map((i) => i.trim())
        .filter(
          (i) =>
            i &&
            !existingItems.map((e) => e.toLowerCase()).includes(i.toLowerCase())
        );
      setSuggested(items);
      if (items.length === 0) setError("No new grocery items found.");
    } catch {
      setError("Failed to analyze. Try again.");
    }
    setLoading(false);
  };

  const handleAdd = () => {
    onAddItems(suggested);
    setInput("");
    setSuggested([]);
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div
        className={`${modalBg} ${modalText} ${shadow} rounded-2xl p-6 max-w-md w-full border ${borderColor} relative`}
        style={{ minWidth: 340 }}
      >
        <h2 className="font-extrabold text-xl mb-1 flex items-center gap-2">
          <span role="img" aria-label="ai">🧠</span> AI Grocery Extractor
        </h2>
        <div className={`mb-4 text-xs sm:text-sm ${isDark ? "text-teal-300" : "text-teal-700"}`}>
          Paste your recipe ingredients and let AI suggest a clean grocery list. Review and add only what you need!
        </div>
        <textarea
          className={`w-full border ${borderColor} ${inputBg} ${inputText} rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-400 transition`}
          rows={3}
          placeholder="Paste recipe ingredients here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleAnalyze}
            className={`${btnPrimary} px-3 py-2 rounded-lg font-bold text-xs transition`}
            disabled={loading || !input.trim()}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          <button
            onClick={onClose}
            className={`${btnSecondary} px-3 py-2 rounded-lg font-bold text-xs transition`}
            disabled={loading}
          >
            Close
          </button>
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {suggested.length > 0 && (
          <div className="mt-4">
            <div className="font-bold mb-2 text-base flex items-center gap-2">
              <span role="img" aria-label="suggestion">✨</span> Suggested Items
            </div>
            <div
              className={`max-h-40 overflow-y-auto rounded-lg ${scrollBg} ${scrollBar} border ${borderColor} mb-3`}
            >
              <ul className="divide-y divide-teal-200 dark:divide-teal-700">
                {suggested.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-2 text-sm sm:text-base ${
                      isDark
                        ? "hover:bg-gray-700"
                        : "hover:bg-teal-100"
                    } transition`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-teal-400 mr-2"></span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleAdd}
              className={`${btnAdd} px-4 py-2 rounded-lg font-bold w-full transition`}
            >
              Add to Grocery List
            </button>
          </div>
        )}
      </div>
        </div>
    );
    }