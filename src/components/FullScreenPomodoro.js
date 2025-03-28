import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWindowMinimize } from 'react-icons/fa';

const FullscreenPomodoro = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true); // Track work/break session
  const [sessionCount, setSessionCount] = useState(0); // Track Pomodoro cycles
  const navigate = useNavigate();

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
    <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-r from-purple-600 to-blue-500 p-6 sm:p-10 md:p-20">
      <div className="relative bg-white rounded-lg p-6 md:p-10 shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl">
        {/* Close Fullscreen Button */}
        <button
          className="absolute top-2 right-2 text-gray-700"
          onClick={closeFullscreen}
        >
          <FaWindowMinimize size={24} />
        </button>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-teal-600 mb-6">
          {isWorkSession ? 'Work Time' : 'Break Time'}
        </h2>

        <div className="text-center text-5xl sm:text-6xl md:text-7xl font-bold text-gray-800 mb-6">
          {String(minutes).padStart(2, '0')} : {String(seconds).padStart(2, '0')}
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
