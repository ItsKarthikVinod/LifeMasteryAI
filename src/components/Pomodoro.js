/* global chrome */
import React, { useState, useEffect, useRef, useCallback } from "react";
import Draggable from "react-draggable";
import {
  FaWindowMinimize,
  FaExpandAlt,
  FaGripLines,
  FaBell,
  FaListAlt,
  FaMusic,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { useAuth } from "../contexts/authContext";
import Bell from "../assets/belldigi.mp3";
import Bell2 from "../assets/bell.mp3";
import PomodoroTimeline from "./PomodoroTimeline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useGetGame from "../hooks/useGetGame";

const MUSIC_TRACKS = [
  { name: "Lo-fi Chillhop", src: "/jazzy-focus-1-lofi-jazz-371178.mp3" },
  {
    name: "Focus Ambient",
    src: "/ambient-background-music-for-focus-and-relaxation-342438.mp3",
  },
  {
    name: "Relaxing Piano",
    src: "/peaceful-piano-instrumental-for-studying-and-focus-232535.mp3",
  },
];

const Pomodoro = ({ initialTitle, isRunning, setIsRunning, initialMinutes }) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [title, setTitle] = useState(initialTitle || "");
  const [isWorkSession, setIsWorkSession] = useState(true);
  const { theme } = useAuth();
  const [isMaximized, setIsMaximized] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isDurationUpdated, setIsDurationUpdated] = useState(false);
  const [sessionLog, setSessionLog] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const { awardXP } = useGetGame();
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  const toggleTimelineModal = () => {
    if (sessionLog.length === 0) {
      alert("No session logs available.");
      return;
    } else {
      setIsTimelineModalOpen(!isTimelineModalOpen);
    }
  };

  const nodeRef = useRef(null);
  const audioRef = useRef(null);
  const audio2Ref = useRef(null);
  const musicRef = useRef(null);

  // Music player state
  const [isMuted, setIsMuted] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(MUSIC_TRACKS[0].src);
  const [musicVolume, setMusicVolume] = useState(0.3);

  // For accurate timer
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    const storedMinutes = localStorage.getItem("pomodoroInitialMinutes");
    if (storedMinutes) {
      const updatedMinutes = parseInt(storedMinutes, 10);
      setMinutes(updatedMinutes);
      setWorkDuration(updatedMinutes);
    } else {
      setMinutes(initialMinutes);
      setWorkDuration(initialMinutes);
    }
  }, [initialMinutes]);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const toggleLogModal = () => {
    setIsLogModalOpen(!isLogModalOpen);
  };

  let bool = false;
  if (window.innerWidth > 1024) {
    bool = true;
  } else {
    bool = false;
  }
  const [isVisible, setIsVisible] = useState(bool);

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
    [sessionLog]
  );

  const [blockedSites, setBlockedSites] = useState([]);
  const [isBlockingEnabled, setIsBlockingEnabled] = useState(false);
  

  useEffect(() => {
    const storedSites = JSON.parse(localStorage.getItem("blockedSites")) || [];
    setBlockedSites(storedSites);

    const blockingStatus =
      JSON.parse(localStorage.getItem("isBlockingEnabled")) || false;
    setIsBlockingEnabled(blockingStatus);
  }, []);

  useEffect(() => {
    if (isRunning && isBlockingEnabled) {
      const interval = setInterval(() => {
        blockedSites.forEach((site) => {
          if (window.location.href.includes(site)) {
            window.location.href = "about:blank";
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning, isBlockingEnabled, blockedSites]);

  useEffect(() => {
    fetchSessionLogsFromLocalStorage();
  }, [fetchSessionLogsFromLocalStorage]);

  
useEffect(() => {
  let interval;
  let wakeLock = null;

  // Request Wake Lock to prevent screen from sleeping
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator && navigator.wakeLock.request) {
        wakeLock = await navigator.wakeLock.request("screen");
        // Re-acquire wake lock if released by system
        wakeLock.addEventListener("release", () => {
          if (isRunning) requestWakeLock();
        });
      }
    } catch (err) {
      // Wake Lock not supported or denied
    }
  };

  // Release Wake Lock
  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  };

  if (isRunning) {
    requestWakeLock();
    if (!endTime) {
      setEndTime(Date.now() + (minutes * 60 + seconds) * 1000);
      return;
    }

    localStorage.setItem("pomodoroStatus", "running");

    interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = endTime - now;
      if (remainingMs <= 0) {
        setMinutes(0);
        setSeconds(0);

        // Play bell sound after work or break
        if (isWorkSession) {
          if (audioRef.current) {
            audioRef.current.volume = 0.2;
            audioRef.current.play();
          }
        } else {
          if (audio2Ref.current) {
            audio2Ref.current.volume = 0.2;
            audio2Ref.current.play();
          }
        }

        localStorage.setItem("pomodoroStatus", "stopped");

        const session = {
          title: title ? title : "Session",
          type: isWorkSession ? "Work" : "Break",
          duration: isWorkSession ? workDuration : breakDuration,
          timestamp: new Date().toLocaleString(),
        };

        saveSessionToLocalStorage(session);

        if (isWorkSession) {
          const xpGained = workDuration;
          awardXP(userId, xpGained);

          toast.success(
            `+${xpGained} XP gained for completing a work session.`,
            {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );

          if ("Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Pomodoro Complete!", {
                body: `Great job! You finished your work session: "${
                  title || "Session"
                }". Time for a break!`,
                icon: "/android-chrome-512x512.png",
              });
            } else if (Notification.permission !== "denied") {
              Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                  new Notification("Pomodoro Complete!", {
                    body: `Great job! You finished your work session: "${
                      title || "Session"
                    }". Time for a break!`,
                    icon: "/android-chrome-512x512.png",
                  });
                }
              });
            }
          }
          setMinutes(breakDuration);
          setSeconds(0);
          setIsWorkSession(false);
          setEndTime(Date.now() + breakDuration * 60 * 1000);
        } else {
          setIsRunning(false);
          setMinutes(workDuration);
          setSeconds(0);
          setIsWorkSession(true);
          setEndTime(null);
          document.title = "Life Mastery | Unlock Your True Potential";
        }

        clearInterval(interval);
      } else {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const secondsLeft = remainingSeconds % 60;
        setMinutes(remainingMinutes);
        setSeconds(secondsLeft);

        document.title = `Life Mastery - ${String(remainingMinutes).padStart(
          2,
          "0"
        )}:${String(secondsLeft).padStart(2, "0")}`;
      }
    }, 1000);
  } else {
    releaseWakeLock();
    setEndTime(null);
    document.title = "Life Mastery | Unlock Your True Potential";
  }

  return () => {
    clearInterval(interval);
    releaseWakeLock();
  };
}, [
  isRunning,
  endTime,
  isWorkSession,
  breakDuration,
  workDuration,
  saveSessionToLocalStorage,
  title,
  setIsRunning,
  awardXP,
  userId,
  minutes,
  seconds,
]);

  // Music player logic
  useEffect(() => {
    if (musicRef.current) {
      // Mute music during break unless user unmutes
      if (isWorkSession) {
        musicRef.current.muted = isMuted;
      } else {
        musicRef.current.muted = isMuted ? true : false;
      }
      musicRef.current.volume = musicVolume;
      if (isRunning) {
        musicRef.current.play();
      } else {
        musicRef.current.pause();
        musicRef.current.currentTime = 0;
      }
    }
  }, [isRunning, selectedTrack, isMuted, musicVolume, isWorkSession]);

  // If break starts, auto-mute unless user unmutes
  useEffect(() => {
    if (!isWorkSession) {
      setIsMuted(true);
    }
  }, [isWorkSession]);

  const startTimer = () => {
    setIsRunning(true);
    setEndTime(Date.now() + (minutes * 60 + seconds) * 1000);

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ action: "startPomodoro" }, (response) => {
        console.log(response?.status || "No response from extension");
      });
    }
  };
  const pauseTimer = () => {
    setIsRunning(false);
    localStorage.setItem("pomodoroStatus", "stopped");
    setEndTime(null);

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ action: "stopPomodoro" }, (response) => {
        console.log(response?.status || "No response from extension");
      });
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(workDuration);
    setSeconds(0);
    setIsWorkSession(true);

    setIsDurationUpdated(false);
    setEndTime(null);
    localStorage.setItem("pomodoroStatus", "stopped");
  };

  const setDurations = () => {
    setMinutes(workDuration);
    setSeconds(0);
    setIsDurationUpdated(false);
    setEndTime(null);
  };

  const handleWorkDurationChange = (e) => {
    setWorkDuration(Number(e.target.value));
    setIsDurationUpdated(true);
  };

  const handleBreakDurationChange = (e) => {
    setBreakDuration(Number(e.target.value));
    setIsDurationUpdated(true);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Music volume slider handler
  const handleMusicVolumeChange = (e) => {
    setMusicVolume(Number(e.target.value));
  };

  // UI: Show muted state during break
  const showMuted =
    !isWorkSession && isMuted
      ? true
      : isMuted;

  return (
    <>
      {/* Bell sound */}
      <audio ref={audioRef} src={Bell} />
      <audio ref={audio2Ref} src={Bell2} />
      {/* Music audio element - only rendered once, always playing */}
      <audio ref={musicRef} src={selectedTrack} loop />

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

            {/* Attractive Work and Break Duration Inputs */}
            <div className="flex justify-center items-center gap-8 mb-6">
              <div className="flex flex-col items-center">
                <label
                  className={`text-base font-semibold mb-2 ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                >
                  Work (min)
                </label>
                <input
                  type="number"
                  value={workDuration}
                  onChange={handleWorkDurationChange}
                  min={1}
                  max={120}
                  className={`w-28 h-16 text-4xl font-bold text-center rounded-2xl shadow border-2 focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-gray-700 text-teal-300 border-teal-500 focus:ring-teal-400"
                      : "bg-white text-teal-700 border-teal-300 focus:ring-teal-500"
                  }`}
                />
              </div>
              <div className="flex flex-col items-center">
                <label
                  className={`text-base font-semibold mb-2 ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                >
                  Break (min)
                </label>
                <input
                  type="number"
                  value={breakDuration}
                  onChange={handleBreakDurationChange}
                  min={1}
                  max={60}
                  className={`w-28 h-16 text-4xl font-bold text-center rounded-2xl shadow border-2 focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-gray-700 text-teal-300 border-teal-500 focus:ring-teal-400"
                      : "bg-white text-teal-700 border-teal-300 focus:ring-teal-500"
                  }`}
                />
              </div>
            </div>

            {/* Music Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <FaMusic className="text-teal-500 text-2xl" />
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className={`p-3 rounded-xl border-2 text-lg font-semibold shadow focus:outline-none focus:ring-2 ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-teal-500 focus:ring-teal-400"
                    : "bg-white text-gray-800 border-teal-300 focus:ring-teal-500"
                }`}
              >
                {MUSIC_TRACKS.map((track) => (
                  <option key={track.src} value={track.src}>
                    {track.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full text-xl shadow ${
                  showMuted
                    ? "bg-gray-700 text-teal-400"
                    : theme === "dark"
                    ? "bg-gray-700 text-teal-400 hover:bg-teal-500 hover:text-white"
                    : "bg-gray-200 text-teal-600 hover:bg-teal-500 hover:text-white"
                } transition`}
                aria-label={showMuted ? "Unmute music" : "Mute music"}
              >
                {showMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={musicVolume}
                onChange={handleMusicVolumeChange}
                className="w-32 accent-teal-500"
                aria-label="Music volume"
              />
            </div>

            {/* Start, Pause, and Reset/Set Buttons */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={startTimer}
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 text-lg font-semibold shadow ${
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
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 text-lg font-semibold shadow ${
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
              className={`px-6 py-2 rounded-full w-full mt-4 text-lg font-semibold shadow ${
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
              className={`px-6 py-2 rounded-full w-full mt-4 text-lg font-semibold shadow ${
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
      ) : isVisible ? (
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

            <div className="flex justify-center items-center mb-4 relative">
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
              {/* Mute/Unmute button beside timer */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`ml-3 p-2 rounded-full absolute right-0 top-1/2 transform -translate-y-1/2 ${
                  showMuted
                    ? "bg-gray-700 text-teal-400"
                    : theme === "dark"
                    ? "bg-gray-700 text-teal-400"
                    : "bg-gray-200 text-teal-600"
                } hover:bg-teal-500 hover:text-white transition`}
                aria-label={showMuted ? "Unmute music" : "Mute music"}
              >
                {showMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
            </div>

            {/* Start, Pause, and Reset/Set Buttons */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={startTimer}
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 text-lg font-semibold shadow ${
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
                className={`px-6 py-3 rounded-full w-full disabled:opacity-50 text-lg font-semibold shadow ${
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
              className={`px-6 py-2 rounded-full w-full mt-4 text-lg font-semibold shadow ${
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

            <div className="flex sm:justify-around sm:items-center sm:flex-row flex-col mb-4">
              <h3
                className={`text-2xl font-semibold mb-4 ${
                  theme === "dark" ? "text-teal-400" : "text-teal-600"
                }`}
              >
                Pomodoro Session Log
              </h3>
              <button
                onClick={toggleTimelineModal}
                className={`sm:px-4 sm:py-2 px-3 py-1 rounded-lg font-bold ${
                  theme === "dark"
                    ? "bg-teal-500 text-white hover:bg-teal-600"
                    : "bg-teal-500 text-white hover:bg-teal-400"
                }`}
              >
                View Timeline
              </button>
            </div>

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
      {/* Timeline Modal */}
      {isTimelineModalOpen && (
        <PomodoroTimeline
          sessionLog={sessionLog}
          theme={theme}
          onClose={toggleTimelineModal}
        />
      )}
    </>
  );
};
export default Pomodoro;