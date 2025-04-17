import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGetJournalEntries from "../hooks/useGetJournals";
import { FaTrash, FaRobot, FaSpinner, FaVolumeUp } from "react-icons/fa"; // Import icons
import { OpenAI } from "openai"; // Import OpenAI
import { useAuth } from "../contexts/authContext"; // Import auth context

const JournalList = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [aiFeedback, setAiFeedback] = useState(""); // AI feedback for emotions
  const [monthlySummary, setMonthlySummary] = useState(""); // Monthly reflection summary
  const [loadinga, setLoadinga] = useState(false); // Loading state for Analyze
  const [loadings, setLoadings] = useState(false); // Loading state for Summarize
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track if speech is active
  const navigate = useNavigate();
  const { journalEntries, deleteJournalEntry } =
    useGetJournalEntries();
  const { theme } = useAuth(); // Assuming you have a theme context

  // OpenAI Configuration
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-CA");
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);

    if (e.target.value) {
      const filtered = journalEntries?.filter((entry) => {
        const entryDate = entry.createdAt ? formatDate(entry.createdAt) : "";
        return entryDate === e.target.value;
      });
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(journalEntries);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this journal entry?"
    );
    if (confirmed) {
      await deleteJournalEntry(id);
      
    }
  };

  // Function to analyze emotions and provide feedback
  const analyzeEmotions = async () => {
    setLoadinga(true); // Start loading
    const journalContent = journalEntries
      .map((entry) => entry.content)
      .join("\n\n");
    const prompt = `
      Analyze the following journal entries for emotional trends and provide feedback in 60-70 words:
      ${journalContent}
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 150,
      });

      

      if (response.choices && response.choices.length > 0) {
        setAiFeedback(response.choices[0].message.content.trim());
      } else {
        console.error("No choices returned in the API response.");
        setAiFeedback("Unable to analyze emotions at this time.");
      }
    } catch (error) {
      console.error("Error analyzing emotions:", error);
      setAiFeedback("An error occurred while analyzing emotions.");
    } finally {
      setLoadinga(false); // Stop loading
    }
  };

  // Function to summarize monthly reflections
  const summarizeMonthlyReflections = async () => {
    setLoadings(true); // Start loading
    const journalContent = journalEntries
      .map((entry) => entry.content)
      .join("\n\n");
    const prompt = `
      Summarize the following journal entries in 2-3 paragraphs into a monthly reflection and suggest ways to improve well-being:
      ${journalContent}
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
      });

     

      if (response.choices && response.choices.length > 0) {
        setMonthlySummary(response.choices[0].message.content.trim());
      } else {
        console.error("No choices returned in the API response.");
        setMonthlySummary("Unable to summarize reflections at this time.");
      }
    } catch (error) {
      console.error("Error summarizing reflections:", error);
      setMonthlySummary("An error occurred while summarizing reflections.");
    } finally {
      setLoadings(false); // Stop loading
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
        voice.name.includes("Google UK English Female")
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

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      <div
        className={`max-w-4xl w-full mx-auto p-6 shadow-lg rounded-lg mt-24 sm:mt-32 ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        <h2
          className={`text-3xl font-bold mb-6 text-center ${
            theme === "dark" ? "text-teal-400" : "text-teal-600"
          }`}
        >
          Your Journal Entries
        </h2>

        {/* Search by Date */}
        <div className="mb-6">
          <label
            htmlFor="date"
            className={`block font-medium mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Search by Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-gray-200 focus:ring-teal-500"
                : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
            }`}
          />
        </div>

        {/* Journal Entries */}
        <div
          className="space-y-6 overflow-hidden overflow-y-auto"
          style={{ maxHeight: "400px", scrollBehavior: "smooth" }}
        >
          {filteredEntries.length === 0 ? (
            selectedDate ? (
              <p
                className={`text-center italic ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No journal was found for the selected date.
              </p>
            ) : journalEntries.length === 0 ? (
              <p
                className={`text-center italic ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No journal entries available. Try writing a journal entry!
              </p>
            ) : (
              journalEntries.map((entry, index) => (
                <div
                  key={index}
                  className={`p-6 shadow-md rounded-md hover:shadow-lg transition-shadow flex justify-between items-start ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200"
                      : "bg-white text-gray-800"
                  }`}
                >
                  <div>
                    <h3
                      className={`text-xl font-semibold ${
                        theme === "dark" ? "text-teal-400" : "text-teal-700"
                      }`}
                    >
                      {entry.title}
                    </h3>
                    <p className="mt-2">{entry.content}</p>
                    <p
                      className={`text-sm mt-4 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className={`ml-4 transition-colors ${
                      theme === "dark"
                        ? "text-gray-400 hover:text-red-500"
                        : "text-gray-500 hover:text-red-500"
                    }`}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )
          ) : (
            filteredEntries.map((entry, index) => (
              <div
                key={index}
                className={`p-6 shadow-md rounded-md hover:shadow-lg transition-shadow flex justify-between items-start ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-200"
                    : "bg-white text-gray-800"
                }`}
              >
                <div>
                  <h3
                    className={`text-xl font-semibold ${
                      theme === "dark" ? "text-teal-400" : "text-teal-700"
                    }`}
                  >
                    {entry.title}
                  </h3>
                  <p className="mt-2">{entry.content}</p>
                  <p
                    className={`text-sm mt-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className={`ml-4 transition-colors ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>

        {/* AI Feedback Section */}
        <div className="mt-10">
          <h3
            className={`text-xl font-bold mb-4 flex items-center ${
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            }`}
          >
            <FaRobot className="text-2xl mr-2" />
            AI Smart Journal & Reflection Bot 📝
          </h3>
          <button
            onClick={analyzeEmotions}
            className={`px-4 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 mr-4 ${
              theme === "dark"
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-blue-500 text-white hover:bg-blue-400"
            }`}
            disabled={loadinga}
          >
            {loadinga ? (
              <FaSpinner className="animate-spin inline-block mr-2" />
            ) : (
              "Analyze Emotions"
            )}
          </button>
          <button
            onClick={summarizeMonthlyReflections}
            className={`px-4 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
              theme === "dark"
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-green-500 text-white hover:bg-green-400"
            }`}
            disabled={loadings}
          >
            {loadings ? (
              <FaSpinner className="animate-spin inline-block mr-2" />
            ) : (
              "Summarize & Improve"
            )}
          </button>

          {aiFeedback && (
            <div
              className={`mt-6 p-4 rounded-lg shadow relative ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-200"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              <h4 className="font-bold flex items-center">
                <FaRobot className="text-xl mr-2" />
                AI Feedback:
              </h4>
              <p>{formatAIOutput(aiFeedback)}</p>
              <button
                onClick={() => toggleSpeech(aiFeedback)}
                className={`absolute top-2 right-2 transition ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-teal-400"
                    : "text-blue-500 hover:text-blue-700"
                }`}
                title="Read AI Feedback"
              >
                <FaVolumeUp className="text-xl" />
              </button>
            </div>
          )}

          {monthlySummary && (
            <div
              className={`mt-6 p-4 rounded-lg shadow relative ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-200"
                  : "bg-green-100 text-green-800"
              }`}
            >
              <h4 className="font-bold flex items-center">
                <FaRobot className="text-xl mr-2" />
                Monthly Summary:
              </h4>
              <p>{formatAIOutput(monthlySummary)}</p>
              <button
                onClick={() => toggleSpeech(monthlySummary)}
                className={`absolute top-2 right-2 transition ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-teal-400"
                    : "text-green-500 hover:text-green-700"
                }`}
                title="Read Monthly Summary"
              >
                <FaVolumeUp className="text-xl" />
              </button>
            </div>
          )}
        </div>

        {/* Back to Dashboard Button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className={`px-8 py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
              theme === "dark"
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-teal-500 text-white hover:bg-teal-400"
            }`}
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalList;
