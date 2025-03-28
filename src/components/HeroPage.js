import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaTimes,
  FaSmile,
  FaSadTear,
  FaAngry,
  FaBed,
  FaBatteryFull,
} from "react-icons/fa";
import HeroImage from "../assets/hero_img2.png"; // Ensure the path is correct

const Hero = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(
    "bg-gradient-to-br from-indigo-500 to-blue-600"
  );
  const isLoggedIn = false; // Replace with your actual login check

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard"); // Redirect to dashboard if logged in
    } else {
      navigate("/register"); // Redirect to register page if not logged in
    }
  };

  const handleMoodChange = (mood) => {
    setSelectedMood(mood);
    switch (mood) {
      case "happy":
        setBackgroundColor("bg-gradient-to-br from-yellow-400 to-orange-500");
        break;
      case "stressed":
        setBackgroundColor("bg-gradient-to-br from-red-400 to-orange-600");
        setShowPopup(true);
        break;
      case "angry":
        setBackgroundColor("bg-gradient-to-br from-red-500 to-pink-500");
        setShowPopup(true);
        break;
      case "upset":
        setBackgroundColor("bg-gradient-to-br from-gray-400 to-gray-600");
        setShowPopup(true);
        break;
      case "energized":
        setBackgroundColor("bg-gradient-to-br from-green-400 to-teal-500");
        break;
      case "relaxed":
        setBackgroundColor("bg-gradient-to-br from-blue-300 to-purple-500");
        break;
      default:
        setBackgroundColor("bg-gradient-to-br from-indigo-500 to-blue-600");
        break;
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    stopSpeaking(); // Stop the voice when the popup is closed
  };

  // Function to start speaking the pop-up content with counting
  const startSpeaking = () => {
    const utterances = [
      "Take a deep breath.",
      "Inhale deeply for 4 seconds.",
      "1, 2, 3, 4.",
      "Hold your breath for 4 seconds.",
      "1, 2, 3, 4.",
      "Exhale slowly for 4 seconds.",
      "1, 2, 3, 4.",
      "Remember, this is just a temporary feeling, and you're doing great!",
    ];

    let index = 0;

    const speakNext = () => {
      if (index < utterances.length) {
        const utterance = new SpeechSynthesisUtterance(utterances[index]);
        utterance.voice = window.speechSynthesis
          .getVoices()
          .find((voice) => voice.name.includes("Google UK English Male")); // Use a calm, human-like voice
        utterance.pitch = 1; // Set pitch to a natural level
        utterance.rate = 0.9; // Slow down the rate for a calm tone
        utterance.volume = 1; // Set volume to maximum

        utterance.onend = () => {
          index++;
          if (index < utterances.length) {
            setTimeout(speakNext, 50); // Wait 1 second before speaking the next part
          }
        };

        window.speechSynthesis.speak(utterance);
      }
    };

    speakNext();
  };

  // Function to stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  // Start speaking when the popup is shown
  useEffect(() => {
    if (showPopup) {
      startSpeaking();
    }
  }, [showPopup]);

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center ${backgroundColor} overflow-hidden`}
    >
      {/* Hero Section Container */}
      <div className="container mx-auto flex flex-col-reverse md:flex-row items-center px-6 py-16 space-y-12 md:space-y-0 md:space-x-16">
        {/* Hero Image */}
        <div className="flex-shrink-0 w-full md:w-1/2 xl:w-1/3 transform transition-all duration-1000 ease-in-out opacity-0 translate-y-10 hover:scale-105 hover:opacity-100 animate__animated animate__fadeInLeft">
          <img
            src={HeroImage}
            alt="Hero"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Text Content */}
        <div className="z-20 text-white text-center md:text-left space-y-6 md:space-y-8 opacity-0 translate-x-10 animate__animated animate__fadeInRight">
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight transition duration-500 transform hover:text-yellow-400">
            Unlock Your True Potential with <br /> Life Mastery
          </h2>
          <p className="text-lg sm:text-xl opacity-90 max-w-lg mx-auto md:mx-0 transition duration-300 hover:opacity-100">
            Organize your life, track your habits, set goals, and achieve
            personal growth with our intelligent tools. Begin your journey
            today!
          </p>
          <button
            onClick={handleGetStarted}
            className="z-30 px-8 py-3 bg-yellow-400 text-blue-600 font-semibold rounded-full hover:bg-yellow-500 hover:text-white transition duration-300 flex items-center justify-center space-x-2 mx-auto md:mx-0 cursor-pointer transform opacity-0 translate-y-6 animate__animated animate__fadeInUp"
          >
            <span>Get Started</span>
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* Mood Selector (Positioned Below Hero Image on Mobile) */}
      <div className="absolute bottom-12 w-full flex flex-wrap justify-center items-center space-x-4 md:mt-0 z-10">
        <p className="text-white text-xl">How are you feeling today?</p>
        <div className="flex flex-wrap justify-center space-x-4 mt-4">
          <button
            onClick={() => handleMoodChange("happy")}
            className="px-4 py-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition flex items-center space-x-2"
          >
            <FaSmile />
            <span>Happy</span>
          </button>
          <button
            onClick={() => handleMoodChange("stressed")}
            className="px-4 py-2 bg-red-400 text-white rounded-full hover:bg-red-500 transition flex items-center space-x-2"
          >
            <FaSadTear />
            <span>Stressed</span>
          </button>
          <button
            onClick={() => handleMoodChange("angry")}
            className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center space-x-2"
          >
            <FaAngry />
            <span>Angry</span>
          </button>
          <button
            onClick={() => handleMoodChange("upset")}
            className="px-4 py-2 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition flex items-center space-x-2"
          >
            <FaSadTear />
            <span>Upset</span>
          </button>
          <button
            onClick={() => handleMoodChange("energized")}
            className="px-4 py-2 bg-green-400 text-white rounded-full hover:bg-green-500 transition flex items-center space-x-2"
          >
            <FaBatteryFull />
            <span>Energized</span>
          </button>
          <button
            onClick={() => handleMoodChange("relaxed")}
            className="px-4 py-2 bg-blue-300 text-white rounded-full hover:bg-blue-400 transition flex items-center space-x-2"
          >
            <FaBed />
            <span>Relaxed</span>
          </button>
        </div>
      </div>

      {/* Pop-Up Widget */}
      {showPopup && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
            <FaTimes
              onClick={closePopup}
              className="absolute top-2 right-2 text-xl cursor-pointer text-gray-600"
            />
            <h3 className="text-xl font-bold mb-4">Take a Deep Breath</h3>
            <p className="mb-4">
              Let's take a moment to calm down. Here are some breathing
              exercises:
            </p>
            <ol className="list-decimal pl-4 mb-4">
              <li>Inhale deeply for 4 seconds.</li>
              <li>Hold your breath for 4 seconds.</li>
              <li>Exhale slowly for 4 seconds.</li>
            </ol>
            <p className="italic text-gray-600">
              Remember, this is just a temporary feeling, and you're doing
              great!
            </p>
          </div>
        </div>
      )}

      {/* Decorative Bubbles */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
        <div className="absolute top-0 left-0 opacity-20 animate__animated animate__fadeIn animate__delay-1s z-0">
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-full blur-xl"></div>
        </div>
        <div className="absolute bottom-0 right-0 opacity-20 animate__animated animate__fadeIn animate__delay-2s z-0">
          <div className="w-48 h-48 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-xl"></div>
        </div>
        <div className="absolute bottom-12 left-12 opacity-30 animate__animated animate__fadeIn animate__delay-3s z-0">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 top-16 left-10 animate__animated animate__fadeIn animate__delay-1s z-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="rgba(255, 255, 255, 0.1)"
          className="animate-bounce"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
      </div>
    </div>
  );
};

export default Hero;
