import React, { useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faStar,
  faClock,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons"; // Added chevron icons for buttons
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import useGetTodos from "../hooks/useGetTodos";
import { useAuth } from "../contexts/authContext";
import useGetGame from "../hooks/useGetGame"; // Import the awardXP function
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { sendNotification } from "../hooks/useSendNotification"; // Import the notification function

// Register the required Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

const TodoList = ({ onTriggerPomodoro }) => {
  const [taskName, setTaskName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed for better UX on long lists
  const { todoss } = useGetTodos();
  const { currentUser, theme } = useAuth();
  const userId = currentUser.uid;
  const { awardXP } = useGetGame(); // Get the awardXP function

  // Sort todos with incomplete first
  const sortedTodos = [...todoss].sort((a, b) => a.isCompleted - b.isCompleted);

  // For collapsed view: Show first 10 todos (or all if fewer)
  const displayedTodos = isCollapsed ? sortedTodos.slice(0, 10) : sortedTodos;

  const addTodo = async (e) => {
    e.preventDefault();
    if (!taskName) return;

    try {
      await addDoc(collection(db, "todos"), {
        name: taskName,
        isCompleted: false,
        isImportant: false, // Default importance is false
        timestamp: new Date(),
        userId: userId,
      });
      setTaskName("");
    } catch (error) {
      console.error("Error adding todo: ", error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, "todos", id));
    } catch (error) {
      console.error("Error deleting todo: ", error);
    }
  };

  const startEdit = (id, name) => {
    setEditId(id);
    setEditName(name);
  };

  const saveEdit = async () => {
    try {
      const todoRef = doc(db, "todos", editId);
      await updateDoc(todoRef, { name: editName });
      setEditId(null);
      setEditName("");
    } catch (error) {
      console.error("Error updating todo: ", error);
    }
  };

  const toggleComplete = async (todo) => {
    try {
      await updateDoc(doc(db, "todos", todo.id), {
        isCompleted: !todo.isCompleted,
      });
      if (!todo.isCompleted) {
        // If the task is marked as completed, award XP
        awardXP(userId, 10); // Award XP for completing a task
        toast.success("+10 XP gained for completing a todo!", {
          position: "top-right",
          autoClose: 3000, // Toast lasts for 3 seconds
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        await sendNotification(userId, `Task Completed: ${todo.name}`, "task");
      } else {
        // If the task is marked as incomplete, deduct XP
        awardXP(userId, -10); // Deduct XP for uncompleting a task
        toast.error("-10 XP deducted for unchecking a todo!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error("Error updating todo: ", error);
    }
  };

  const toggleImportant = async (todo) => {
    try {
      await updateDoc(doc(db, "todos", todo.id), {
        isImportant: !todo.isImportant,
      });
    } catch (error) {
      console.error("Error updating importance: ", error);
    }
  };

  // Calculate the task completion for pie chart
  const completedTasks = sortedTodos.filter((todo) => todo.isCompleted).length;
  const totalTasks = sortedTodos.length;
  const pieData = {
    labels: ["Completed", "Incomplete"],
    datasets: [
      {
        data: [completedTasks, totalTasks - completedTasks],
        backgroundColor: ["#4CAF50", "#FF6347"],
        hoverBackgroundColor: ["#45a049", "#ff5349"],
      },
    ],
  };

  return (
    <div className={`todo-list-container px-4 sm:px-6 lg:px-8`}>
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-2xl font-semibold ${
            theme === "dark" ? "text-teal-400" : ""
          }`}
        >
          Your To-Do List
        </h2>
        {/* Collapse/Expand button - only show if there are more than 10 todos */}
        {sortedTodos.length > 10 && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
              theme === "dark"
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-teal-500 text-white hover:bg-teal-400"
            }`}
            aria-label={isCollapsed ? "Show all todos" : "Collapse todo list"}
          >
            {isCollapsed ? (
              <>
                Show All <FontAwesomeIcon icon={faChevronDown} />
              </>
            ) : (
              <>
                Collapse <FontAwesomeIcon icon={faChevronUp} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Task Form */}
      <form
        onSubmit={addTodo}
        className="flex items-center mb-6 flex-col sm:flex-row justify-center"
      >
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className={`flex-grow border p-2 rounded focus:outline-none focus:ring-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
              : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
          }`}
          placeholder="Enter a task"
        />
        <button
          type="submit"
          className={`sm:ml-2 sm:w-auto mt-3 px-4 py-2 rounded ${
            theme === "dark"
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "bg-teal-500 text-white hover:bg-teal-400"
          }`}
        >
          Add Task
        </button>
      </form>

      {/* Task List */}
      <div className="transition-all duration-300">
        {displayedTodos.length > 0 ? (
          <ul className="space-y-3">
            {displayedTodos.map((todo) => (
              <li
                key={todo.id}
                className={`flex flex-wrap items-center p-3 rounded-md shadow-md ${
                  todo.isCompleted
                    ? theme === "dark"
                      ? "bg-teal-800 text-gray-400 line-through"
                      : "bg-teal-200 text-gray-600 line-through"
                    : theme === "dark"
                      ? "bg-gray-800 text-gray-200"
                      : "bg-white text-gray-800"
                } ${todo.isImportant ? "border-4 border-yellow-500" : ""}`}
              >
                {/* Checkbox for marking completion */}
                <input
                  type="checkbox"
                  checked={todo.isCompleted}
                  onChange={() => toggleComplete(todo)}
                  className={`mr-3 ${
                    theme === "dark" ? "accent-teal-500" : "accent-teal-500"
                  }`}
                />
                <span
                  className={`flex-grow cursor-pointer min-w-0 break-words ${
                    todo.isCompleted
                      ? theme === "dark"
                        ? "line-through text-gray-400"
                        : "line-through text-gray-500"
                      : ""
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {editId === todo.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`border p-2 rounded mr-2 focus:outline-none focus:ring-2 w-full sm:w-auto ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-gray-200 focus:ring-teal-500"
                          : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
                      }`}
                    />
                  ) : (
                    todo.name
                  )}
                </span>

                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 sm:ml-2">
                  {editId === todo.id ? (
                    <button
                      onClick={saveEdit}
                      className={`${
                        theme === "dark"
                          ? "text-teal-400 hover:text-teal-500"
                          : "text-blue-500 hover:text-blue-600"
                      }`}
                    >
                      Save
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onTriggerPomodoro(todo.name)}
                        className={`${
                          theme === "dark"
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-yellow-500 hover:text-yellow-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={faClock} />
                      </button>
                      <button
                        onClick={() => startEdit(todo.id, todo.name)}
                        className={`${
                          theme === "dark"
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-yellow-500 hover:text-yellow-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className={`${
                          theme === "dark"
                            ? "text-red-400 hover:text-red-500"
                            : "text-red-500 hover:text-red-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        onClick={() => toggleImportant(todo)}
                        className={`${
                          theme === "dark"
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-yellow-500 hover:text-yellow-600"
                        } ${todo.isImportant ? "text-yellow-500" : ""}`}
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className={`text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
          >
            No todos yet. Add one above!
          </p>
        )}

        {/* Show "Show All" button only if collapsed and there are more than 10 todos */}
        {isCollapsed && sortedTodos.length > 10 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsCollapsed(false)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                theme === "dark"
                  ? "bg-teal-600 text-white hover:bg-teal-500"
                  : "bg-teal-500 text-white hover:bg-teal-400"
              }`}
              aria-label="Show all todos"
            >
              Show All ({sortedTodos.length} todos){" "}
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>
        )}

        {/* Show "Collapse" button only if expanded and there are more than 10 todos */}
        {!isCollapsed && sortedTodos.length > 10 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsCollapsed(true)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                theme === "dark"
                  ? "bg-gray-600 text-white hover:bg-gray-500"
                  : "bg-gray-500 text-white hover:bg-gray-400"
              }`}
              aria-label="Collapse to show fewer todos"
            >
              Collapse to Top 10 <FontAwesomeIcon icon={faChevronUp} />
            </button>
          </div>
        )}
      </div>

      {/* Pie Chart */}
      <div className="mt-6">
        <h3
          className={`text-lg font-medium ${
            theme === "dark" ? "text-teal-400" : ""
          }`}
        >
          Task Breakdown
        </h3>
        <div className={`p-4`}>
          <Pie data={pieData} />
        </div>
      </div>
    </div>
  );
};

export default TodoList;
