import React, { useState, useEffect, useRef, useCallback } from "react";
import Draggable from "react-draggable";
import {
  FaWindowMinimize,
  FaExpandAlt,
  FaGripLines,
  FaBell,
  FaListAlt,
} from "react-icons/fa";
import { useAuth } from "../contexts/authContext";
import Bell from "../assets/bell.mp3"; // Ensure the path is correct

const Pomodoro = ({ initialTitle, isRunning, setIsRunning }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [title, setTitle] = useState(initialTitle || "");
  const [isWorkSession, setIsWorkSession] = useState(true);
  const { theme } = useAuth();
  const [isMaximized, setIsMaximized] = useState(false); // Track if the Pomodoro is in modal view
  const [workDuration, setWorkDuration] = useState(25); // Adjustable work duration
  const [breakDuration, setBreakDuration] = useState(5);
  const [isDurationUpdated, setIsDurationUpdated] = useState(false); // Track if durations are updated
  const [sessionLog, setSessionLog] = useState([]); // Log of Pomodoro sessions
  const [isLogModalOpen, setIsLogModalOpen] = useState(false); // Track visibility of the session log modal

  const nodeRef = useRef(null); // Ref for the draggable component

  const audioRef = useRef(null); // Ref for the bell sound

  useEffect(() => {
    setTitle(initialTitle); // Update the title when the prop changes
  }, [initialTitle]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible); // Toggle visibility of the widget
  };

  const toggleLogModal = () => {
    setIsLogModalOpen(!isLogModalOpen); // Toggle visibility of the session log modal
  };

  let bool = false;
  if (window.innerWidth > 1024) {
    bool = true;
  } else {
    bool = false;
  }
  const [isVisible, setIsVisible] = useState(bool); // Track visibility of the widget

  // Fetch session logs from Local Storage
  const fetchSessionLogsFromLocalStorage = useCallback(() => {
    const storedLogs =
      JSON.parse(localStorage.getItem("pomodoroSessionLogs")) || [];
    setSessionLog(storedLogs);
  }, []);

  // Save session logs to Local Storage
  const saveSessionToLocalStorage = useCallback(
    (session) => {
      const updatedLogs = [...sessionLog, session];
      setSessionLog(updatedLogs);
      localStorage.setItem("pomodoroSessionLogs", JSON.stringify(updatedLogs));
    },
    [sessionLog] // Dependency: sessionLog
  );

  useEffect(() => {
    // Fetch logs from Local Storage on component mount
    fetchSessionLogsFromLocalStorage();
  }, [fetchSessionLogsFromLocalStorage]);

  useEffect(() => {
    let interval;
    let startTime = Date.now(); // Record the start time

    if (isRunning) {
      interval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Calculate elapsed time in seconds
        const totalSeconds = minutes * 60 + seconds - elapsedTime;

        if (totalSeconds <= 0) {
          // Timer finished
          audioRef.current.play();

          // Create a session log entry
          const session = {
            title: title ? title : "Session",
            type: isWorkSession ? "Work" : "Break",
            duration: isWorkSession ? workDuration : breakDuration,
            timestamp: new Date().toLocaleString(),
          };

          // Save the session log to Local Storage
          saveSessionToLocalStorage(session);

          if (isWorkSession) {
            // Switch to Break Time
            setMinutes(breakDuration);
            setSeconds(0);
            setIsWorkSession(false);
          } else {
            // End the Pomodoro session after the break
            setIsRunning(false);
            setMinutes(workDuration);
            setSeconds(0);
            setIsWorkSession(true);
            document.title = "Life Mastery"; // Reset title when session ends
          }

          clearInterval(interval);
        } else {
          const remainingMinutes = Math.floor(totalSeconds / 60);
          const remainingSeconds = totalSeconds % 60;
          setMinutes(remainingMinutes);
          setSeconds(remainingSeconds);

          // Update the document title with the timer
          document.title = `Life Mastery - ${String(remainingMinutes).padStart(
            2,
            "0"
          )}:${String(remainingSeconds).padStart(2, "0")}`;
        }
      }, 1000);
    } else {
      // Reset the title when the timer is paused or stopped
      document.title = "Life Mastery";
    }

    return () => clearInterval(interval);
  }, [
    isRunning,
    minutes,
    seconds,
    isWorkSession,
    breakDuration,
    workDuration,
    saveSessionToLocalStorage,
    title,
    setIsRunning
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
              className={`text-4xl font-semibold mb-2 text-center mt-3 ${
                theme === "dark" ? "text-gray-200" : "text-gray-600"
              }`}
            >
              {title ? `"${title}"` : ""}
            </h3>
            {/* Timer Display */}
            <h3
              className={`text-2xl font-semibold mb-6 text-center ${
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

            {/* View Log Button */}
            <button
              onClick={toggleLogModal}
              className={`px-6 py-2 rounded-full w-full mt-4 ${
                theme === "dark"
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-blue-500 text-white hover:bg-blue-400"
              }`}
            >
              <FaListAlt className="inline-block mr-2" />
              View Session Log
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
              className={`text-2xl font-semibold mb-2 text-center mt-3 ${
                theme === "dark" ? "text-gray-200" : "text-gray-600"
              }`}
            >
              {title ? `"${title}"` : ""}
            </h3>
            <h3
              className={`text-xl font-semibold mb-4 text-center ${
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

      {/* Session Log Modal */}
      {isLogModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            theme === "dark"
              ? "bg-gray-900 bg-opacity-90"
              : "bg-gray-100 bg-opacity-90"
          }`}
        >
          <div
            className={`relative w-full max-w-2xl p-6 rounded-lg shadow-2xl ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            {/* Close Button */}
            <button
              className={`absolute top-1 right-4 ${
                theme === "dark"
                  ? "bg-red-500 text-white"
                  : "bg-red-500 text-white"
              } rounded-full p-2`}
              onClick={toggleLogModal}
            >
              <FaWindowMinimize />
            </button>

            {/* Modal Title */}
            <h3
              className={`text-2xl font-semibold mb-4 ${
                theme === "dark" ? "text-teal-400" : "text-teal-600"
              }`}
            >
              Pomodoro Session Log
            </h3>

            {/* Scrollable Log Container */}
            <div className="max-h-96 overflow-y-auto space-y-4">
              <ul>
                {sessionLog.map((session, index) => (
                  <li
                    key={index}
                    className={`p-4 rounded-lg shadow mt-2 mr-2 ${
                      theme === "dark"
                        ? "bg-gray-700 text-gray-200"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p>
                      <strong>Title:</strong> {session.title}
                    </p>
                    <p>
                      <strong>Type:</strong> {session.type}
                    </p>
                    <p>
                      <strong>Duration:</strong> {session.duration} minutes
                    </p>
                    <p>
                      <strong>Completed At:</strong> {session.timestamp}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Pomodoro;
