import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import HabitTracker from "./HabitTracker";
import GoalTracker from "./GoalTracker";
import ToDoList from "./TodoList";
import Journal from "./Journal";
import Pomodoro from "./Pomodoro";
import VoiceAssistant from "./VoiceAssistant";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomToolbar = (toolbar) => {
  const { theme } = useAuth(); // Get the theme from context
  const textColor = theme === "dark" ? "text-gray-200" : "text-gray-800";
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const isNotToday = new Date().toDateString() !== toolbar.date.toDateString();

  return (
    <div
      className={`flex flex-wrap md:flex-nowrap justify-between items-center p-4 rounded-lg shadow-md mb-2 ${bgColor}`}
    >
      {/* Navigation Buttons */}
      <div className="flex items-center gap-4 mb-2 md:mb-0">
        <button
          onClick={() => toolbar.onNavigate("PREV")}
          className={`font-bold ${textColor} text-2xl`}
        >
          ‹
        </button>
        <span className={`text-lg font-bold ${textColor}`}>
          {toolbar.label} {/* Displays the current month/year */}
        </span>
        <button
          onClick={() => toolbar.onNavigate("NEXT")}
          className={`font-bold ${textColor} text-2xl`}
        >
          ›
        </button>
      </div>

      {/* View Options */}
      <div className="flex flex-wrap gap-2">
        {isNotToday && ( // Render "Today" button only if the current date is not today
          <button
            onClick={() => toolbar.onNavigate("TODAY")} // Navigate to today
            className={`px-3 py-1 rounded-lg font-bold outline outline-1 ${textColor}`}
          >
            Today
          </button>
        )}
        <button
          onClick={() => toolbar.onView("month")}
          className={`px-3 py-1 rounded-lg font-bold ${
            toolbar.view === "month"
              ? "bg-teal-500 text-white"
              : `${bgColor} ${textColor}`
          }`}
        >
          Month
        </button>
        <button
          onClick={() => toolbar.onView("week")}
          className={`px-3 py-1 rounded-lg font-bold ${
            toolbar.view === "week"
              ? "bg-teal-500 text-white"
              : `${bgColor} ${textColor}`
          }`}
        >
          Week
        </button>
        <button
          onClick={() => toolbar.onView("day")}
          className={`px-3 py-1 rounded-lg font-bold ${
            toolbar.view === "day"
              ? "bg-teal-500 text-white"
              : `${bgColor} ${textColor}`
          }`}
        >
          Day
        </button>
        <button
          onClick={() => toolbar.onView("agenda")}
          className={`px-3 py-1 rounded-lg font-bold ${
            toolbar.view === "agenda"
              ? "bg-teal-500 text-white"
              : `${bgColor} ${textColor}`
          }`}
        >
          Agenda
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser, userLoggedIn, theme } = useAuth();
  const [showCalendarModal, setShowCalendarModal] = useState(false); // State to control calendar modal visibility
  const [calendarEvents, setCalendarEvents] = useState([]);
  const navigate = useNavigate();
  const [pomodoroTitle, setPomodoroTitle] = useState(""); // State to hold the Pomodoro session title
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false); // State to track if Pomodoro is running
  const [initialMinutes, setInitialMinutes] = useState(25); // Initial minutes for Pomodoro timer
  

  // Redirect to login if not logged in
  if (!userLoggedIn) {
    navigate("/login");
  }

  useEffect(() => {
    const storedMinutes = localStorage.getItem("pomodoroInitialMinutes");
    if (storedMinutes) {
      setInitialMinutes(parseInt(storedMinutes, 10));
    }
  }, []);
  const triggerPomodoro = (title) => {
    setPomodoroTitle(title);
    setIsPomodoroRunning(true); // Start the Pomodoro session
  };

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

  const toggleCalendarModal = (events = []) => {
    setCalendarEvents(events); // Set the events to display in the calendar
    setShowCalendarModal(!showCalendarModal); // Toggle the modal visibility
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
            className={` border-white col-span-1 lg:col-span-2 p-6 shadow-xl rounded-lg backdrop-blur-lg transition-transform transform hover:scale-105 hover:shadow-2xl ${
              theme === "dark" ? "bg-gray-800/40 " : "bg-white/40"
            } `}
          >
            <GoalTracker
              toggleCalendarModal={toggleCalendarModal}
              onTriggerPomodoro={triggerPomodoro}
            />
          </div>

          {/* ToDoList Component (Second largest) */}
          <div
            className={`col-span-1 lg:col-span-1 p-6 shadow-xl rounded-lg backdrop-blur-lg  transition-transform transform hover:scale-105 hover:shadow-2xl ${
              theme === "dark" ? "bg-gray-900/40 " : "bg-white/40"
            }`}
          >
            <ToDoList todos={todos} onTriggerPomodoro={triggerPomodoro} />
          </div>

          {/* HabitTracker Component (Smallest) */}
          <div
            className={`col-span-1 lg:col-span-1 p-6 shadow-xl rounded-lg backdrop-blur-lg  transition-transform transform hover:scale-105 hover:shadow-2xl  ${
              theme === "dark" ? "bg-gray-800/40 " : "bg-white/40"
            }`}
          >
            <HabitTracker onTriggerPomodoro={triggerPomodoro} />
          </div>

          {/* Journal Component */}
          <div
            className={`col-span-1 lg:col-span-2 p-6 shadow-xl rounded-lg backdrop-blur-lg  transition-transform transform hover:scale-105 hover:shadow-2xl ${
              theme === "dark" ? "bg-gray-800/30 " : "bg-white/40"
            }`}
          >
            <Journal />
          </div>
        </div>

        {/* Pomodoro Timer */}
        <Pomodoro
          initialTitle={pomodoroTitle}
          isRunning={isPomodoroRunning}
          setIsRunning={setIsPomodoroRunning}
          initialMinutes={initialMinutes}
        />

        {/* Voice Assistant */}
        <VoiceAssistant
          addTodo={addTodo}
          deleteTodo={deleteTodo}
          markAsDone={markAsDone}
          markAsImportant={markAsImportant}
        />

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/whiteboard")}
            className={`relative group cursor-pointer inline-block px-8 py-6 rounded-lg shadow-lg font-bold transition-transform transform hover:scale-105 ${
              theme === "dark"
                ? "bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 text-white border border-gray-500"
                : "bg-gradient-to-r from-white via-gray-100 to-gray-200 text-gray-800 border border-gray-300"
            }`}
          >
            <div
              onClick={() => navigate("/whiteboard")}
              className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                theme === "dark"
                  ? "bg-gray-700 text-white border border-gray-500"
                  : "bg-white text-gray-800 border border-gray-300"
              }`}
            >
              🖍️
            </div>

            <span className="block text-lg">
              <span
                className={`block text-2xl font-extrabold ${
                  theme === "dark" ? "text-teal-400" : "text-teal-600"
                }`}
              >
                Open Whiteboard
              </span>
              <span
                className={`block text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Create, draw, and brainstorm!
              </span>
            </span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/community")}
            className={`  text-white px-6 py-3 rounded-lg shadow-lg font-bold transition-transform transform hover:scale-105 ${
              theme === "dark"
                ? "bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800 hover:from-purple-700 hover:via-purple-500 hover:to-purple-800"
                : "bg-gradient-to-r from-purple-600 via-purple-300 to-purple-400 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6-10a4 4 0 11-8 0 4 4 0 018 0zm6 4h.01"
              />
            </svg>
            Join the Community
          </button>
        </div>

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
      {/* Calendar Modal */}
      {showCalendarModal && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black opacity-50 z-40"></div>

          {/* Modal */}
          <div
            className={`fixed inset-0 flex items-center justify-center z-50`}
          >
            <div
              className={` ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-300"
              } p-6 rounded-lg shadow-lg w-full max-w-4xl`}
            >
              {/* Modal Header */}
              <div
                className={`flex justify-between items-center mb-4 ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                <h3
                  className={`text-xl font-bold ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                >
                  Calendar View
                </h3>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className={`text-red-500 hover:text-red-600`}
                >
                  ✕
                </button>
              </div>

              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                defaultView="day"
                endAccessor="end"
                components={{
                  toolbar: (props) => (
                    <CustomToolbar {...props} theme={theme} />
                  ), // Pass theme to CustomToolbar
                }}
                selectable
                style={{ height: 500 }}
                className={`rounded-lg shadow-md ${
                  theme === "dark"
                    ? "bg-gray-800 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                }`}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.completed ? "#1d9a8a" : "#3182ce",
                    color: "white",
                    borderRadius: "5px",
                    border: "none",
                    padding: "5px",
                  },
                })}
              />

              {/* Modal Footer */}
              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className={`bg-red-500 text-white px-4 py-2 rounded-lg font-bold ${
                    theme === "dark" ? "hover:bg-red-600" : "hover:bg-red-400"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
