import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/authContext";

const Schulte = () => {
  const [gridSize, setGridSize] = useState(5);
  const [numbers, setNumbers] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [bestTime, setBestTime] = useState(null);
  const theme = useAuth().theme;
  const isDarkMode = theme === "dark";
  const [scores, setScores] = useState([]);

  // Initialize game
    const loadBestTime = useCallback(() => {
      const saved = localStorage.getItem(
        `schulte_best_${gridSize}x${gridSize}`,
      );
      setBestTime(saved ? parseFloat(saved) : null);
    }, [gridSize]);

    const initializeGame = useCallback(() => {
      const totalNumbers = gridSize * gridSize;
      const shuffled = generateShuffledNumbers(totalNumbers);
      setNumbers(shuffled);
      setNextNumber(1);
      setTime(0);
      setIsRunning(false);
      setGameOver(false);
      loadBestTime();
    }, [gridSize, loadBestTime]);

  useEffect(() => {
    initializeGame();
    loadScores();
  }, [initializeGame]);

  const generateShuffledNumbers = (total) => {
    const arr = Array.from({ length: total }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  

  const loadScores = () => {
    const saved = localStorage.getItem("schulte_scores");
    if (saved) {
      setScores(JSON.parse(saved));
    }
  };

  const saveScore = (finalTime) => {
    const newScores = [
      ...scores,
      {
        gridSize,
        time: finalTime,
        date: new Date().toLocaleDateString(),
      },
    ].slice(-10); // Keep only last 10 scores
    localStorage.setItem("schulte_scores", JSON.stringify(newScores));
    setScores(newScores);
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && !gameOver) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver]);

  const handleNumberClick = (num) => {
    if (num === nextNumber) {
      if (!isRunning) setIsRunning(true);

      if (num === gridSize * gridSize) {
        setNextNumber(num); // Set to completed number
        setGameOver(true);
        setIsRunning(false);
        const finalTime = time / 10;
        if (!bestTime || finalTime < bestTime) {
          setBestTime(finalTime);
          localStorage.setItem(
            `schulte_best_${gridSize}x${gridSize}`,
            finalTime,
          );
        }
        saveScore(finalTime);
      } else {
        setNextNumber(num + 1);
      }
    }
  };

  const formatTime = (ms) => {
    const seconds = ms / 10;
    return seconds.toFixed(2);
  };

  const resetGame = () => {
    initializeGame();
  };

  return (
    <div
      className={` h-screen flex flex-col items-center justify-center pt-32 px-7 sm:p-36 transition-all duration-300 overflow-hidden ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-100"
          : "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col justify-between items-center w-full max-w-3xl mb-2 sm:mb-3 gap-2 px-2">
        <h1 className="text-base sm:text-xl md:text-2xl font-bold text-center flex-1">
          Schulte Table
        </h1>
        <p className="text-base sm:text-sm opacity-90 ">
          Click the numbers in sequence! Improve your focus and reaction time by training with Schulte tables.
        </p>
      </div>

      {/* Controls Panel */}
      <div
        className={`w-full max-w-3xl mb-2 sm:mb-3 p-3 sm:p-4 rounded-lg backdrop-blur-md transition-all ${
          isDarkMode
            ? "bg-white/10 border border-gray-700/50"
            : "bg-white/15 border border-white/30"
        }`}
      >
        {/* Grid Size Control */}
        <div className="flex flex-col xs:flex-row items-center gap-2 mb-2 sm:mb-3">
          <label
            htmlFor="grid-size"
            className="font-semibold text-xs sm:text-sm whitespace-nowrap"
          >
            Grid Size:
          </label>
          <select
            id="grid-size"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            disabled={isRunning}
            className={`flex-1 xs:flex-none px-3 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm border-2 transition-all font-medium ${
              isDarkMode
                ? "bg-gray-800 text-gray-100 border-indigo-500 hover:border-indigo-400"
                : "bg-white text-gray-900 border-indigo-500 hover:border-indigo-400"
            } ${isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <option value={3}>3×3</option>
            <option value={4}>4×4</option>
            <option value={5}>5×5</option>
            <option value={6}>6×6</option>
            <option value={7}>7×7</option>
          </select>
        </div>

        {/* Stats Display */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`p-2 sm:p-3 rounded text-center ${
              isDarkMode ? "bg-white/10" : "bg-white/20"
            }`}
          >
            <div className="text-xs opacity-70 font-semibold">Time</div>
            <div className="text-sm sm:text-base font-bold">
              {formatTime(time)}s
            </div>
          </div>

          <div
            className={`p-2 sm:p-3 rounded text-center ${
              isDarkMode ? "bg-white/10" : "bg-white/20"
            }`}
          >
            <div className="text-xs opacity-70 font-semibold">Progress</div>
            <div className="text-sm sm:text-base font-bold">
              {nextNumber - 1}/{gridSize * gridSize}
            </div>
          </div>

          <div
            className={`p-2 sm:p-3 rounded text-center ${
              isDarkMode ? "bg-white/10" : "bg-white/20"
            }`}
          >
            <div className="text-xs opacity-70 font-semibold">Best</div>
            <div className="text-sm sm:text-base font-bold">
              {bestTime ? `${bestTime.toFixed(2)}s` : "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex items-center justify-center w-full mb-2 sm:mb-3 px-2">
        <div
          className={`rounded-lg backdrop-blur-md w-full max-w-sm transition-all ${
            isDarkMode
              ? "bg-white/10 border border-gray-700/50"
              : "bg-white/15 border border-white/30"
          }`}
          style={{ padding: "12px", aspectRatio: "1" }}
        >
          <div
            className="grid gap-1 h-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {numbers.map((num, idx) => (
              <button
                key={idx}
                onClick={() => handleNumberClick(num)}
                disabled={num < nextNumber || gameOver}
                className={`
                  rounded font-bold text-sm sm:text-lg md:text-lg
                  transition-all duration-150 transform
                  flex items-center justify-center
                  border-2 active:scale-95
                  ${
                    num < nextNumber
                      ? isDarkMode
                        ? "bg-green-600 border-green-700 text-white cursor-not-allowed opacity-60"
                        : "bg-green-500 border-green-600 text-white cursor-not-allowed opacity-60"
                      : `${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                            : "bg-white border-indigo-500 text-gray-900 hover:bg-gray-50"
                        } hover:scale-105 cursor-pointer`
                  }
                  ${gameOver && num >= nextNumber ? "opacity-40 cursor-not-allowed" : ""}
                `}
                aria-label={`Number ${num}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results & Actions */}
      <div className="flex flex-col items-center gap-2 w-full max-w-3xl px-2">
        <button
          onClick={resetGame}
          className={`px-4 sm:px-10 py-2 sm:py-3 font-bold text-xs sm:text-sm rounded transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg ${
            isDarkMode
              ? "bg-white text-gray-900 hover:shadow-xl"
              : "bg-white text-indigo-600 hover:shadow-xl"
          }`}
        >
          {gameOver ? "Play Again" : "Reset"}
        </button>
      </div>

      {/* Completion Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl transform transition-all ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              className={`px-6 sm:px-8 py-6 sm:py-8 text-center border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="text-4xl sm:text-5xl mb-3">🎉</div>
              <h2
                className={`text-2xl sm:text-3xl font-bold mb-2 ${
                  isDarkMode ? "text-green-400" : "text-green-600"
                }`}
              >
                Completed!
              </h2>
              <p
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                {gridSize}×{gridSize} Schulte Table
              </p>
            </div>

            {/* Stats */}
            <div
              className={`px-6 sm:px-8 py-6 sm:py-8 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg text-center ${
                    isDarkMode ? "bg-white/5" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Your Time
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {formatTime(time)}s
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg text-center ${
                    isDarkMode ? "bg-white/5" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Best Time
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {bestTime ? `${bestTime.toFixed(2)}s` : "--"}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setGameOver(false)}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-100 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={resetGame}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl ${
                  isDarkMode
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schulte;
