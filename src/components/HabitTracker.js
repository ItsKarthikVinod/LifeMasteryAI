import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { FaEdit, FaTrash, FaRobot, FaVolumeUp, FaClock } from "react-icons/fa"; // Import speaker icon
import { useAuth } from "../contexts/authContext";
import useGetHabits from "../hooks/useGetHabits";
import OpenAI from "openai";


const HabitTracker = ({ onTriggerPomodoro }) => {
  const [habitName, setHabitName] = useState("");
  const { currentUser, theme } = useAuth();
  const { fetchedHabits, fetchHabits } = useGetHabits();

  const [completionRate, setCompletionRate] = useState(0); // Completion percentage
  const [aiInsights, setAiInsights] = useState(""); // AI-generated insights
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track if speech is active
  const [isLoading, setIsLoading] = useState(false);

  // OpenAI Configuration
  const openai = useMemo(() => {
    return new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }, []);

  // Function to calculate progress analytics
  const calculateProgress = useCallback(() => {
    if (fetchedHabits.length === 0) {
      setCompletionRate(0);
      return;
    }

    const completedCount = fetchedHabits.filter(
      (habit) => habit.completed
    ).length;
    setCompletionRate(
      Math.round((completedCount / fetchedHabits.length) * 100)
    );
  }, [fetchedHabits]);
  // Function to check and reset streaks if a day is missed

  const formatAIOutput = (text) => {
    // Split the text into parts based on `**` (bold) and `*` (italic)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/); // Match text surrounded by `**` or `*`
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Bold text
        return <strong key={index}>{part.slice(2, -2)}</strong>; // Remove `**` and wrap in <strong>
      } else if (part.startsWith("*") && part.endsWith("*")) {
        // Italic text
        return <strong key={index}>{part.slice(1, -1)}</strong>; // Remove `*` and wrap in <em>
      } else {
        // Normal text
        return part;
      }
    });
  };

  const checkStreaks = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ); // Start of today (normalized)

    // Initialize Firestore batch
    const batch = writeBatch(db);

    fetchedHabits.forEach((habit) => {
      const lastCompletedDate = habit.lastCompleted
        ? new Date(habit.lastCompleted.seconds * 1000)
        : null;

      if (lastCompletedDate) {
        // Normalize lastCompletedDate to the start of its day
        const lastCompletedStart = new Date(
          lastCompletedDate.getFullYear(),
          lastCompletedDate.getMonth(),
          lastCompletedDate.getDate()
        );

        const diffInDays = Math.floor(
          (todayStart - lastCompletedStart) / (1000 * 60 * 60 * 24)
        );

        if (diffInDays >= 1 && habit.completed) {
          // Reset `completed` to false but keep the streak
          const habitRef = doc(db, "habits", habit.id);
          batch.update(habitRef, { completed: false });
        }
      }
    });

    try {
      // Commit the batch update
      await batch.commit();
      fetchHabits(); // Refresh the habits after updating
    } catch (error) {
      console.error("Error updating habits:", error);
    }
  }, [fetchedHabits, fetchHabits]);
  // Function to generate AI insights using OpenAI
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const generateAIInsights = async () => {
    const habitSummary = fetchedHabits
      .map(
        (habit) =>
          `${habit.name}: ${habit.streak} day streak, ${
            habit.completed ? "completed today" : "not completed today"
          }`
      )
      .join("\n");

    const prompt = `
    Analyze the following habit data and provide personalized motivational insights and habit improvement suggestions in 60-70 words:
    ${habitSummary}
    Completion Rate: ${completionRate}%
  `;

    try {
      // Add a delay to prevent hitting the rate limit
      setIsLoading(true);
      await delay(3000); // 1-second delay

      const response = await openai.chat.completions.create({
        model: "google/gemma-3-12b-it:free",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      });

      if (response.choices && response.choices.length > 0) {
        setAiInsights(response.choices[0].message.content.trim());
      } else {
        setAiInsights("Unable to generate insights at this time.");
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
      setAiInsights("An error occurred while generating insights.");
    } finally {
      setIsLoading(false);
    }
  };
  // Function to toggle speech synthesis
  const toggleSpeech = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel(); // Stop speaking
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);

      // Select a human-like voice (adjust based on available voices in the browser)
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find((voice) =>
        voice.name.includes("Google UK English Male")
      ); // Example: Google UK English Female

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Adjust speech properties for a human-like AI feel
      utterance.pitch = 1.1; // Slightly higher pitch for a friendly tone
      utterance.rate = 0.95; // Slightly slower rate for clarity
      utterance.volume = 1; // Full volume

      // Add event listener to reset state when speech ends
      utterance.onend = () => setIsSpeaking(false);

      // Start speaking
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!habitName) return;

    try {
      await addDoc(collection(db, "habits"), {
        name: habitName,
        completed: false,
        streak: 0,
        lastCompleted: null,
        timestamp: new Date(),
        userId: currentUser.uid,
      });

      setHabitName("");
      fetchHabits();
    } catch (error) {
      console.error("Error adding habit: ", error);
    }
  };

  const toggleCompletion = async (id, completed, streak, lastCompleted) => {
    try {
      const habitRef = doc(db, "habits", id);
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)); // Start of today

      if (!completed) {
        // If the habit is being marked as completed
        if (
          lastCompleted &&
          new Date(lastCompleted.seconds * 1000) >= todayStart
        ) {
          // If already completed today, do nothing
          return;
        }

        // Increment streak and update lastCompleted date
        await updateDoc(habitRef, {
          completed: true,
          streak: streak + 1,
          lastCompleted: today,
        });
      } else {
        // If the habit is being unchecked
        if (
          lastCompleted &&
          new Date(lastCompleted.seconds * 1000) >= todayStart
        ) {
          // If unchecking on the same day, decrement streak
          await updateDoc(habitRef, {
            completed: false,
            streak: streak > 0 ? streak - 1 : 0,
            lastCompleted: null, // Reset lastCompleted since it's unchecked
          });
        } else if (
          lastCompleted &&
          new Date(lastCompleted.seconds * 1000) < todayStart
        ) {
          // If unchecking after a day has passed, keep streak unchanged
          await updateDoc(habitRef, {
            completed: false,
          });
        } else {
          // If no valid lastCompleted date, just uncheck the habit
          await updateDoc(habitRef, {
            completed: false,
            streak: streak > 0 ? streak - 1 : 0,
            lastCompleted: null,
          });
        }
      }

      fetchHabits();
    } catch (error) {
      console.error("Error updating habit completion: ", error);
    }
  };

  const deleteHabit = async (id) => {
    try {
      const habitRef = doc(db, "habits", id);
      await deleteDoc(habitRef);
      fetchHabits();
    } catch (error) {
      console.error("Error deleting habit: ", error);
    }
  };

  const editHabit = async (id, newName) => {
    if (!newName) return;
    try {
      const habitRef = doc(db, "habits", id);
      await updateDoc(habitRef, { name: newName });
      fetchHabits();
    } catch (error) {
      console.error("Error updating habit: ", error);
    }
  };

  useEffect(() => {
    calculateProgress();
    checkStreaks();
  }, [calculateProgress, checkStreaks]);

  return (
    <div
      className={`habit-tracker-container px-4 sm:px-6 lg:px-8 ${
        theme === "dark" ? " text-gray-200" : " text-gray-800"
      }`}
    >
      <h2
        className={`text-2xl font-semibold mb-4 text-center ${
          theme === "dark" ? "text-teal-400" : ""
        }`}
      >
        Your Habits
      </h2>

      {/* Completion Rate */}
      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Completion Rate:</h3>
          <div
            className={`w-full rounded-full h-4 ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <div
              className={`h-4 rounded-full ${
                theme === "dark" ? "bg-teal-500" : "bg-teal-500"
              }`}
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p
            className={`text-sm mt-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {completionRate}% of habits completed today
          </p>
        </div>

        {/* AI Insights */}
        <div
          className={`mt-6 p-4 rounded-lg shadow-lg relative ${
            theme === "dark"
              ? "bg-gradient-to-r from-gray-800 via-teal-700 to-gray-700 text-gray-200"
              : "bg-gradient-to-r from-blue-500 to-teal-500 text-white"
          }`}
        >
          <div className="flex items-center mb-2">
            <FaRobot className="text-2xl mr-2" />
            <h3 className="text-lg font-semibold">AI Insights</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white mr-2"></div>
              <p className="text-sm">Loading AI-powered insights...</p>
            </div>
          ) : aiInsights ? (
            <p className="text-sm">{formatAIOutput(aiInsights)}</p>
          ) : (
            <p className="text-sm">
              Click the button below to generate AI-powered insights!
            </p>
          )}
          {aiInsights && (
            <button
              onClick={() => toggleSpeech(aiInsights)}
              className="absolute top-2 right-2 text-white hover:text-gray-300 transition"
              title="Read AI Insights"
            >
              <FaVolumeUp className="text-xl" />
            </button>
          )}
        </div>
        <button
          onClick={generateAIInsights}
          className={`mt-4 px-4 py-2 rounded w-full sm:w-auto ${
            theme === "dark"
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "bg-teal-500 text-white hover:bg-teal-400"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Generating Insights..." : "Generate AI Insights"}
        </button>
      </div>

      {/* Add Habit Form */}
      <form
        onSubmit={addHabit}
        className="mb-6 flex flex-col sm:flex-row items-center md:justify-center md:space-x-2"
      >
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          className={`border p-2 rounded w-full sm:w-auto flex-grow mb-2 sm:mb-0 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600 text-gray-200"
              : "bg-white border-gray-300 text-gray-800"
          }`}
          placeholder="Enter your habit"
        />
        <button
          type="submit"
          className={`sm:ml-2 sm:w-auto px-4 py-2 rounded w-full ${
            theme === "dark"
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "bg-teal-500 text-white hover:bg-teal-400"
          }`}
        >
          Add Habit
        </button>
      </form>

      {/* Habit List */}
      <ul className="space-y-4">
        {fetchedHabits.map((habit) => (
          <li
            key={habit.id}
            className={`p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-md ${
              theme === "dark"
                ? "bg-gray-700/40 text-gray-200 hover:bg-gray-700"
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            <div className="flex flex-col space-y-2 w-full sm:w-auto">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={habit.completed}
                  onChange={() =>
                    toggleCompletion(habit.id, habit.completed, habit.streak)
                  }
                  className="mr-2"
                />
                <span
                  className={`${
                    habit.completed
                      ? theme === "dark"
                        ? "line-through text-gray-400"
                        : "line-through text-gray-500"
                      : ""
                  }`}
                >
                  {habit.name}
                </span>
              </div>
              <div className="flex items-center mt-3">
                <span
                  className={`text-sm mr-2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Streak:
                </span>
                <div className="flex flex-wrap items-center space-x-1">
                  {[...Array(habit.streak)].map((_, index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full mb-1 ${
                        theme === "dark" ? "bg-teal-500" : "bg-blue-500"
                      }`}
                      title={`Day ${index + 1}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button
                onClick={() => onTriggerPomodoro(habit.name)}
                className={`${
                  theme === "dark"
                    ? "text-teal-400 hover:text-teal-500"
                    : "text-teal-500 hover:text-teal-600"
                }`}
              >
                <FaClock />
              </button>
              <button
                onClick={() => {
                  const newName = prompt("Edit Habit", habit.name);
                  if (newName) editHabit(habit.id, newName);
                }}
                className={`${
                  theme === "dark"
                    ? "text-teal-400 hover:text-teal-500"
                    : "text-teal-500 hover:text-teal-600"
                }`}
              >
                <FaEdit />
              </button>
              <button
                onClick={() => deleteHabit(habit.id)}
                className={`${
                  theme === "dark"
                    ? "text-red-400 hover:text-red-500"
                    : "text-red-500 hover:text-red-600"
                }`}
              >
                <FaTrash />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HabitTracker;
