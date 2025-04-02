import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWindowMinimize } from 'react-icons/fa';
import { useAuth } from '../contexts/authContext';

const FullscreenPomodoro = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true); // Track work/break session
  const [sessionCount, setSessionCount] = useState(0); // Track Pomodoro cycles
  const [workDuration, setWorkDuration] = useState(25); // Adjustable work duration
    const [breakDuration, setBreakDuration] = useState(5);
  const navigate = useNavigate();
  const {theme} = useAuth();

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Switch sessions
            if (isWorkSession) {
              setSessionCount(sessionCount + 1);
              setMinutes(sessionCount % 4 === 0 ? 30 : 5); // 30-min break after 4 Pomodoros
            } else {
              setMinutes(25); // Work session
            }
            setIsWorkSession(!isWorkSession);
            setSeconds(0);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, minutes, isWorkSession, sessionCount]);

  const closeFullscreen = () => {
    navigate('/dashboard'); // Navigate back
  };

  return (
    <div
      className={`flex items-center justify-center w-screen h-screen  p-6 sm:p-10 md:p-20 lg:p-24 xl:p-28 ${
        theme === "dark"
          ? "bg-gradient-to-r from-purple-900 to-blue-800"
          : "bg-gradient-to-r from-purple-600 to-blue-500"
      }`}
    >
      <div
        className={`relative  rounded-lg p-6 md:p-10 shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl ${
          theme === "dark"
            ? "bg-gray-800/60 text-white"
            : "bg-white text-gray-800"
        }`}
      >
        {/* Close Fullscreen Button */}
        <button
          className={`absolute top-2 right-2  ${
            theme === "dark"
              ? "text-gray-300 hover:text-gray-100"
              : "text-gray-700 hover:text-gray-900"
          }`}
          onClick={closeFullscreen}
        >
          <FaWindowMinimize size={24} />
        </button>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-teal-600 mb-6">
          {isWorkSession ? "Work Time" : "Break Time"}
        </h2>

        <div className="text-center text-5xl sm:text-6xl md:text-7xl font-bold  mb-6">
          {String(minutes).padStart(2, "0")} :{" "}
          {String(seconds).padStart(2, "0")}
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
              onChange={(e) => setWorkDuration(Number(e.target.value))}
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
              onChange={(e) => setBreakDuration(Number(e.target.value))}
              className={`w-16 p-1 text-center border rounded ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-200"
                  : "bg-white text-gray-800"
              }`}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <button
            onClick={() => setIsRunning(true)}
            className="bg-teal-500 text-white px-5 py-2 sm:py-3 rounded-lg hover:bg-teal-600 w-full sm:w-auto"
            disabled={isRunning}
          >
            Start
          </button>
          <button
            onClick={() => setIsRunning(false)}
            className="bg-yellow-500 text-white px-5 py-2 sm:py-3 rounded-lg hover:bg-yellow-600 w-full sm:w-auto"
            disabled={!isRunning}
          >
            Pause
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setMinutes(25);
              setSeconds(0);
              setIsWorkSession(true);
              setSessionCount(0);
            }}
            className="bg-red-500 text-white px-5 py-2 sm:py-3 rounded-lg hover:bg-red-600 w-full sm:w-auto"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPomodoro;
