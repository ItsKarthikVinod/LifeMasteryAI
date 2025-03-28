import React, { useState } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaRobot,
  FaTimes,
  FaCheck,
  FaRedo,
} from "react-icons/fa"; // Import icons for better visuals
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import useGetTodos from "../hooks/useGetTodos";
import { useAuth } from "../contexts/authContext";


const VoiceAssistant = ({
  
  
  
  
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // State to store the final transcript
  const [interimTranscript, setInterimTranscript] = useState(""); // State to store the interim transcript
  const [isModalOpen, setIsModalOpen] = useState(false); // State to toggle modal
  const [recognitionInstance, setRecognitionInstance] = useState(null); // Store the recognition instance
  const { fetchTodos, todoss } = useGetTodos();
  const { currentUser } = useAuth();
  const userId = currentUser.uid;

  const addTodos = async (todo) => {
      
      if (!todo) return;
  
      try {
        await addDoc(collection(db, 'todos'), {
          name: todo,
          isCompleted: false,
          isImportant: false, // Default importance is false
          timestamp: new Date(),
          userId: userId,
        });
        
        fetchTodos();
        alert("Todo added successfully!");
      } catch (error) {
        console.error('Error adding todo: ', error);
      }
  };
  const markAsDone = async (todo) => {
      try {
        await updateDoc(doc(db, 'todos', todo?.id), {
          isCompleted: true,
        });
        fetchTodos();
        alert("Todo marked as done!");
      } catch (error) {
        console.error('Error updating todo: ', error);
      }
  };
  const markAsImportant = async (todo) => {
      try {
        await updateDoc(doc(db, 'todos', todo?.id), {
          isImportant: true,
        });
        fetchTodos();
        alert("Todo marked as important!");
      } catch (error) {
        console.error('Error updating importance: ', error);
      }
  };
  const deleteTodo = async (todo) => {
      try {
        await deleteDoc(doc(db, 'todos', todo?.id));
        fetchTodos();
        alert("Todo deleted successfully!");
      } catch (error) {
        console.error('Error deleting todo: ', error);
      }
    };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    // Stop the current recognition instance if already listening
    if (isListening && recognitionInstance) {
      recognitionInstance.stop();
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true; // Enable continuous listening for real-time updates
    recognition.interimResults = true; // Enable interim results for real-time display

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript(""); // Clear the transcript when starting a new session
      setInterimTranscript(""); // Clear interim transcript
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " "; // Append final results
        } else {
          interim += result[0].transcript; // Capture interim results
        }
      }

      setTranscript((prev) => prev + final); // Update the final transcript
      setInterimTranscript(interim); // Update the interim transcript in real-time
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript(""); // Clear interim transcript when recognition ends
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
    setRecognitionInstance(recognition); // Store the recognition instance
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen); // Toggle modal state
  };

  const handleCommand = (command) => {
    const words = command.toLowerCase().split(" ");
    if (words.includes("add") && words.includes("to") && words.includes("do")) {
      const todo = command.replace(/add\s+to\s+do\s+/i, "").trim();
      if (todo) {
        addTodos(todo);
      } else {
        alert("Please specify a todo to add.");
      }
    } else if (
      words.includes("delete") &&
      words.includes("to") &&
      words.includes("do")
    ) {
      const todoName = command.replace(/delete\s+to\s+do\s+/i, "").trim();
      if (todoName) {
        // Fetch the todo object from Firestore by name
        const todo = todoss.find(
          (t) => t.name.toLowerCase() === todoName.toLowerCase()
        );
        if (todo) {
          deleteTodo(todo); // Pass the correct todo object
        } else {
          alert(`Todo "${todoName}" not found.`);
        }
      } else {
        alert("Please specify a todo to mark as done.");
      }
    } else if (
      words.includes("mark") &&
      words.includes("to") &&
      words.includes("do") &&
      words.includes("done")
    ) {
      const todoName = command
        .replace(/mark\s+to\s+do\s+/i, "")
        .replace(/\s+as\s+done/i, "")
        .trim();

      if (todoName) {
        // Fetch the todo object from Firestore by name
        const todo = todoss.find(
          (t) => t.name.toLowerCase() === todoName.toLowerCase()
        );
        if (todo) {
          markAsDone(todo); // Pass the correct todo object
        } else {
          alert(`Todo "${todoName}" not found.`);
        }
      } else {
        alert("Please specify a todo to mark as done.");
      }
    } else if (
      words.includes("mark") &&
      words.includes("to") &&
      words.includes("do") &&
      words.includes("important")
    ) {
      const todoName = command
        .replace(/mark\s+to\s+do\s+/i, "")
        .replace(/\s+as\s+important/i, "")
        .trim();

      if (todoName) {
        // Fetch the todo object from Firestore by name
        const todo = todoss.find(
          (t) => t.name.toLowerCase() === todoName.toLowerCase()
        );
        if (todo) {
          markAsImportant(todo); // Pass the correct todo object
        } else {
          alert(`Todo "${todoName}" not found.`);
        }
      } else {
        alert("Please specify a todo to mark as important.");
      }
    } else {
      alert("Command not recognized. Please try again.");
    }
  };

  const handleConfirmTranscript = () => {
    if (transcript.trim()) {
      handleCommand(transcript.trim()); // Parse and execute the command
      setTranscript(""); // Clear the transcript after confirmation
      setIsModalOpen(false); // Close the modal
      setIsListening(false); // Stop listening
      if (recognitionInstance) {
        recognitionInstance.stop(); // Stop the recognition instance
      }
    }
    else if (interimTranscript.trim()) {  
      handleCommand(interimTranscript.trim()); // Parse and execute the command
      setInterimTranscript(""); // Clear the interim transcript after confirmation
      setIsModalOpen(false); // Close the modal
      setIsListening(false); // Stop listening
      if (recognitionInstance) {
        recognitionInstance.stop(); // Stop the recognition instance
      }
  
    } else {
      alert("No command to confirm.");
    }
  };

  return (
    <>
      {/* Floating Button to Open Modal */}
      <div className="fixed bottom-20 left-6 sm:bottom-16 sm:left-10 z-50">
        <div className="relative">
          {/* AI Badge */}
          <div className="absolute -top-2 -left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-md">
            AI
          </div>
          {/* Voice Assistant Button */}
          <button
            onClick={toggleModal}
            className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 sm:p-6 rounded-full shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center ${
              isListening ? "animate-pulse" : ""
            }`}
            title="Open Voice Assistant"
            style={{ boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.3)" }}
          >
            <FaMicrophone className="text-2xl sm:text-3xl" />
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={toggleModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
              title="Close"
            >
              <FaTimes className="text-2xl" />
            </button>

            {/* Modal Content */}
            <h3 className="text-lg font-bold mb-4 flex items-center justify-center text-teal-600">
              <FaRobot className="text-2xl mr-2" />
              AI Voice Assistant
            </h3>

            {/* Voice Assistant Button */}
            <button
              onClick={startListening}
              className={`${
                isListening ? "bg-red-500 animate-pulse" : "bg-teal-500"
              } text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center w-full`}
              title={isListening ? "Stop Listening" : "Start Listening"}
            >
              {isListening ? (
                <FaMicrophoneSlash className="text-2xl" />
              ) : (
                <FaMicrophone className="text-2xl" />
              )}
            </button>

            {/* Display the command list */}
            <div className="mt-4 bg-gradient-to-r from-blue-500 to-teal-500 bg-opacity-80 backdrop-blur-md text-white p-4 rounded-lg shadow-lg text-center animate-fade-in">
              <h4 className="text-lg font-bold mb-2 flex items-center justify-center">
                <FaRobot className="text-xl mr-2" />
                Command List
              </h4>
              <ul className="text-white text-left list-disc list-inside space-y-1">
                <li>
                  <strong>Add Todo:</strong> "Add to do [your todo]"
                </li>
                <li>
                  <strong>Delete Todo:</strong> "Delete to do [todo name]"
                </li>
                <li>
                  <strong>Mark Todo as Done:</strong> "Mark to do [todo name] as
                  done"
                </li>
                <li>
                  <strong>Mark Todo as Important:</strong> "Mark to do [todo
                  name] as important"
                </li>
              </ul>
            </div>

            {/* Display the transcript */}
            {(transcript || interimTranscript) && (
              <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-lg text-center animate-bounce-in">
                <p className="text-gray-800 font-medium">You said:</p>
                <p className="text-teal-600 font-bold">
                  {transcript}
                  <span className="text-gray-400">{interimTranscript}</span>
                </p>
                <div className="flex justify-center space-x-4 mt-4">
                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmTranscript}
                    className="bg-green-500 text-white px-4 py-2 rounded-full shadow hover:bg-green-400 transition"
                    title="Confirm Command"
                  >
                    <FaCheck className="text-xl" />
                  </button>
                  {/* Retry Button */}
                  <button
                    onClick={startListening}
                    className="bg-blue-500 text-white px-4 py-2 rounded-full shadow hover:bg-blue-400 transition"
                    title="Retry Command"
                  >
                    <FaRedo className="text-xl" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;
