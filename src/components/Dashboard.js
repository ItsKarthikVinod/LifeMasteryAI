import React, { useState } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import HabitTracker from "./HabitTracker";
import GoalTracker from "./GoalTracker";
import ToDoList from "./TodoList";
import Journal from "./Journal";
import Pomodoro from "./Pomodoro";
import VoiceAssistant from "./VoiceAssistant";

const Dashboard = () => {
  const { currentUser, userLoggedIn, theme } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not logged in
  if (!userLoggedIn) {
    navigate("/login");
  }

  // State for managing todos
  const [todos, setTodos] = useState([]);

  // Add a new todo
  const addTodo = (todo) => {
    setTodos((prevTodos) => [
      ...prevTodos,
      { text: todo, done: false, important: false },
    ]);
  };

  // Delete a todo
  const deleteTodo = (todo) => {
    setTodos((prevTodos) => prevTodos.filter((t) => t.text !== todo));
  };

  // Mark a todo as done
  const markAsDone = (todo) => {
    setTodos((prevTodos) =>
      prevTodos.map((t) => (t.text === todo ? { ...t, done: true } : t))
    );
  };

  // Mark a todo as important
  const markAsImportant = (todo) => {
    setTodos((prevTodos) =>
      prevTodos.map((t) => (t.text === todo ? { ...t, important: true } : t))
    );
  };

  return (
    <div
      className={` min-h-screen pt-6 ${
        theme === "dark"
          ? "bg-gradient-to-r from-gray-900 via-teal-800 to-blue-900"
          : "bg-gradient-to-r from-teal-400 to-blue-500"
      } `}
    >
      <div className="p-8 mt-12">
        <div
          className={`text-center mb-6  shadow-lg rounded-lg p-3 mt-2 ${
            theme === "dark"
              ? " bg-gray-800/90 backdrop-blur-lg"
              : "bg-white/50 backdrop-blur-lg"
          }`}
        >
          <h1
            className={`text-4xl font-bold ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Welcome to your Dashboard
          </h1>

          <p
            className={` mt-2 text-lg flex items-center justify-center ${
              theme === "dark" ? "text-gray-100" : "text-gray-600"
            }`}
          >
            <img
              src={
                currentUser.photoURL
                  ? currentUser?.photoURL
                  : "https://www.svgrepo.com/show/213788/avatar-user.svg"
              }
              className="w-10 h-10 rounded-full mr-3"
              alt="User Avatar"
            />
            Hi,{" "}
            {currentUser.displayName
              ? currentUser.displayName
              : currentUser.email}
            !
          </p>
        </div>

        {/* Dashboard main section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* GoalTracker Component (Largest) */}
          <div
            className={` border-white col-span-1 lg:col-span-2 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/50 transition-transform transform hover:scale-105 hover:shadow-2xl ${
              theme === "dark" ? "bg-gray-800/40 " : "bg-white/40"
            } `}
          >
            <GoalTracker />
          </div>

          {/* ToDoList Component (Second largest) */}
          <div
            className={`col-span-1 lg:col-span-1 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/30 transition-transform transform hover:scale-105 hover:shadow-2xl ${
              theme === "dark" ? "bg-gray-900/40 " : "bg-white/40"
            }`}
          >
            <ToDoList todos={todos} />
          </div>

          {/* HabitTracker Component (Smallest) */}
          <div
            className={`col-span-1 lg:col-span-1 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/30 transition-transform transform hover:scale-105 hover:shadow-2xl  ${
              theme === "dark" ? "bg-gray-800/40 " : "bg-white/40"
            }`}
          >
            <HabitTracker />
          </div>

          {/* Journal Component */}
          <div
            className={`col-span-1 lg:col-span-2 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/40 transition-transform transform hover:scale-105 hover:shadow-2xl ${
              theme === "dark" ? "bg-gray-800/30 " : "bg-white/40"
            }`}
          >
            <Journal />
          </div>
        </div>

        {/* Pomodoro Timer */}
        <Pomodoro />

        {/* Voice Assistant */}
        <VoiceAssistant
          addTodo={addTodo}
          deleteTodo={deleteTodo}
          markAsDone={markAsDone}
          markAsImportant={markAsImportant}
        />

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/login")}
            className={` text-white px-6 py-3 rounded-lg shadow  transition  ${
              theme === "dark"
                ? "bg-teal-600 hover:bg-teal-500"
                : "bg-teal-500 hover:bg-teal-400"
            }`}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
