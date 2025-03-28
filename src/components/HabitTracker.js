import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { FaEdit, FaTrash, FaRobot, FaVolumeUp } from "react-icons/fa"; // Import speaker icon
import { useAuth } from "../contexts/authContext";
import useGetHabits from "../hooks/useGetHabits";
import OpenAI from "openai";

const HabitTracker = () => {
  const [habitName, setHabitName] = useState("");
  const { currentUser } = useAuth();
  const { fetchedHabits, fetchHabits } = useGetHabits();

  const [completionRate, setCompletionRate] = useState(0); // Completion percentage
  const [aiInsights, setAiInsights] = useState(""); // AI-generated insights
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track if speech is active

  // OpenAI Configuration
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    calculateProgress();
    checkStreaks();
  }, [fetchedHabits]);

  useEffect(() => {
    if (fetchedHabits.length > 0) {
      generateAIInsights();
    }
  }, [completionRate]);

  // Function to calculate progress analytics
  const calculateProgress = () => {
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
  };

  // Function to check and reset streaks if a day is missed
  const checkStreaks = async () => {
    const today = new Date();
    const resetPromises = fetchedHabits.map(async (habit) => {
      const lastCompletedDate = habit.lastCompleted
        ? new Date(habit.lastCompleted.seconds * 1000)
        : null;

      if (lastCompletedDate) {
        const diffInDays = Math.floor(
          (today - lastCompletedDate) / (1000 * 60 * 60 * 24)
        );

        if (diffInDays > 1 && habit.streak > 0) {
          // Reset streak if more than 1 day has passed since last completion
          const habitRef = doc(db, "habits", habit.id);
          await updateDoc(habitRef, { streak: 0 });
        }
      }
    });

    await Promise.all(resetPromises);
    fetchHabits();
  };

  // Function to generate AI insights using OpenAI
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
      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free", // Use GPT-4 model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      });

      setAiInsights(response.choices[0].message.content.trim());
    } catch (error) {
      console.error("Error generating AI insights:", error);
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

  const toggleCompletion = async (id, completed, streak) => {
    try {
      const habitRef = doc(db, "habits", id);
      const today = new Date();

      if (!completed) {
        // Increment streak and update lastCompleted date
        await updateDoc(habitRef, {
          completed: true,
          streak: streak + 1,
          lastCompleted: today,
        });
      } else {
        // Reset completion status (but keep streak unchanged)
        await updateDoc(habitRef, {
          completed: false,
          streak: streak - 1,
        });
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

  return (
    <div className="habit-tracker-container px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold mb-4 text-center">Your Habits</h2>

      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Completion Rate:</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-teal-500 h-4 rounded-full"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {completionRate}% of habits completed today
          </p>
        </div>

        {/* AI Insights */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-teal-500 text-white p-4 rounded-lg shadow-lg relative">
          <div className="flex items-center mb-2">
            <FaRobot className="text-2xl mr-2" />
            <h3 className="text-lg font-semibold">AI Insights</h3>
          </div>
          {fetchedHabits.length === 0 ? (
            <p className="text-sm">
              Add some habits to get personalized AI-powered insights!
            </p>
          ) : aiInsights ? (
            <p className="text-sm">{aiInsights}</p>
          ) : (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white mr-2"></div>
              <p className="text-sm">Loading AI-powered insights...</p>
            </div>
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
      </div>

      <form
        onSubmit={addHabit}
        className="mb-6 flex flex-col sm:flex-row items-center"
      >
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto flex-grow mb-2 sm:mb-0"
          placeholder="Enter your habit"
        />
        <button
          type="submit"
          className="sm:ml-2 bg-teal-500 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          Add Habit
        </button>
      </form>

      <ul className="space-y-4">
        {fetchedHabits.map((habit) => (
          <li
            key={habit.id}
            className="p-4 border rounded flex flex-col sm:flex-row items-start sm:items-center justify-between"
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
                <span className={habit.completed ? "line-through" : ""}>
                  {habit.name}
                </span>
              </div>
              <div className="flex items-center mt-3">
                <span className="text-sm text-gray-500 mr-2">Streak:</span>
                <div className="flex flex-wrap items-center space-x-1">
                  {[...Array(habit.streak)].map((_, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 bg-blue-500 rounded-full mb-1"
                      title={`Day ${index + 1}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button
                onClick={() => {
                  const newName = prompt("Edit Habit", habit.name);
                  if (newName) editHabit(habit.id, newName);
                }}
                className="text-teal-500 hover:text-teal-600"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-red-500 hover:text-red-600"
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
