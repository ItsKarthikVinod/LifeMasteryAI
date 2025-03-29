import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGetJournalEntries from "../hooks/useGetJournals";
import { FaTrash, FaRobot, FaSpinner, FaVolumeUp } from "react-icons/fa"; // Import icons
import { OpenAI } from "openai"; // Import OpenAI

const JournalList = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [aiFeedback, setAiFeedback] = useState(""); // AI feedback for emotions
  const [monthlySummary, setMonthlySummary] = useState(""); // Monthly reflection summary
  const [loadinga, setLoadinga] = useState(false); // Loading state for Analyze
  const [loadings, setLoadings] = useState(false); // Loading state for Summarize
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track if speech is active
  const navigate = useNavigate();
  const { journalEntries, fetchJournalEntries, deleteJournalEntry } =
    useGetJournalEntries();

  // OpenAI Configuration
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

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
      fetchJournalEntries();
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
        model: "deepseek/deepseek-r1-zero:free",
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto p-6 bg-gray-50 shadow-lg rounded-lg mt-24 sm:mt-32">
        <h2 className="text-3xl font-bold text-teal-600 mb-6 text-center">
          Your Journal Entries
        </h2>

        <div className="mb-6">
          <label
            htmlFor="date"
            className="block text-gray-700 font-medium mb-2"
          >
            Search by Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400 focus:outline-none"
          />
        </div>

        <div
          className="space-y-6 overflow-hidden overflow-y-auto"
          style={{ maxHeight: "400px", scrollBehavior: "smooth" }}
        >
          {filteredEntries.length === 0 ? (
            selectedDate ? (
              <p className="text-center text-gray-500 italic">
                No journal was found for the selected date.
              </p>
            ) : journalEntries.length === 0 ? (
              <p className="text-center text-gray-500 italic">
                No journal entries available. Try writing a journal entry!
              </p>
            ) : (
              journalEntries.map((entry, index) => (
                <div
                  key={index}
                  className="p-6 bg-white shadow-md rounded-md hover:shadow-lg transition-shadow flex justify-between items-start"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-teal-700">
                      {entry.title}
                    </h3>
                    <p className="text-gray-600 mt-2">{entry.content}</p>
                    <p className="text-sm text-gray-500 mt-4">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="ml-4 text-gray-500 hover:text-red-500 transition-colors"
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
                className="p-6 bg-white shadow-md rounded-md hover:shadow-lg transition-shadow flex justify-between items-start"
              >
                <div>
                  <h3 className="text-xl font-semibold text-teal-700">
                    {entry.title}
                  </h3>
                  <p className="text-gray-600 mt-2">{entry.content}</p>
                  <p className="text-sm text-gray-500 mt-4">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="ml-4 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>

        {/* AI Feedback Section */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-teal-600 mb-4 flex items-center">
            <FaRobot className="text-2xl mr-2 text-blue-500" />
            AI Smart Journal & Reflection Bot 📝
          </h3>
          <button
            onClick={analyzeEmotions}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-400 transition-transform transform hover:scale-105 mr-4"
            disabled={loadinga} // Disable button while loading
          >
            {loadinga ? (
              <FaSpinner className="animate-spin inline-block mr-2" />
            ) : (
              "Analyze Emotions"
            )}
          </button>
          <button
            onClick={summarizeMonthlyReflections}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-400 transition-transform transform hover:scale-105"
            disabled={loadings} // Disable button while loading
          >
            {loadings ? (
              <FaSpinner className="animate-spin inline-block mr-2" />
            ) : (
              "Summarize & Improve"
            )}
          </button>

          {aiFeedback && (
            <div className="mt-6 p-4 bg-blue-100 text-blue-800 rounded-lg shadow relative">
              <h4 className="font-bold flex items-center">
                <FaRobot className="text-xl mr-2 text-blue-500" />
                AI Feedback:
              </h4>
              <p>{aiFeedback}</p>
              <button
                onClick={() => toggleSpeech(aiFeedback)}
                className="absolute top-2 right-2 text-blue-500 hover:text-blue-700 transition"
                title="Read AI Feedback"
              >
                <FaVolumeUp className="text-xl" />
              </button>
            </div>
          )}

          {monthlySummary && (
            <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg shadow relative">
              <h4 className="font-bold flex items-center">
                <FaRobot className="text-xl mr-2 text-green-500" />
                Monthly Summary:
              </h4>
              <p>{monthlySummary}</p>
              <button
                onClick={() => toggleSpeech(monthlySummary)}
                className="absolute top-2 right-2 text-green-500 hover:text-green-700 transition"
                title="Read Monthly Summary"
              >
                <FaVolumeUp className="text-xl" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-teal-500 text-white px-8 py-3 rounded-lg shadow-md hover:bg-teal-400 transition-transform transform hover:scale-105"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalList;
