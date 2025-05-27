import React, { useState, useEffect, useRef } from "react";
import useGetGame from "../hooks/useGetGame";
import Confetti from "react-confetti";
import { useAuth } from "../contexts/authContext";
import ReactDOM from "react-dom";

const GamificationProgress = () => {
  const { gamificationData, loading } = useGetGame();
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const prevLevel = useRef(null);
  const { theme } = useAuth();

  useEffect(() => {
    if (gamificationData) {
      const { level, remainingXP } = gamificationData;
      const xpToNextLevel = level * 100;

      // Detect level up
      if (prevLevel.current !== null && level > prevLevel.current) {
        setShowConfetti(true);
        setLevelUp(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setTimeout(() => setLevelUp(false), 5000);
      }
      // Detect exact level up (for initial mount)
      if (xpToNextLevel - remainingXP === 0 && prevLevel.current === null) {
        setShowConfetti(true);
        setLevelUp(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setTimeout(() => setLevelUp(false), 5000);
      }
      prevLevel.current = level;
    }
  }, [gamificationData]);

  if (loading) return <p>Loading...</p>;
  if (!gamificationData) return <p>No gamification data found.</p>;

  const { totalXP, level, remainingXP } = gamificationData;
  const xpToNextLevel = level * 100;
  const progressWidth = xpToNextLevel
    ? ((xpToNextLevel - remainingXP) / xpToNextLevel) * 100
    : 0;

  return (
    <div
      className={`gamification-progress w-full max-w-md mx-auto text-center p-6 rounded-lg ${
        theme === "dark"
          ? "bg-gray-800/30 text-gray-300"
          : "bg-teal-100/70 text-gray-700"
      } relative`}
      style={{
        boxShadow:
          theme === "dark"
            ? "0 4px 10px rgba(0, 0, 0, 0.5)"
            : "0 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      {showConfetti &&
        ReactDOM.createPortal(
          <Confetti
            width={window.innerWidth - 20}
            height={window.innerHeight}
            numberOfPieces={1000}
          />,
          document.body
        )}
      {(levelUp || (xpToNextLevel - remainingXP === 0 && totalXP > 0)) && (
        <div className="mb-4 animate-pulse">
          <h3 className="text-lg font-semibold">🎉 Level Up! 🎉</h3>
          <div
            className={`inline-block p-3 rounded-full ${
              theme === "dark" ? "bg-teal-500" : "bg-teal-400"
            } text-white text-3xl font-bold shadow-md animate-bounce`}
          >
            {level}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div
          className={`flex items-center space-x-2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <span className="text-lg font-bold">⭐</span>
          <span className="text-sm font-semibold">Level {level}</span>
        </div>
        <div
          className={`flex items-center space-x-2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <span className="text-sm font-semibold">Next Level</span>
          <span className="text-lg font-bold">⭐ {level + 1}</span>
        </div>
      </div>
      <div
        className={`w-full h-5 rounded-full overflow-hidden relative ${
          theme === "dark" ? "bg-gray-500/50" : "bg-gray-700/50"
        }`}
      >
        <div
          className={`h-full ${
            theme === "dark" ? "bg-teal-500" : "bg-teal-400"
          } transition-all duration-500`}
          style={{ width: `${progressWidth}%` }}
        >
          <span
            className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
              theme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {totalXP} XP
          </span>
        </div>
      </div>
      <div className="mt-2 text-sm">
        <span
          className={`font-medium ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Next level in {remainingXP} XP
        </span>
      </div>
    </div>
  );
};

export default GamificationProgress;
