import React, { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { useAuth } from '../contexts/authContext';
import useGetGame from '../hooks/useGetGame';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const Journal = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser, theme } = useAuth();
  const userId = currentUser.uid;
  const { awardXP } = useGetGame(); // Get the awardXP function

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (title && content) {
      setIsSubmitting(true);

      try {
        await addDoc(collection(db, 'journalEntries'), {
          title,
          content,
          createdAt: serverTimestamp(),
          userId,
        });
        // Award XP for writing a journal entry
        await awardXP(userId, 10); // Award 10 XP for writing a journal entry
        toast.success("+10 XP gained for adding a journal Entry!", {
                  position: "top-right",
                  autoClose: 3000, // Toast lasts for 3 seconds
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });
        // Reset the form fields
        setTitle('');
        setContent('');
        alert('Journal entry saved!');
      } catch (error) {
        console.error('Error adding journal entry: ', error);
        alert('Error saving your journal entry.');
      }

      setIsSubmitting(false);
    } else {
      alert('Please fill in both the title and content!');
    }
  };

  return (
    <div>
      <h2
        className={`text-2xl font-semibold text-center mb-4 ${
          theme === "dark" ? "text-teal-400" : "text-gray-900"
        }`}
      >
        Write Your Journal
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className={`block font-medium ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-md ${
              theme === "dark"
                ? "bg-gray-700 text-white"
                : "bg-white text-black"
            }`}
            placeholder="Title of your journal"
            required
          />
        </div>
        <div>
          <label
            className={`block font-medium ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Content
          </label>
          
          <ReactQuill
            value={content}
            onChange={setContent}
            placeholder='Write your journal entry here...'
            theme="snow"
            className={`w-full border border-gray-300 rounded-md  ${
              theme === "dark"
                ? ""
                : " text-black"
            }`}
            style={{
              minHeight: "200px",
              maxHeight: "400px",
              overflowY: "auto",
              background: theme === "dark" ? "#374151" : "#fff",
              color: theme === "dark" ? "#fff" : "#000",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              padding: "0.5rem 1rem",
              
            }}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Entry"}
        </button>
      </form>

      {/* Redirection link to Journal List */}
      <div className="mt-6 text-center relative">
        <Link
          to="/journal-list"
          className="text-black-500 rounded bg-white/70 px-3 py-2 hover:underline flex items-center justify-center relative text-sm shadow-md border border-gray-200"
          style={{ maxWidth: "200px", margin: "0 auto" }}
        >
          <span className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white text-xs font-semibold py-0.5 px-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            AI
          </span>
          View Your Journal Entries
        </Link>
      </div>
    </div>
  );
};

export default Journal;
