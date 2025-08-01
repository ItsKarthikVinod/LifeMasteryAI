import React, { useState, useEffect} from "react";
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
import GamificationProgress from "./GamificationProgress";
import { ToastContainer } from "react-toastify";
import MotivationReminderWidget from "./MotivationReminderWidget";
import useGetHabits from "../hooks/useGetHabits";
import useGetGoals from "../hooks/useGetGoals";
import useGetTodos from "../hooks/useGetTodos";
import { Wheel } from "react-custom-roulette";
import Logo from "../assets/LifeMasteryLogo.png";
import Confetti from "react-confetti"; 
import { Link } from "react-router-dom";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebase";
import PlannerSidebar from "./PlannerSidebar";

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
  const { fetchedHabits } = useGetHabits();
  const { goalss} = useGetGoals();
  const { todoss } = useGetTodos();
  const isGuest = currentUser && currentUser.isAnonymous;
  const [plannerOpen, setPlannerOpen] = useState(false);

  const [adminEmails, setAdminEmails] = useState([]);
  useEffect(() => {
      const fetchAdmins = async () => {
        try {
          const snapshot = await getDocs(collection(db, "admins"));
          if (snapshot.empty) {
            console.warn("No admins found in the database.");
            return;
          }
          const emails = snapshot.docs.map((doc) => doc.id);
          setAdminEmails(emails);
        } catch (err) {
          console.error("Error fetching admins:", err);
        }
      };
      fetchAdmins();
    }, []);

  const isAdmin = (email) => adminEmails.includes(email);
  // Notification.requestPermission().then((permission) => {
  //   if (permission === "granted") {
  //     new Notification("Time to reflect 🌱", {
  //       body: "Take 5 minutes to journal and calm your mind.",
  //       icon: "android-chrome-512x512.png",
  //     });
  //   }
  // });

  // Redirect to login if not logged in
  if (!userLoggedIn) {
    navigate("/login");
  }

  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []);

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

  const [isRoulette, setIsRoulette] = useState(false); // Modal visibility
  const [mustSpin, setMustSpin] = useState(false); // Spin state
  const [prizeNumber, setPrizeNumber] = useState(0); // Selected prize index
  const [selectedItem, setSelectedItem] = useState(null); // Selected item

  const items = [
    ...(todoss || [])
      .filter((todo) => !todo.isCompleted) // Exclude completed/done todos
      .map((todo) => ({
        name: `Todo: ${todo.name}`,
        option: todo.name,
      })),
    ...(fetchedHabits || [])
      .filter(
        (habit) =>
          !habit?.completedDates?.includes(new Date().toISOString().slice(0, 10))
      ) 
      .map((habit) => ({
        name: `Habit: ${habit.name}`,
        option: habit.name,
      })),
    ...(goalss || []).flatMap((goal) =>
      (goal.subGoals || [])
        .filter((subGoal) => !subGoal.completed) // Exclude completed/done subgoals
        .map((subGoal) => ({
          name: `SubGoal: ${subGoal.name} (Goal: ${goal.name})`,
          option: subGoal.name,
        }))
    ),
  ];

  const openRouletteModal = () => {
    if (!items || items.length === 0) {
      setSelectedItem("Add some todos/goals/habits to unlock Roulette");
      setIsRoulette(true);
      return;
    }
    setSelectedItem(null);
    setIsRoulette(true);
  };

  const handleSpin = () => {
    if (!items || items.length === 0) {
      setSelectedItem("Add some todos/goals/habits to unlock Roulette");
      return;
    }
    const randomPrizeNumber = Math.floor(Math.random() * items.length);
    setPrizeNumber(randomPrizeNumber);
    setMustSpin(true);
  };

  const handleSpinComplete = () => {
    if (!items || items.length === 0) {
      setSelectedItem("Add some todos/goals/habits to unlock Roulette");
    } else if (prizeNumber >= 0 && prizeNumber < items.length) {
      setSelectedItem(items[prizeNumber].name);
    } else {
      setSelectedItem("No items available");
    }
    setMustSpin(false);
  };
  

  

  

  const closeRouletteModal = () => {
    setSelectedItem(null); // Reset selected item when closing
    setIsRoulette(false);
  };

 

  
  const truncateText = (text, maxLength = 12) => {
    if (typeof text !== "string") {
      if (text === null || text === undefined) return "";
      return String(text).length > maxLength
        ? String(text).slice(0, maxLength - 3) + "..."
        : String(text);
    }
    return text.length > maxLength
      ? text.slice(0, maxLength - 3) + "..."
      : text;
  };

  const truncatedItems = (items || [])
    .filter(
      (item) => typeof item?.option === "string" && item.option.trim() !== ""
    )
    .map((item) => ({
      ...item,
      option: truncateText(item.option),
    }));
  
  
  if (!currentUser) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
          <div className="bg-white rounded-xl shadow-lg p-8 mt-24 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-teal-700">
              Please sign in to access your dashboard
            </h2>
            <Link
              to="/login"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold shadow hover:bg-teal-700 transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      );
    }

  return (
    <div
      className={` min-h-screen pt-6 ${
        theme === "dark"
          ? "bg-gradient-to-r from-gray-900 via-teal-800 to-blue-900"
          : "bg-gradient-to-r from-teal-400 to-blue-500"
      } ${isGuest === true ? "pt-[7rem] lg:pt-16" : "pt-0"} `}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <ToastContainer />

      <div className="p-8 mt-12">
        {/* Welcome Section */}
        <div
          className={`
            flex flex-col gap-8
            lg:flex-row lg:gap-0
            items-center
            justify-between
            mb-6 shadow-lg rounded-lg p-6 mt-2
            ${
              theme === "dark"
                ? "bg-gray-800/50 backdrop-blur-lg"
                : "bg-white/50 backdrop-blur-lg"
            }
          `}
        >
          {/* Gamification Progress (Left) */}
          <div className="w-full lg:w-1/3 flex justify-center lg:justify-start mb-6 lg:mb-0">
            <GamificationProgress />
          </div>

          {/* Welcome Section (Center) */}
          <div className="w-full lg:w-1/3 flex flex-col items-center justify-center text-center px-2">
            <h1
              className={`text-4xl font-bold ${
                theme === "dark" ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Welcome to your Dashboard
            </h1>
            <p
              className={`mt-4 text-lg flex items-center justify-center ${
                theme === "dark" ? "text-gray-100" : "text-gray-600"
              }`}
            >
              <img
                src={
                  currentUser.photoURL
                    ? currentUser?.photoURL
                    : "https://www.svgrepo.com/show/213788/avatar-user.svg"
                }
                className="w-12 h-12 rounded-full mr-3 shadow-lg"
                alt="User Avatar"
              />
              Hi,{" "}
              {currentUser.isAnonymous
                ? "Guest"
                : currentUser.displayName
                ? currentUser.displayName
                : currentUser.email}
              !
              {isAdmin(currentUser.email) && (
                <span
                  className={`px-2 py-1 ml-2 rounded-full font-bold shadow
      ${
        theme === "dark"
          ? "bg-yellow-600 text-gray-900 border border-yellow-400"
          : "bg-yellow-300 text-gray-900 border border-yellow-400"
      }`}
                  style={{
                    letterSpacing: "0.5px",
                    fontSize: "0.85em",
                    boxShadow:
                      theme === "dark"
                        ? "0 2px 8px rgba(255, 255, 0, 0.08)"
                        : "0 2px 8px rgba(255, 200, 0, 0.10)",
                  }}
                >
                  Admin
                </span>
              )}
            </p>
          </div>

          {/* Motivation & Reminders Widget (Right) */}
          <div className="w-full lg:w-1/3 flex justify-center  mt-6 lg:mt-0">
            <MotivationReminderWidget openRouletteModal={openRouletteModal} />
          </div>
        </div>
        {/* Dashboard main section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* ToDoList: order-1 on mobile, order-2 on desktop (top right) */}
          <div
            className={`
      order-1 md:order-2
      col-span-1 lg:col-span-1
      p-6 shadow-xl rounded-lg backdrop-blur-lg transition-transform transform hover:scale-105 hover:shadow-2xl
      ${theme === "dark" ? "bg-gray-900/40 " : "bg-white/40"}
    `}
          >
            <ToDoList todos={todos} onTriggerPomodoro={triggerPomodoro} />
          </div>

          {/* GoalTracker: order-2 on mobile, order-1 on desktop (top left, large) */}
          <div
            className={`
      order-2 md:order-1
      border-white col-span-1 lg:col-span-2
      p-6 shadow-xl rounded-lg backdrop-blur-lg transition-transform transform hover:scale-105 hover:shadow-2xl
      ${theme === "dark" ? "bg-gray-800/40 " : "bg-white/40"}
    `}
          >
            <GoalTracker
              toggleCalendarModal={toggleCalendarModal}
              onTriggerPomodoro={triggerPomodoro}
            />
          </div>

          {/* HabitTracker: order-3 always (bottom left on desktop) */}
          <div
            className={`
      order-3
      col-span-1 lg:col-span-1
      p-6 shadow-xl rounded-lg backdrop-blur-lg transition-transform transform hover:scale-105 hover:shadow-2xl
      ${theme === "dark" ? "bg-gray-800/40 " : "bg-white/40"}
    `}
          >
            <HabitTracker onTriggerPomodoro={triggerPomodoro} />
          </div>

          {/* Journal: order-4 always (bottom right on desktop) */}
          <div
            className={`
      order-4
      col-span-1 lg:col-span-2
      p-6 shadow-xl rounded-lg backdrop-blur-lg transition-transform transform hover:scale-105 hover:shadow-2xl
      ${theme === "dark" ? "bg-gray-800/30 " : "bg-white/40"}
    `}
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

        {/* Sticky Rotated Button (Desktop) & Floating Button (Mobile) */}

        {!plannerOpen && (
          <>
            <button
              onClick={() => setPlannerOpen(true)}
              className={`
    fixed z-[10001] right-5 top-1/2 transform -translate-y-1/2
    bg-teal-700 text-white font-bold shadow-lg
    px-4 py-2 rounded-tr-2xl rounded-tl-2xl
    transition hover:bg-teal-700
    origin-right
    -rotate-90
    hidden sm:block
    ring-2 ring-teal-300/50
  `}
            >
              <span className="transition animate-bounce">🗓️</span> Plan My Day
            </button>
            <button
              onClick={() => setPlannerOpen(true)}
              className={`
    fixed z-[10001] right-0 top-1/2 transform -translate-y-1/2
    bg-teal-700 text-white font-bold shadow-lg
    px-3 py-3 rounded-tl-2xl rounded-bl-2xl
    transition hover:bg-teal-700
    origin-right
    ring-2 ring-teal-300/50
    block sm:hidden
  `}
            >
              🗓️
            </button>
          </>
        )}

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
      <PlannerSidebar
        isOpen={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        todos={todoss || []}
        habits={fetchedHabits || []}
        subgoals={(goalss || []).flatMap((goal) =>
          (goal.subGoals || []).map((sub) => ({
            ...sub,
            id: sub.id || `${goal.id}-${sub.name}`,
            goalName: goal.name,
          }))
        )}
      />
      {/* Roulette Modal */}
      {isRoulette && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity z-[-40]"></div>
          <div
            className={`relative z-50 p-8 rounded-lg shadow-lg w-11/12 max-w-3xl ${
              theme === "dark"
                ? "bg-gradient-to-br from-[#0F4F51] via-[#1A9A9D] to-[#232b2b] text-gray-100"
                : "bg-gradient-to-br from-[#E0F7FA] via-[#B2EBF2] to-[#F5F5DC] text-gray-900"
            }`}
          >
            {/* Close Button */}
            <button
              onClick={closeRouletteModal}
              className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-red-500 transition z-50"
              aria-label="Close"
            >
              &times;
            </button>
            <h3
              className={`text-2xl font-bold mb-6 text-center ${
                theme === "dark" ? "text-teal-300" : "text-teal-700"
              }`}
            >
              🎰 Spin the Wheel
            </h3>
            <div className="flex flex-col items-center ">
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber ? prizeNumber : 0}
                data={
                  truncatedItems.length > 0
                    ? truncatedItems
                    : [{ name: "No items available" }]
                }
                backgroundColors={
                  theme === "dark"
                    ? ["#0F4F51", "#8B7349", "#4A4A3C"]
                    : [
                        "#1A9A9D", // Teal
                        "#E1C38F", // Gold

                        "#F5F5DC", // Beige
                      ]
                }
                textColors={theme === "dark" ? ["#ffffff"] : ["#333333"]}
                radiusLineColor={["#333333"]}
                outerBorderColor={["#333333"]}
                // Darker text color for better readability
                fontSize={12} // Adjust font size for better readability
                outerBorderWidth={10} // Add a thicker border
                innerRadius={30} // Adjust inner radius to avoid "black hole"
                radiusLineWidth={3} // Add a radius line for better visuals
                onStopSpinning={handleSpinComplete}
              />
              <img
                src={Logo}
                alt="Life Mastery Logo"
                className="absolute top-1/2 left-1/2 w-28 h-28 rounded-full shadow-lg pointer-events-none"
                style={{ transform: "translate(-50%, -60%)" }}
              />
              <button
                onClick={handleSpin}
                className="mt-6 px-6 py-3 bg-teal-500 text-white rounded-lg shadow hover:bg-teal-600 transition"
              >
                Spin the Wheel
              </button>
            </div>
            {selectedItem && (
              <div className="fixed inset-0 flex flex-col items-center justify-center z-[999] pointer-events-none">
                <Confetti
                  width={window.innerWidth}
                  height={window.innerHeight}
                  recycle={false}
                />
                <div
                  className={` ${
                    theme === "dark" ? "bg-gray-900/90" : "bg-white/90"
                  } rounded-2xl shadow-2xl px-10 py-8 border-4 border-teal-400 flex flex-col items-center pointer-events-auto`}
                >
                  <span className="text-5xl mb-4">🎉</span>
                  <div
                    className={`text-2xl font-extrabold ${
                      theme === "dark" ? "text-teal-300" : "text-teal-700"
                    } text-center mb-2`}
                  >
                    Do this next:
                  </div>
                  <div
                    className={` text-3xl font-bold ${
                      theme === "dark" ? "text-gray-100" : "text-gray-800"
                    } text-center mb-6`}
                  >
                    {selectedItem}
                  </div>
                  <div className="flex gap-6 mt-2">
                    {/* OK Button */}
                    <button
                      onClick={closeRouletteModal}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow transition
            ${
              theme === "dark"
                ? "bg-teal-700 hover:bg-teal-600 text-white"
                : "bg-teal-500 hover:bg-teal-400 text-white"
            }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      OK
                    </button>
                    {/* Spin Again Button */}
                    <button
                      onClick={() => {
                        setSelectedItem(null);
                        handleSpin();
                      }}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow transition
            ${
              theme === "dark"
                ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                : "bg-yellow-400 hover:bg-yellow-300 text-gray-900"
            }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582M20 20v-5h-.581M5.002 15A7.978 7.978 0 0112 17c1.657 0 3.182-.507 4.418-1.373M19 9a7.978 7.978 0 00-7-4c-1.657 0-3.182.507-4.418 1.373"
                        />
                      </svg>
                      Spin Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
