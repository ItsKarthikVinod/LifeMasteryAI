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
import { faEdit, faTrash, faStar, faClock } from "@fortawesome/free-solid-svg-icons";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import useGetTodos from "../hooks/useGetTodos";
import { useAuth } from "../contexts/authContext";
import useGetGame from "../hooks/useGetGame"; // Import the awardXP function
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Register the required Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

const TodoList = ({ onTriggerPomodoro }) => {
  const [taskName, setTaskName] = useState("");

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const {  todoss } = useGetTodos();
  const { currentUser, theme } = useAuth();
  const userId = currentUser.uid;
  const { awardXP } = useGetGame(); // Get the awardXP function



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
  const completedTasks = todoss.filter((todo) => todo.isCompleted).length;
  const totalTasks = todoss.length;
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
    <div className={`todo-list-container px-4 sm:px-6 lg:px-8 `}>
      <h2
        className={`text-2xl font-semibold mb-4 text-center ${
          theme === "dark" ? "text-teal-400" : ""
        }`}
      >
        Your To-Do List
      </h2>

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
      <ul className="space-y-3">
        {todoss.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center p-3 rounded-md shadow-md ${
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
              className={`flex-grow cursor-pointer ${
                todo.isCompleted
                  ? theme === "dark"
                    ? "line-through text-gray-400"
                    : "line-through text-gray-500"
                  : ""
              }`}
            >
              {editId === todo.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`border p-2 rounded mr-2 focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-200 focus:ring-teal-500"
                      : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
                  }`}
                />
              ) : (
                todo.name
              )}
            </span>

            <div className="flex space-x-2">
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

      {/* Pie Chart */}
      <div className="mt-6">
        <h3
          className={`text-lg font-medium ${
            theme === "dark" ? "text-teal-400" : ""
          }`}
        >
          Task Breakdown
        </h3>
        <div className={`p-4 `}>
          <Pie data={pieData} />
        </div>
      </div>
    </div>
  );
};

export default TodoList;
