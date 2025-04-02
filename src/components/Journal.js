import React, { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { useAuth } from '../contexts/authContext';

const Journal = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser, theme } = useAuth();
  const userId = currentUser.uid;

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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-md ${
              theme === "dark"
                ? "bg-gray-700 text-white"
                : "bg-white text-black"
            }`}
            rows="6"
            placeholder="Write your thoughts here..."
            required
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
