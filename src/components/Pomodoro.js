import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import {
  FaWindowMinimize,
  FaExpandAlt,
  FaGripLines,
  FaBell,
} from "react-icons/fa";
import { useAuth } from "../contexts/authContext";
import Bell from "../assets/bell.mp3"; // Ensure the path is correct

const Pomodoro = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false); // Track if the Pomodoro is in modal view
  const [workDuration, setWorkDuration] = useState(25); // Adjustable work duration
  const [breakDuration, setBreakDuration] = useState(5);
  const [isDurationUpdated, setIsDurationUpdated] = useState(false); // Track if durations are updated
  const { theme } = useAuth();
  const nodeRef = useRef(null); // Ref for the draggable component

  const audioRef = useRef(null); // Ref for the bell sound

  let bool = false
  if (window.innerWidth > 1024) {
    bool = true
  } else {
    bool = false
  }
  const [isVisible, setIsVisible] = useState(bool); // Track visibility of the widget

  const toggleVisibility = () => {
    setIsVisible(!isVisible); // Toggle visibility of the widget
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Play bell sound when timer finishes
            audioRef.current.play();

            if (isWorkSession) {
              setSessionCount(sessionCount + 1);
              setMinutes(breakDuration);
            } else {
              setMinutes(workDuration);
            }
            setIsWorkSession(!isWorkSession);
            setSeconds(0);
          } else {
            setMinutes((prevMinutes) => prevMinutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds((prevSeconds) => prevSeconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [
    isRunning,
    seconds,
    minutes,
    isWorkSession,
    sessionCount,
    workDuration,
    breakDuration,
  ]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(workDuration);
    setSeconds(0);
    setIsWorkSession(true);
    setSessionCount(0);
    setIsDurationUpdated(false); // Reset the updated state
  };

  const setDurations = () => {
    setMinutes(workDuration);
    setSeconds(0);
    setIsDurationUpdated(false); // Reset the updated state
  };

  const handleWorkDurationChange = (e) => {
    setWorkDuration(Number(e.target.value));
    setIsDurationUpdated(true); // Mark durations as updated
  };

  const handleBreakDurationChange = (e) => {
    setBreakDuration(Number(e.target.value));
    setIsDurationUpdated(true); // Mark durations as updated
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized); // Toggle between modal and minimized view
  };

  return (
    <>
      {/* Bell sound */}
      <audio ref={audioRef} src={Bell} />

      {isMaximized ? (
        // Modal View
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            theme === "dark"
              ? "bg-gray-900 bg-opacity-90"
              : "bg-gray-100 bg-opacity-90"
          }`}
        >
          <div
            className={`relative w-full max-w-4xl p-8 rounded-lg shadow-2xl ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            {/* Minimize Button */}
            <button
              className={`absolute top-4 right-4 ${
                theme === "dark"
                  ? "bg-teal-500 text-white"
                  : "bg-teal-500 text-white"
              } rounded-full p-2`}
              onClick={toggleMaximize}
            >
              <FaWindowMinimize />
            </button>

            {/* Timer Display */}
            <h3
              className={`text-4xl font-semibold mb-6 text-center ${
                theme === "dark" ? "text-teal-400" : "text-teal-600"
              }`}
            >
              {isWorkSession ? "Work Time" : "Break Time"}
            </h3>

            <div className="flex justify-center items-center mb-4">
              <FaBell
                className={`mr-2 ${
                  theme === "dark" ? "text-teal-400" : "text-teal-500"
                }`}
              />
              <div
                className={`timer text-6xl font-bold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {String(minutes).padStart(2, "0")} :{" "}
                {String(seconds).padStart(2, "0")}
              </div>
            </div>

            {/* Adjust Work and Break Durations */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col items-center">
                <label
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Work (min)
                </label>
                <input
                  type="number"
                  value={workDuration}
                  onChange={handleWorkDurationChange}
                  className={`w-16 p-1 text-center border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200"
                      : "bg-white text-gray-800"
                  }`}
                />
              </div>
              <div className="flex flex-col items-center">
                <label
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Break (min)
                </label>
                <input
                  type="number"
                  value={breakDuration}
                  onChange={handleBreakDurationChange}
                  className={`w-16 p-1 text-center border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200"
                      : "bg-white text-gray-800"
                  }`}
                />
              </div>
            </div>

            {/* Start, Pause, and Reset/Set Buttons */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={startTimer}
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-teal-500 text-white hover:bg-teal-600"
                    : "bg-teal-500 text-white hover:bg-teal-400"
                }`}
                disabled={isRunning}
              >
                Start
              </button>
              <button
                onClick={pauseTimer}
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                    : "bg-yellow-500 text-white hover:bg-yellow-400"
                }`}
                disabled={!isRunning}
              >
                Pause
              </button>
            </div>

            <button
              onClick={isDurationUpdated ? setDurations : resetTimer}
              className={`px-6 py-2 rounded-full w-full mt-4 ${
                theme === "dark"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-red-500 text-white hover:bg-red-400"
              }`}
            >
              {isDurationUpdated ? "Set" : "Reset"}
            </button>
          </div>
        </div>
      ) : // Minimized View

      isVisible ? (
        <Draggable nodeRef={nodeRef} handle=".drag-handle">
          <div
            ref={nodeRef}
            className={`pomodoro-widget fixed bottom-10 right-10 z-50 shadow-2xl rounded-lg p-6 w-64 max-w-xs ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            {/* Drag handle */}
            <div
              className={`drag-handle cursor-move absolute top-2 left-2 text-white ${
                theme === "dark" ? "bg-teal-500" : "bg-teal-500"
              } rounded-full p-2`}
            >
              <FaGripLines />
            </div>

            {/* Maximize Button */}
            <button
              className={`absolute top-2 right-2 ${
                theme === "dark"
                  ? "bg-teal-500 text-white"
                  : "bg-teal-500 text-white"
              } rounded-full p-2`}
              onClick={toggleMaximize}
            >
              <FaExpandAlt />
            </button>

            {/* Timer Display */}
            <h3
              className={`text-2xl font-semibold mb-4 text-center ${
                theme === "dark" ? "text-teal-400" : "text-teal-600"
              }`}
            >
              {isWorkSession ? "Work Time" : "Break Time"}
            </h3>

            <div className="flex justify-center items-center mb-4">
              <FaBell
                className={`mr-2 ${
                  theme === "dark" ? "text-teal-400" : "text-teal-500"
                }`}
              />
              <div
                className={`timer text-4xl font-bold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {String(minutes).padStart(2, "0")} :{" "}
                {String(seconds).padStart(2, "0")}
              </div>
            </div>

            {/* Start, Pause, and Reset/Set Buttons */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={startTimer}
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-teal-500 text-white hover:bg-teal-600"
                    : "bg-teal-500 text-white hover:bg-teal-400"
                }`}
                disabled={isRunning}
              >
                Start
              </button>
              <button
                onClick={pauseTimer}
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                    : "bg-yellow-500 text-white hover:bg-yellow-400"
                }`}
                disabled={!isRunning}
              >
                Pause
              </button>
            </div>

            <button
              onClick={isDurationUpdated ? setDurations : resetTimer}
              className={`px-6 py-2 rounded-full w-full mt-4 ${
                theme === "dark"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-red-500 text-white hover:bg-red-400"
              }`}
            >
              {isDurationUpdated ? "Set" : "Reset"}
            </button>
            <button
              onClick={toggleVisibility}
              className="absolute bottom-2 right-2 bg-gray-500 text-white rounded-full p-2"
            >
              Hide
            </button>
          </div>
        </Draggable>
      ) : (
        // Floating sticky button to bring back the Pomodoro widget
        <button
          onClick={toggleVisibility}
          className={`fixed bottom-20 right-4 px-4 py-2 rounded-full shadow-lg z-50 transition duration-300 ${
            theme === "dark"
              ? "bg-teal-600 text-white hover:bg-teal-700"
              : "bg-teal-600 text-white hover:bg-teal-500"
          }`}
        >
          Show Pomodoro
        </button>
      )}
    </>
  );
};

export default Pomodoro;
