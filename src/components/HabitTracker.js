import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { FaEdit, FaTrash, FaRobot, FaVolumeUp, FaClock } from "react-icons/fa";
import { useAuth } from "../contexts/authContext";
import useGetHabits from "../hooks/useGetHabits";
import OpenAI from "openai";
import useGetGame from "../hooks/useGetGame";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { sendNotification } from "../hooks/useSendNotification";

const HabitTracker = ({ onTriggerPomodoro }) => {
  const [habitName, setHabitName] = useState("");
  const { currentUser, theme } = useAuth();
  const { fetchedHabits } = useGetHabits();
  const { awardXP } = useGetGame();

  const [completionRate, setCompletionRate] = useState(0);
  const [aiInsights, setAiInsights] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OpenAI Configuration
  const openai = useMemo(() => {
    return new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }, []);

  // Calculate completion rate
  const calculateProgress = useCallback(() => {
    if (fetchedHabits.length === 0) {
      setCompletionRate(0);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const completedCount = fetchedHabits.filter(
      (habit) => habit.completedDates && habit.completedDates.includes(today)
    ).length;
    setCompletionRate(Math.round((completedCount / fetchedHabits.length) * 100));
  }, [fetchedHabits]);

  // Format AI output
  const formatAIOutput = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      } else if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      } else {
        return part;
      }
    });
  };

  // Calculate streak for a habit
  function calculateStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;

    // Sort dates ascending
    const dates = completedDates.map((d) => new Date(d)).sort((a, b) => a - b);

    let streak = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else if (diff > 1) {
        break;
      }
    }

    // Check if the last completion was yesterday or today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = dates[dates.length - 1];
    const diffFromToday = (today - lastDate) / (1000 * 60 * 60 * 24);

    if (diffFromToday > 1) {
      return 0; // Missed a day, reset streak
    }

    return streak;
  }
  
  

  // AI Insights
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const generateAIInsights = async () => {
    if (!fetchedHabits || fetchedHabits.length === 0) {
      setAiInsights(
        "You haven't added any habits yet. Start by adding a habit to begin tracking and receive personalized AI insights!"
      );
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const habitSummary = fetchedHabits
      .map(
        (habit) =>
          `${habit.name}: ${calculateStreak(
            habit.completedDates
          )} day streak, ${
            habit.completedDates && habit.completedDates.includes(today)
              ? "completed today"
              : "not completed today"
          }`
      )
      .join("\n");

    const prompt = `
    Analyze the following habit data and provide personalized motivational insights and habit improvement suggestions in 60-70 words:
    ${habitSummary}
    Completion Rate: ${completionRate}%
  `;

    try {
      setIsLoading(true);
      await delay(3000);

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

  // Speech synthesis
  const toggleSpeech = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find((voice) =>
        voice.name.includes("Google UK English Male")
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.pitch = 1.1;
      utterance.rate = 0.95;
      utterance.volume = 1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Add a new habit
  const addHabit = async (e) => {
    e.preventDefault();
    if (!habitName) return;
    try {
      await addDoc(collection(db, "habits"), {
        name: habitName,
        completedDates: [],
        timestamp: new Date(),
        userId: currentUser.uid,
      });
      setHabitName("");
    } catch (error) {
      console.error("Error adding habit: ", error);
    }
  };

  // Toggle completion for today
  const toggleCompletion = async (habit) => {
    const today = new Date().toISOString().slice(0, 10);
    let newDates = habit.completedDates || [];
    const habitRef = doc(db, "habits", habit.id);

    if (newDates.includes(today)) {
      // Uncheck: remove today
      newDates = newDates.filter((date) => date !== today);
      await updateDoc(habitRef, { completedDates: newDates });
      await awardXP(currentUser.uid, -10);
      toast.error("-10 XP deducted for unchecking a habit!", {
        /* ... */
      });
    } else {
      // Check: add today
      newDates = [...newDates, today];
      await updateDoc(habitRef, { completedDates: newDates });
      await awardXP(currentUser.uid, 10);
      toast.success("+10 XP gained for completing a habit!", {
        /* ... */
      });

      // --- Notification logic ---
      // Notify on completion
      await sendNotification(
        currentUser.uid,
        `You completed your habit: '${habit.name}'.`,
        "habit"
      );

      // Calculate streak after update
      const streak = calculateStreak(newDates);
      // Notify on streak milestone (e.g., 7 days)
      
      if (streak === 7) {
        await sendNotification(
          currentUser.uid,
          `Congrats! You’ve maintained your habit '${habit.name}' for 7 days! 🔥`,
          "habit"
        );
      }
      if (streak === 14) {
        await sendNotification(
          currentUser.uid,
          `Congrats! You’ve maintained your habit '${habit.name}' for 14 days! 🔥`,
          "habit"
        );
      }
      if (streak === 30) {
        await sendNotification(
          currentUser.uid,
          `Congrats! You’ve maintained your habit '${habit.name}' for a month! 🔥`,
          "habit"
        );
      }
      // You can add more milestones (14, 30, etc.) similarly
    }
  };
  // Delete a habit
  const deleteHabit = async (id) => {
    try {
      const habitRef = doc(db, "habits", id);
      
      if (!window.confirm("Are you sure you want to delete this habit?")) {
        return;
      } 
      await deleteDoc(habitRef);
    } catch (error) {
      console.error("Error deleting habit: ", error);
    }
  };

  // Edit a habit
  const editHabit = async (id, newName) => {
    if (!newName) return;
    try {
      const habitRef = doc(db, "habits", id);
      await updateDoc(habitRef, { name: newName });
    } catch (error) {
      console.error("Error updating habit: ", error);
    }
  };

  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

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
          value={habitName|| ""}
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
                  checked={
                    habit.completedDates ?
                    habit.completedDates.includes(
                      new Date().toISOString().slice(0, 10)
                    ) : false
                  }
                  onChange={() => toggleCompletion(habit)}
                  className="mr-2"
                />
                <span
                  className={`${
                    habit.completedDates &&
                    habit.completedDates.includes(
                      new Date().toISOString().slice(0, 10)
                    )
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
                  className={`text-sm  ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Streak:
                </span>
                <div className="flex flex-wrap items-center space-x-1">
                  {[...Array(calculateStreak(habit.completedDates))].map(
                    (_, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 mb-2 mr-0 `}
                        title={`Day ${index + 1}`}
                      >
                        🔥
                      </div>
                      
                    )
                  )
                  }
                  
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
