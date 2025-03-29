import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Draggable from "react-draggable";
import { FaWindowMinimize, FaExpandAlt, FaGripLines } from "react-icons/fa";

const Pomodoro = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  
  let bool = false;
  
  if (window.innerWidth < 1024) {
    bool = false;
  }
  else {
    bool = true;
  }
  const [isVisible, setIsVisible] = useState(bool);
  

  const navigate = useNavigate();
  const nodeRef = useRef(null); // Create a ref for the draggable element

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            if (isWorkSession) {
              setSessionCount(sessionCount + 1);
              setMinutes(sessionCount % 4 === 0 ? 30 : 5);
            } else {
              setMinutes(25);
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

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(25);
    setSeconds(0);
    setIsWorkSession(true);
    setSessionCount(0);
  };

  const toggleMaximize = () => {
    if (!isMaximized) {
      navigate("/pomodoro/fullscreen");
    }
    setIsMaximized(!isMaximized);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {isVisible ? (
        <Draggable nodeRef={nodeRef} handle=".drag-handle">
          <div
            ref={nodeRef} // Attach the ref to the draggable element
            className={`pomodoro-widget fixed ${
              isMaximized
                ? "top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 to-blue-500"
                : "bottom-10 right-10"
            } z-50 shadow-2xl rounded-lg p-6 w-64 max-w-xs transition-all bg-white`}
          >
            {/* Drag handle */}
            <div className="drag-handle cursor-move absolute top-2 left-2 text-white bg-teal-500 rounded-full p-2">
              <FaGripLines />
            </div>

            {/* Maximize/Minimize Button */}
            {isMaximized ? (
              <button
                className="absolute top-2 right-2 text-white cursor-pointer"
                onClick={toggleMaximize}
              >
                <FaWindowMinimize />
              </button>
            ) : (
              <button
                className="absolute top-2 right-2 bg-teal-500 text-white rounded-full p-2"
                onClick={toggleMaximize}
              >
                <FaExpandAlt />
              </button>
            )}

            {/* Pomodoro Timer Display */}
            <h3 className="text-2xl font-semibold mb-4 text-center text-teal-600">
              {isWorkSession ? "Work Time" : "Break Time"}
            </h3>

            <div className="flex justify-center items-center mb-4">
              <div className="timer text-4xl font-bold text-gray-800">
                {String(minutes).padStart(2, "0")} :{" "}
                {String(seconds).padStart(2, "0")}
              </div>
            </div>

            {/* Start, Pause, and Reset Buttons */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={startTimer}
                className="bg-teal-500 text-white px-6 py-3 rounded-full hover:bg-teal-600 w-full disabled:opacity-50"
                disabled={isRunning}
              >
                Start
              </button>
              <button
                onClick={pauseTimer}
                className="bg-yellow-500 text-white px-6 py-3 rounded-full hover:bg-yellow-600 w-full disabled:opacity-50"
                disabled={!isRunning}
              >
                Pause
              </button>
            </div>

            <button
              onClick={resetTimer}
              className="bg-red-500 text-white px-6 py-2 rounded-full w-full mt-4 hover:bg-red-600"
            >
              Reset
            </button>

            {/* Hide/Show Button */}
            {!isMaximized && (
              <button
                onClick={toggleVisibility}
                className="absolute bottom-2 right-2 bg-gray-500 text-white rounded-full p-2"
              >
                Hide
              </button>
            )}
          </div>
        </Draggable>
      ) : (
        // Floating sticky button to bring back the Pomodoro widget
        <button
          onClick={toggleVisibility}
          className="fixed bottom-20 right-4 bg-teal-600 text-white px-4 py-2 rounded-full shadow-lg z-50 hover:bg-teal-700 transition duration-300"
        >
          Show Pomodoro
        </button>
      )}
    </>
  );
};

export default Pomodoro;
