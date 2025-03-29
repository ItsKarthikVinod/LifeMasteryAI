import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faStar } from '@fortawesome/free-solid-svg-icons';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import useGetTodos from '../hooks/useGetTodos';
import { useAuth } from '../contexts/authContext';

// Register the required Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

const TodoList = () => {
  const [taskName, setTaskName] = useState('');

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const { fetchTodos, todoss } = useGetTodos();
  const { currentUser } = useAuth();
  const userId = currentUser.uid;

  useEffect(() => {
    fetchTodos();
    
  });

  

  const addTodo = async (e) => {
    e.preventDefault();
    if (!taskName) return;

    try {
      await addDoc(collection(db, 'todos'), {
        name: taskName,
        isCompleted: false,
        isImportant: false, // Default importance is false
        timestamp: new Date(),
        userId: userId,
      });
      setTaskName('');
      fetchTodos();
    } catch (error) {
      console.error('Error adding todo: ', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo: ', error);
    }
  };

  const startEdit = (id, name) => {
    setEditId(id);
    setEditName(name);
  };

  const saveEdit = async () => {
    try {
      const todoRef = doc(db, 'todos', editId);
      await updateDoc(todoRef, { name: editName });
      setEditId(null);
      setEditName('');
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo: ', error);
    }
  };

  const toggleComplete = async (todo) => {
    try {
      await updateDoc(doc(db, 'todos', todo.id), {
        isCompleted: !todo.isCompleted,
      });
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo: ', error);
    }
  };

  const toggleImportant = async (todo) => {
    try {
      await updateDoc(doc(db, 'todos', todo.id), {
        isImportant: !todo.isImportant,
      });
      fetchTodos();
    } catch (error) {
      console.error('Error updating importance: ', error);
    }
  };

  // Calculate the task completion for pie chart
  const completedTasks = todoss.filter((todo) => todo.isCompleted).length;
  const totalTasks = todoss.length;
  const pieData = {
    labels: ['Completed', 'Incomplete'],
    datasets: [
      {
        data: [completedTasks, totalTasks - completedTasks],
        backgroundColor: ['#4CAF50', '#FF6347'],
        hoverBackgroundColor: ['#45a049', '#ff5349'],
      },
    ],
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Your To-Do List
      </h2>

      <form
        onSubmit={addTodo}
        className="flex items-center mb-6 flex-col sm:flex-row justify-center"
      >
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="flex-grow border p-2 rounded focus:outline-none focus:border-blue-500"
          placeholder="Enter a task"
        />
        <button
          type="submit"
          className=" sm:ml-2 sm:w-auto mt-3   bg-teal-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Task
        </button>
      </form>

      <ul className="space-y-3">
        {todoss.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center p-3 rounded-md shadow-md ${
              todo.isCompleted
                ? "bg-teal-200 text-gray-600 line-through"
                : "bg-white"
            } ${todo.isImportant ? "border-4 border-yellow-500" : ""}`}
          >
            {/* Checkbox for marking completion */}
            <input
              type="checkbox"
              checked={todo.isCompleted}
              onChange={() => toggleComplete(todo)}
              className="mr-3 accent-teal-500"
            />
            <span
              className={`flex-grow cursor-pointer ${
                todo.isCompleted ? "line-through text-gray-500" : ""
              }`}
            >
              {editId === todo.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border p-2 rounded mr-2 focus:outline-none focus:border-blue-500"
                />
              ) : (
                todo.name
              )}
            </span>

            <div className="flex space-x-2">
              {editId === todo.id ? (
                <button
                  onClick={saveEdit}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Save
                </button>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(todo.id, todo.name)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button
                    onClick={() => toggleImportant(todo)}
                    className={`text-yellow-500 hover:text-yellow-600 ${
                      todo.isImportant ? "text-yellow-700" : ""
                    }`}
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
        <h3 className="text-lg font-medium">Task Breakdown</h3>
        <Pie data={pieData} />
      </div>
    </div>
  );
};

export default TodoList;
