import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FaTimes,
  FaPlus,
  FaSave,
  FaChevronRight,
  FaListUl,
  FaLayerGroup,
  FaTrash,
  FaExpand,
  FaCompress,
  FaQuestion,
  FaClock,
} from "react-icons/fa";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/authContext";
import Datepicker from "tailwind-datepicker-react";

// Helper to get today's date string in readable format
const todayStr = (date) => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Motivational quotes
const QUOTES = [
  "Small steps every day lead to big results.",
  "Focus on progress, not perfection.",
  "You are your only limit.",
  "Stay consistent. Success will follow.",
  "Plan your day, own your life.",
  "Discipline is the bridge between goals and accomplishment.",
  "Every accomplishment starts with the decision to try.",
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// Helper: Remove completed tasks from plan
function filterCompleted(plan, allTasks) {
  const isActive = (id) => !!allTasks[id];
  return {
    urgent_important: plan.urgent_important
      ? plan.urgent_important.filter(isActive)
      : [],
    not_urgent_important: plan.not_urgent_important
      ? plan.not_urgent_important.filter(isActive)
      : [],
    urgent_not_important: plan.urgent_not_important
      ? plan.urgent_not_important.filter(isActive)
      : [],
    not_urgent_not_important: plan.not_urgent_not_important
      ? plan.not_urgent_not_important.filter(isActive)
      : [],
    table: plan.table ? plan.table.filter(isActive) : [],
  };
}

const matrixBuckets = [
  {
    id: "urgent_important",
    label: "Urgent & Important",
    color: (isDark) =>
      isDark ? "from-red-900 to-red-700" : "from-red-400/40 to-red-100/80",
    description: "Do first",
    icon: "🔥",
  },
  {
    id: "not_urgent_important",
    label: "Not Urgent & Important",
    color: (isDark) =>
      isDark
        ? "from-green-900 to-green-700"
        : "from-green-400/40 to-green-100/80",
    description: "Schedule",
    icon: "🌱",
  },
  {
    id: "urgent_not_important",
    label: "Urgent & Not Important",
    color: (isDark) =>
      isDark
        ? "from-yellow-900 to-yellow-700"
        : "from-yellow-200/40 to-yellow-50/80",
    description: "Delegate",
    icon: "⚡",
  },
  {
    id: "not_urgent_not_important",
    label: "Not Urgent & Not Important",
    color: (isDark) =>
      isDark ? "from-gray-900 to-gray-700" : "from-gray-200/40 to-gray-100/80",
    description: "Eliminate",
    icon: "🧹",
  },
];

const glassCard = (isDark) =>
  `rounded-2xl shadow-lg p-4 mb-4 bg-gradient-to-br border ${
    isDark ? "border-gray-800" : "border-gray-200"
  } backdrop-blur-md`;

const getIcon = (type) => {
  if (type === "todo") return "📝";
  if (type === "habit") return "🔁";
  if (type === "subgoal") return "🎯";
  return "";
};

const DEFAULT_WIDTH = 480;
const FULLSCREEN_WIDTH = "100vw";

// Helper to format date as YYYY-MM-DD for Firestore doc id
function formatDateId(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  // Pad month and day
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const PlannerSidebar = ({
  isOpen,
  onClose,
  todos = [],
  habits = [],
  subgoals = [],
  refreshAllTasks,
  onTriggerPomodoro,
}) => {
  const { currentUser, theme } = useAuth();
  const userId = currentUser?.uid;
  const isDark = theme === "dark";
  console.log(isDark, theme)

  // Views: "table" (default) or "matrix"
  const [view, setView] = useState("table");

  // Planner state: Eisenhower buckets and table
  const [plan, setPlan] = useState({
    urgent_important: [],
    not_urgent_important: [],
    urgent_not_important: [],
    not_urgent_not_important: [],
    table: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [quote, setQuote] = useState(getRandomQuote());
  const [saving, setSaving] = useState(false);

  // Datepicker state
  const [showDatepicker, setShowDatepicker] = useState(false);
  // Date planning (use JS Date object)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Datepicker options
  const datepickerOptions = {
    title: "Pick a date to plan",
    autoHide: true,
    todayBtn: true,
    clearBtn: false,
    maxDate: new Date("2100-12-31"),
    minDate: new Date("2000-01-01"),
    theme: {
      background: isDark ? "bg-gray-800" : "bg-white",
      todayBtn: isDark ? "bg-teal-700" : "bg-teal-300",
      clearBtn: isDark ? "bg-gray-700" : "bg-gray-200",
      icons: isDark ? "text-teal-300" : "text-teal-700",
      text: isDark ? "text-teal-300" : "text-teal-700",
      disabledText: "text-gray-400",
      input: isDark
        ? "bg-gray-800 border-teal-700 text-teal-300"
        : "bg-white border-teal-300 text-teal-700",
      inputIcon: "",
      selected: isDark ? "bg-teal-700 text-white" : "bg-teal-500 text-white",
    },
    icons: {
      prev: () => <span>{"‹"}</span>,
      next: () => <span>{"›"}</span>,
    },
    datepickerClassNames: "top-12",
    defaultDate: selectedDate,
    language: "en",
  };

  console.log(datepickerOptions);

  const [unsaved, setUnsaved] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Compare plan with last saved plan
  const lastSavedPlanRef = React.useRef(null);

  useEffect(() => {
    if (!loading && !saving) {
      lastSavedPlanRef.current = JSON.stringify(plan);
      setUnsaved(false);
    }
    // eslint-disable-next-line
  }, [loading, saving]);

  // Mark unsaved if plan changes
  useEffect(() => {
    if (!loading && lastSavedPlanRef.current) {
      setUnsaved(JSON.stringify(plan) !== lastSavedPlanRef.current);
    }
    // eslint-disable-next-line
  }, [plan]);

  // Intercept close if unsaved
  const handleClose = () => {
    if (unsaved) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dropdown for Eisenhower Matrix explanation
  const [showMatrixInfo, setShowMatrixInfo] = useState(false);

  // Build a map of all available tasks for quick lookup (exclude completed todos/subgoals)
  const allTasks = useMemo(() => {
    const map = {};
    todos
      .filter((todo) => !todo.isCompleted)
      .forEach((t) => (map[t.id] = { ...t, type: "todo" }));
    habits.forEach((h) => (map[h.id] = { ...h, type: "habit" }));
    subgoals
      .filter((s) => !s.completed)
      .forEach((s) => (map[s.id] = { ...s, type: "subgoal" }));
    return map;
  }, [todos, habits, subgoals]);

  // Load plan from Firebase on open or date change
  useEffect(() => {
    if (!isOpen || !userId || !selectedDate) return;
    setLoading(true);
    (async () => {
      try {
        const ref = doc(db, "planner", `${userId}_${formatDateId(selectedDate)}`);
        const snap = await getDoc(ref);
        let loaded = {
          urgent_important: [],
          not_urgent_important: [],
          urgent_not_important: [],
          not_urgent_not_important: [],
          table: [],
        };
        if (snap.exists()) loaded = { ...loaded, ...snap.data() };
        // Remove completed tasks
        const filtered = filterCompleted(loaded, allTasks);
        setPlan(filtered);
        setLoading(false);
        setQuote(getRandomQuote());
      } catch (err) {
        setLoading(false);
        setPlan({
          urgent_important: [],
          not_urgent_important: [],
          urgent_not_important: [],
          not_urgent_not_important: [],
          table: [],
        });
      }
    })();
    if (refreshAllTasks) refreshAllTasks();
    // eslint-disable-next-line
  }, [isOpen, userId, selectedDate]);

  // Remove completed tasks on save/open/reload
  useEffect(() => {
    setPlan((prev) => filterCompleted(prev, allTasks));
    // eslint-disable-next-line
  }, [todos, habits, subgoals]);

  // Drag-and-drop handler
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    const sourceList = Array.from(plan[source.droppableId]);
    const [moved] = sourceList.splice(source.index, 1);
    const destList =
      source.droppableId === destination.droppableId
        ? sourceList
        : Array.from(plan[destination.droppableId]);
    destList.splice(destination.index, 0, moved);

    setPlan((prev) => ({
      ...prev,
      [source.droppableId]: sourceList,
      [destination.droppableId]: destList,
    }));
  };

  // Open add modal
  const openAddModal = () => {
    setSelectedToAdd([]);
    setShowAddModal(true);
  };

  // Add selected tasks to plan (default to table view and urgent_important bucket)
  const addSelectedToPlan = () => {
    setPlan((prev) => ({
      ...prev,
      table: [
        ...prev.table,
        ...selectedToAdd.filter(
          (id) =>
            !prev.table.includes(id) &&
            !matrixBuckets.some((b) => prev[b.id].includes(id))
        ),
      ],
      urgent_important: [
        ...prev.urgent_important,
        ...selectedToAdd.filter(
          (id) =>
            !prev.urgent_important.includes(id) &&
            !prev.table.includes(id) &&
            !matrixBuckets.some((b) => prev[b.id].includes(id))
        ),
      ],
    }));
    setShowAddModal(false);
  };

  // Remove a task from all buckets
  const removeFromPlan = (id) => {
    setPlan((prev) => {
      const newPlan = {};
      Object.keys(prev).forEach((bucket) => {
        newPlan[bucket] = prev[bucket].filter((tid) => tid !== id);
      });
      return newPlan;
    });
  };

  // Save plan to Firebase (for selected date)
  const savePlan = async () => {
    if (!userId || !selectedDate) return;
    setSaving(true);
    const filtered = filterCompleted(plan, allTasks);
    await setDoc(doc(db, "planner", `${userId}_${formatDateId(selectedDate)}`), filtered);
    setPlan(filtered);
    setSaving(false);
  };

  // All available tasks not already in plan
  const availableToAdd = Object.keys(allTasks).filter(
    (id) =>
      !plan.table.includes(id) &&
      !matrixBuckets.some((b) => plan[b.id].includes(id))
  );

  // Summary one-liner
  const summary =
    view === "table"
      ? plan.table.length === 0
        ? "No tasks planned for this day."
        : `You have ${plan.table.length} tasks in your planner.`
      : matrixBuckets.every((b) => plan[b.id].length === 0)
      ? "No tasks planned for this day."
      : matrixBuckets
          .map((b) => `${b.label}: ${plan[b.id].length}`)
          .join(" | ");

  // Sidebar classes
  const sidebarClass = `
    fixed top-0 right-0 h-full z-[9999] transition-transform duration-300
    ${isOpen ? "translate-x-0" : "translate-x-full"}
    ${isFullscreen ? "w-screen max-w-none" : "w-full sm:w-[480px]"}
    ${isDark ? "bg-gray-900/90 border-gray-800" : "bg-white/80 border-gray-200"}
    backdrop-blur-lg shadow-2xl border-l
    flex flex-col
  `;

  // Fullscreen toggle
  const handleFullscreenToggle = () => setIsFullscreen((prev) => !prev);

  // Datepicker change handler (returns JS Date object)
  const handleDatepickerChange = (date) => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      setSelectedDate(date);
    } else if (typeof date === "string" && !isNaN(new Date(date).getTime())) {
      setSelectedDate(new Date(date));
    } else {
      setSelectedDate(new Date());
    }
  };

  if (loading || saving) {
    return (
      <div className={sidebarClass}>
        <div className="flex items-center justify-center h-full">
          <div
            className={`text-xl ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={sidebarClass}
      style={
        isFullscreen
          ? {
              width: FULLSCREEN_WIDTH,
              maxWidth: FULLSCREEN_WIDTH,
              left: 0,
              right: 0,
            }
          : { maxWidth: DEFAULT_WIDTH }
      }
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${
          isDark
            ? "border-gray-800 bg-gray-900/80"
            : "border-gray-200 bg-white/60"
        } rounded-t-2xl`}
      >
        <div>
          <div
            className={`text-xs font-bold mb-1 ${
              isDark ? "text-teal-300" : "text-teal-500"
            }`}
          >
            {todayStr(selectedDate)}
          </div>
          <div
            className={`text-lg font-bold ${
              isDark ? "text-gray-100" : "text-gray-700"
            }`}
          >
            🗓️ Plan My Day
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div style={{minWidth:120}} >
            <Datepicker
              options={datepickerOptions}
              show={showDatepicker}
              setShow={setShowDatepicker}
              value={selectedDate}
              onChange={handleDatepickerChange}
            />
          </div>
          <button
            className={`p-2 rounded-lg transition ${
              view === "table"
                ? isDark
                  ? "bg-teal-800 text-teal-300"
                  : "bg-teal-100 text-teal-700"
                : isDark
                ? "hover:bg-gray-800 text-gray-400"
                : "hover:bg-gray-200 text-gray-400"
            }`}
            title="Task Table View"
            onClick={() => setView("table")}
          >
            <FaListUl />
          </button>
          <button
            className={`p-2 rounded-lg transition ${
              view === "matrix"
                ? isDark
                  ? "bg-teal-800 text-teal-300"
                  : "bg-teal-100 text-teal-700"
                : isDark
                ? "hover:bg-gray-800 text-gray-400"
                : "hover:bg-gray-200 text-gray-400"
            }`}
            title="Eisenhower Matrix View"
            onClick={() => setView("matrix")}
          >
            <FaLayerGroup />
          </button>
          <button
            className={`p-2 rounded-lg transition hidden sm:block ${
              isFullscreen
                ? isDark
                  ? "bg-blue-900 text-blue-300"
                  : "bg-blue-100 text-blue-700"
                : isDark
                ? "hover:bg-gray-800 text-blue-400"
                : "hover:bg-gray-200 text-blue-400"
            }`}
            title={isFullscreen ? "Minimize" : "Maximize"}
            onClick={handleFullscreenToggle}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          <button
            className={`text-2xl transition ${
              isDark
                ? "text-gray-500 hover:text-red-400"
                : "text-gray-400 hover:text-red-500"
            }`}
            onClick={handleClose}
            aria-label="Close planner"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Motivational quote */}
      <div
        className={`px-4 py-2 text-sm italic ${
          isDark ? "text-teal-300" : "text-teal-700"
        }`}
      >
        <FaChevronRight className="inline mr-1" />
        {quote}
      </div>

      {/* Add Task Button & Save */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow transition ${
            isDark
              ? "bg-teal-600 text-white hover:bg-teal-700"
              : "bg-teal-500 text-white hover:bg-teal-600"
          }`}
          onClick={openAddModal}
        >
          <FaPlus /> Add Task to Plan
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow transition
            ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : isDark
                ? "bg-blue-700 hover:bg-blue-800 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }
          `}
          onClick={savePlan}
          disabled={saving}
        >
          <FaSave /> {saving ? "Saving..." : "Save Plan"}
        </button>
      </div>

      {/* Summary */}
      <div
        className={`px-4 pb-2 text-xs ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {summary}
      </div>

      {/* Eisenhower Matrix Info Dropdown */}
      {view === "matrix" && (
        <div
          className={`px-4 py-2 mb-2 rounded-xl ${
            isDark ? "bg-gray-800 text-teal-200" : "bg-teal-50 text-teal-700"
          } shadow`}
        >
          <button
            className="flex items-center gap-2 font-bold text-lg w-full justify-between focus:outline-none"
            onClick={() => setShowMatrixInfo((prev) => !prev)}
            aria-expanded={showMatrixInfo}
          >
            Eisenhower Matrix
            {showMatrixInfo ? (
              <FaChevronRight style={{ transform: "rotate(90deg)" }} />
            ) : (
              <FaQuestion />
            )}
          </button>
          {showMatrixInfo && (
            <div className={`mt-2 text-sm ${isDark ? "text-gray-200" : ""}`}>
              The Eisenhower Matrix is a powerful productivity tool that helps
              you prioritize tasks by urgency and importance.
              <br />
              <span className="font-semibold">How it works:</span>
              <ul className="list-disc ml-4 mt-1 mb-1">
                <li>
                  <b>Urgent & Important:</b> Do these tasks first.
                </li>
                <li>
                  <b>Not Urgent & Important:</b> Schedule these tasks.
                </li>
                <li>
                  <b>Urgent & Not Important:</b> Delegate if possible.
                </li>
                <li>
                  <b>Not Urgent & Not Important:</b> Eliminate or minimize.
                </li>
              </ul>
              <span className="text-xs">
                <b>Why use it?</b> It helps you focus on what truly matters,
                reduces stress, and boosts your effectiveness.
                <br />
                <b>Tip:</b> Drag and drop tasks between quadrants to organize
                your day!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Drag-and-drop buckets or table */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {view === "matrix" ? (
            <div className="grid grid-cols-1 gap-4">
              {matrixBuckets.map((bucket) => (
                <Droppable droppableId={bucket.id} key={bucket.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`${glassCard(
                        isDark
                      )} bg-gradient-to-br ${bucket.color(isDark)} ${
                        snapshot.isDraggingOver ? "ring-2 ring-teal-400" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{bucket.icon}</span>
                        <span
                          className={`font-bold text-base ${
                            isDark ? "text-gray-100" : "text-gray-700"
                          }`}
                        >
                          {bucket.label}
                        </span>
                        <span
                          className={`ml-2 text-xs px-2 py-1 rounded ${
                            isDark
                              ? "bg-gray-900 text-teal-300"
                              : "bg-teal-100 text-teal-700"
                          }`}
                        >
                          {bucket.description}
                        </span>
                      </div>
                      {plan[bucket.id].length === 0 && (
                        <div
                          className={`text-xs italic mb-2 ${
                            isDark ? "text-gray-400" : "text-gray-400"
                          }`}
                        >
                          No tasks in this quadrant.
                        </div>
                      )}
                      {plan[bucket.id].map((id, idx) => (
                        <Draggable draggableId={id} index={idx} key={id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-xl p-3 mb-2 ${
                                isDark ? "bg-gray-800/80" : "bg-white/80"
                              } shadow flex items-center justify-between transition
                                ${
                                  snapshot.isDragging
                                    ? "ring-2 ring-teal-400 scale-105"
                                    : ""
                                }
                              `}
                            >
                              <span className={isDark ? "text-gray-100" : ""}>
                                <span className="font-bold text-teal-500 mr-2">
                                  {idx + 1}.
                                </span>
                                <span className="mr-1">
                                  {getIcon(allTasks[id]?.type)}
                                </span>
                                {allTasks[id]?.name || allTasks[id]?.title}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  className={`transition ${
                                    isDark
                                      ? "text-teal-400 hover:text-teal-300"
                                      : "text-teal-600 hover:text-teal-700"
                                  }`}
                                  onClick={() =>
                                    onTriggerPomodoro(allTasks[id]?.name)
                                  }
                                  title="Start Pomodoro"
                                >
                                  <FaClock />
                                </button>
                                <button
                                  className={`transition ${
                                    isDark
                                      ? "text-gray-400 hover:text-red-400"
                                      : "text-gray-400 hover:text-red-500"
                                  }`}
                                  onClick={() => removeFromPlan(id)}
                                  title="Remove from plan"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          ) : (
            <Droppable droppableId="table">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`${glassCard(isDark)} bg-gradient-to-br ${
                    isDark
                      ? "from-gray-800 via-gray-900 to-gray-700"
                      : "from-white via-blue-50 to-blue-100"
                  } ${snapshot.isDraggingOver ? "ring-2 ring-teal-400" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📋</span>
                    <span
                      className={`font-bold text-base ${
                        isDark ? "text-gray-100" : "text-gray-700"
                      }`}
                    >
                      Task Table
                    </span>
                  </div>
                  {plan.table.length === 0 && (
                    <div
                      className={`text-xs italic mb-2 ${
                        isDark ? "text-gray-400" : "text-gray-400"
                      }`}
                    >
                      No tasks in your planner.
                    </div>
                  )}
                  <div>
                    {plan.table.map((id, idx) => (
                      <Draggable draggableId={id} index={idx} key={id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`rounded-xl p-3 mb-2 ${
                              isDark ? "bg-gray-800/80" : "bg-white/80"
                            } shadow flex items-center justify-between  transition
                              ${
                                snapshot.isDragging
                                  ? "ring-2 ring-teal-400 scale-105"
                                  : ""
                              }
                            `}
                          >
                            <span className={isDark ? "text-gray-100" : ""}>
                              <span className="font-bold text-teal-500 mr-2">
                                {idx + 1}.
                              </span>
                              <span className="mr-1">
                                {getIcon(allTasks[id]?.type)}
                              </span>
                              {allTasks[id]?.name || allTasks[id]?.title}
                            </span>
                            <div className="flex gap-2">
                              <button
                                className={`transition ${
                                  isDark
                                    ? "text-teal-400 hover:text-teal-300"
                                    : "text-teal-600 hover:text-teal-700"
                                }`}
                                onClick={() =>
                                  onTriggerPomodoro &&
                                  onTriggerPomodoro(allTasks[id]?.name)
                                }
                                title="Start Pomodoro"
                              >
                                <FaClock />
                              </button>
                              <button
                                className={`transition ${
                                  isDark
                                    ? "text-gray-400 hover:text-red-400"
                                    : "text-gray-400 hover:text-red-500"
                                }`}
                                onClick={() => removeFromPlan(id)}
                                title="Remove from plan"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </DragDropContext>
      </div>

      {/* One-liner summary at bottom */}
      <div
        className={`px-4 py-2 text-center text-xs border-t rounded-b-2xl ${
          isDark
            ? "text-gray-400 border-gray-800 bg-gray-900/80"
            : "text-gray-500 border-gray-200 bg-white/60"
        }`}
      >
        {view === "table"
          ? "Tip: Drag and drop to reorder your tasks. Switch to Matrix view for prioritization."
          : "Tip: Use the Eisenhower Matrix to organize by urgency and importance. Drag tasks between quadrants!"}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center">
          <div
            className={`rounded-2xl shadow-2xl p-0 w-full max-w-lg relative ${
              isDark
                ? "bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 border border-teal-700"
                : "bg-gradient-to-br from-white via-blue-50 to-teal-100 border border-teal-300"
            }`}
            style={{
              minWidth: 340,
              maxWidth: "98vw",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)",
              overflow: "hidden",
            }}
          >
            <div className="relative">
              <button
                className={`absolute top-4 right-4 text-2xl z-10 transition ${
                  isDark
                    ? "text-gray-400 hover:text-red-400"
                    : "text-gray-400 hover:text-red-500"
                }`}
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
              <div
                className={`text-2xl font-extrabold px-8 pt-8 pb-2 ${
                  isDark ? "text-teal-300 drop-shadow" : "text-teal-700"
                }`}
                style={{ letterSpacing: "0.03em" }}
              >
                ✨ Add Tasks to Your Plan
              </div>
              <div
                className={`px-8 pb-2 text-sm italic ${
                  isDark ? "text-teal-400" : "text-teal-700"
                }`}
              >
                Select from your available tasks below.
              </div>
              <div className="max-h-80 overflow-y-auto px-8 py-2 space-y-2">
                {availableToAdd.length === 0 ? (
                  <div
                    className={`italic text-base text-center ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    All tasks are already in your plan!
                  </div>
                ) : (
                  availableToAdd.map((id) => {
                    const t = allTasks[id];
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                          isDark
                            ? "bg-gray-800/60 hover:bg-teal-900/80"
                            : "bg-white/60 hover:bg-teal-100/80"
                        } shadow-sm`}
                        style={{
                          border: isDark
                            ? "1px solid #134e4a"
                            : "1px solid #2dd4bf",
                          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.07)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedToAdd.includes(id)}
                          onChange={(e) => {
                            setSelectedToAdd((prev) =>
                              e.target.checked
                                ? [...prev, id]
                                : prev.filter((x) => x !== id)
                            );
                          }}
                          className="accent-teal-500 scale-125"
                        />
                        <span
                          className={`flex items-center gap-2 text-base font-semibold ${
                            isDark ? "text-gray-100" : ""
                          }`}
                        >
                          <span className="text-xl">{getIcon(t.type)}</span>
                          <span>{t.name || t.title}</span>
                          {t.type === "habit" && (
                            <span
                              className={`text-xs italic ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              (Habit)
                            </span>
                          )}
                          {t.type === "subgoal" && (
                            <span
                              className={`text-xs italic ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              (Subgoal of {t.goalName})
                            </span>
                          )}
                          {t.type === "todo" && (
                            <span
                              className={`text-xs italic ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              (To-Do)
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <div className="flex justify-end gap-2 px-8 py-6 bg-gradient-to-r from-teal-900/10 via-teal-400/10 to-blue-200/10">
                <button
                  className={`px-5 py-2 rounded-xl font-bold shadow transition ${
                    isDark
                      ? "bg-gray-700 text-gray-200 hover:bg-teal-800"
                      : "bg-gray-200 text-gray-700 hover:bg-teal-200"
                  }`}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-5 py-2 rounded-xl font-bold shadow bg-gradient-to-r from-teal-500 via-blue-400 to-teal-600 text-white hover:from-teal-600 hover:to-blue-500 transition ${
                    selectedToAdd.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={addSelectedToPlan}
                  disabled={selectedToAdd.length === 0}
                >
                  <span className="inline-block animate-pulse">➕</span> Add
                  Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-[10001] bg-black/40 flex items-center justify-center">
          <div
            className={`rounded-2xl shadow-2xl p-0 w-full max-w-md relative ${
              isDark
                ? "bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 border border-teal-700"
                : "bg-gradient-to-br from-white via-blue-50 to-teal-100 border border-teal-300"
            }`}
            style={{
              minWidth: 320,
              maxWidth: "96vw",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
              overflow: "hidden",
            }}
          >
            <div className="relative px-8 pt-8 pb-6">
              <div
                className={`absolute top-4 right-4 text-2xl z-10 cursor-pointer transition ${
                  isDark
                    ? "text-gray-400 hover:text-red-400"
                    : "text-gray-400 hover:text-red-500"
                }`}
                onClick={() => setShowUnsavedModal(false)}
              >
                <FaTimes />
              </div>
              <div
                className={`text-xl font-bold mb-2 ${
                  isDark ? "text-teal-300" : "text-teal-700"
                }`}
              >
                Unsaved Changes
              </div>
              <div
                className={`mb-4 text-base ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                You have unsaved changes in your planner. Would you like to save
                before closing?
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className={`px-4 py-2 rounded-xl font-bold shadow transition ${
                    isDark
                      ? "bg-gray-700 text-gray-200 hover:bg-teal-800"
                      : "bg-gray-200 text-gray-700 hover:bg-teal-200"
                  }`}
                  onClick={() => setShowUnsavedModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-xl font-bold shadow bg-gradient-to-r from-teal-500 via-blue-400 to-teal-600 text-white hover:from-teal-600 hover:to-blue-500 transition`}
                  onClick={() => {
                    savePlan();
                    setShowUnsavedModal(false);
                    onClose();
                  }}
                >
                  Save & Close
                </button>
                <button
                  className={`px-4 py-2 rounded-xl font-bold shadow bg-gradient-to-r from-red-500 via-red-400 to-red-600 text-white hover:from-red-600 hover:to-red-500 transition`}
                  onClick={() => {
                    setShowUnsavedModal(false);
                    onClose();
                  }}
                  
                >
                  Discard & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    
    </div>
  );  
}
export default PlannerSidebar;