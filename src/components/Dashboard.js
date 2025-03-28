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
  const { currentUser, userLoggedIn } = useAuth();
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
    <div className="bg-gradient-to-r from-teal-400 to-blue-500 min-h-screen p-6">
      <div className="p-8 mt-12">
        <div className="text-center mb-6 bg-white shadow-lg rounded-lg p-3 mt-2">
          <h1 className="text-4xl font-bold text-gray-800">
            Welcome to your Dashboard
          </h1>

          <p className="text-gray-600 mt-2 text-lg flex items-center justify-center">
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
          <div className=" border-white col-span-1 lg:col-span-2 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/50 transition-transform transform hover:scale-105 hover:shadow-2xl ">
            <GoalTracker />
          </div>

          {/* ToDoList Component (Second largest) */}
          <div className="col-span-1 lg:col-span-1 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/30 transition-transform transform hover:scale-105 hover:shadow-2xl">
            <ToDoList todos={todos} />
          </div>

          {/* HabitTracker Component (Smallest) */}
          <div className="col-span-1 lg:col-span-1 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/30 transition-transform transform hover:scale-105 hover:shadow-2xl">
            <HabitTracker />
          </div>

          {/* Journal Component */}
          <div className="col-span-1 lg:col-span-2 p-6 shadow-xl rounded-lg backdrop-blur-lg bg-white/40 transition-transform transform hover:scale-105 hover:shadow-2xl">
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
            className="bg-teal-500 text-white px-6 py-3 rounded-lg shadow hover:bg-teal-400 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
