import React, { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc,  doc, updateDoc, deleteDoc, } from 'firebase/firestore';
import {
  FaCheck,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa"; // Icons for edit, delete, and check
import { useAuth } from "../contexts/authContext";

import useGetGoals from '../hooks/useGetGoals';
const GoalTracker = ({toggleCalendarModal, onTriggerPomodoro}) => {
  const [goalName, setGoalName] = useState('');
  const [expandedGoals, setExpandedGoals] = useState({});
  const [subGoalInput, setSubGoalInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currentGoalId, setCurrentGoalId] = useState(null);
  const [editingSubGoalIndex, setEditingSubGoalIndex] = useState(null);
  const [editingSubGoalName, setEditingSubGoalName] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');
  const { currentUser, theme } = useAuth();
  const userId = currentUser.uid;
  const {  goalss } = useGetGoals();

 const toggleGoalExpansion = (goalId) => {
   setExpandedGoals((prev) => ({
     ...prev,
     [goalId]: !prev[goalId], // Toggle the expanded state for the specific goal
   }));
 };

  const isOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today && !isNaN(due); // Check if due date is in the past
  };

  const getCalendarEvents = () => {
    const events = [];
    goalss.forEach((goal) => {
      goal.subGoals.forEach((subGoal) => {
        events.push({
          title: `${goal.name}: ${subGoal.name}`,
          start: new Date(subGoal.dueDate),
          end: new Date(subGoal.dueDate),
          allDay: true,
          color: goal.completed
            ? theme === "dark" ? "#38b2ac" : "#319795" // Teal for completed goals
            : theme === "dark" ? "#63b3ed" : "#3182ce", // Blue for incomplete goals
        });
      });
    });
    return events;
  };
  

  const addGoal = async (e) => {
    e.preventDefault();
    if (!goalName) return;

    try {
      const goalRef = collection(db, 'goals');
      await addDoc(goalRef, {
        name: goalName,
        timestamp: new Date(),
        completed: false,
        subGoals: [],
        userId: userId,
      });
      setGoalName('');
      
    } catch (error) {
      console.error('Error adding goal: ', error);
    }
  };

  const addSubGoal = async () => {
    if (!subGoalInput || !currentGoalId || !dueDate) return;

    const goalRef = doc(db, 'goals', currentGoalId);
    const newSubGoal = {
      name: subGoalInput,
      completed: false,
      dueDate: dueDate,
    };

    try {
      const goal = goalss.find(goal => goal.id === currentGoalId);
      const updatedSubGoals = [...goal.subGoals, newSubGoal];

      await updateDoc(goalRef, { subGoals: updatedSubGoals });

      setSubGoalInput('');
      setDueDate('');
      setCurrentGoalId(null);
      
    } catch (error) {
      console.error('Error adding sub-goal: ', error);
    }
  };

  const toggleSubGoalCompletion = async (goalId, subGoalIndex) => {
    const goalRef = doc(db, 'goals', goalId);
    const goal = goalss.find(g => g.id === goalId);
    const subGoals = [...goal.subGoals];
    subGoals[subGoalIndex].completed = !subGoals[subGoalIndex].completed;

    try {
      await updateDoc(goalRef, { subGoals });

      const allSubGoalsCompleted = subGoals.every(subGoal => subGoal.completed);
      await updateDoc(goalRef, { completed: allSubGoalsCompleted });

    } catch (error) {
      console.error('Error toggling sub-goal completion: ', error);
    }
  };

  const deleteSubGoal = async (goalId, subGoalIndex) => {
    const goalRef = doc(db, 'goals', goalId);
    const goal = goalss.find(g => g.id === goalId);
    const subGoals = [...goal.subGoals];
    subGoals.splice(subGoalIndex, 1);

    try {
      await updateDoc(goalRef, { subGoals });
      
    } catch (error) {
      console.error('Error deleting sub-goal: ', error);
    }
  };

  const deleteGoal = async (goalId) => {
    const goalRef = doc(db, 'goals', goalId);
    try {
      await deleteDoc(goalRef);
     
    } catch (error) {
      console.error('Error deleting goal: ', error);
    }
  };

  const editSubGoal = (goalId, subGoalIndex, name, dueDate) => {
    setCurrentGoalId(goalId);
    setEditingSubGoalIndex(subGoalIndex);
    setEditingSubGoalName(name);
    setEditingDueDate(dueDate);
  };

  const saveSubGoalEdit = async () => {
    if (currentGoalId === null || editingSubGoalIndex === null) return;

    const goalRef = doc(db, 'goals', currentGoalId);
    const goal = goalss.find(g => g.id === currentGoalId);
    const subGoals = [...goal.subGoals];
    subGoals[editingSubGoalIndex] = {
      ...subGoals[editingSubGoalIndex],
      name: editingSubGoalName,
      dueDate: editingDueDate,
    };

    try {
      await updateDoc(goalRef, { subGoals });
      setEditingSubGoalIndex(null);
      setEditingSubGoalName('');
      setEditingDueDate('');
   
    } catch (error) {
      console.error('Error saving sub-goal edit: ', error);
    }
  };

  const calculateProgress = (subGoals) => {
    if (subGoals.length === 0) return 0;
    else {
      const completedSubGoals = subGoals.filter(subGoal => subGoal.completed).length;
      return (completedSubGoals / subGoals.length) * 100;
    }
    
  };

  return (
    <div className={`goal-tracker-container `}>
      <h2
        className={`text-2xl font-semibold mb-6 text-center ${
          theme === "dark" ? "text-teal-400" : ""
        }`}
      >
        Your Goals
      </h2>

      {/* Add Goal Form */}
      <form
        onSubmit={addGoal}
        className="mb-6 flex flex-col sm:flex-row items-center gap-4"
      >
        <input
          type="text"
          value={goalName}
          onChange={(e) => setGoalName(e.target.value)}
          className={`border p-2 rounded w-full sm:w-auto flex-grow focus:outline-none focus:ring-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
              : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
          }`}
          placeholder="Enter your goal"
        />
        <button
          type="submit"
          className={`bg-teal-500 text-white px-4 py-2 rounded w-full sm:w-auto ${
            theme === "dark" ? "hover:bg-teal-600" : "hover:bg-teal-400"
          }`}
        >
          Add Goal
        </button>
      </form>

      {/* Goals List */}
      <ul className="space-y-6">
        {goalss?.map((goal) => (
          <li
            key={goal.id}
            className={`p-4 border rounded shadow-sm ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white/40 border-gray-300"
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center ">
              <button
                onClick={() => toggleGoalExpansion(goal.id)}
                className={`${
                  theme === "dark" ? "text-gray-200" : "text-gray-600"
                }`}
              >
                {expandedGoals[goal.id] ? (
                  <FaChevronDown />
                ) : (
                  <FaChevronRight />
                )}
              </button>
              <h3
                className={`text-xl font-semibold ${
                  goal.completed
                    ? theme === "dark"
                      ? "line-through text-gray-400"
                      : "line-through text-gray-500"
                    : isOverdue(goal.dueDate)
                    ? "text-red-500"
                    : ""
                }`}
              >
                {goal.name}
              </h3>
              <button
                onClick={() => deleteGoal(goal.id)}
                className={`${
                  theme === "dark"
                    ? "text-red-400 hover:text-red-500"
                    : "text-red-500 hover:text-red-600"
                }`}
              >
                <FaTrash />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <label
                className={`block text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Progress
              </label>
              <progress
                value={calculateProgress(goal?.subGoals || [])}
                max="100"
                className={`w-full h-2 rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                }`}
              />
              <span
                className={`text-sm ml-2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {Math.round(calculateProgress(goal?.subGoals || []))}%
              </span>
            </div>
            
            {expandedGoals[goal.id] && <>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-4">
              <button
                onClick={() => setCurrentGoalId(goal.id)}
                className={`bg-teal-500 text-white px-4 py-2 rounded w-full sm:w-auto ${
                  theme === "dark" ? "hover:bg-teal-600" : "hover:bg-teal-400"
                }`}
              >
                Add Sub-goal
              </button>
              {currentGoalId === goal.id && (
                <div className="flex flex-col lg:flex-row gap-4 mt-2 lg:mt-0">
                  <input
                    type="text"
                    value={subGoalInput}
                    onChange={(e) => setSubGoalInput(e.target.value)}
                    className={`border p-2 rounded flex-grow focus:outline-none focus:ring-2 ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
                        : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
                    }`}
                    placeholder="Enter sub-goal"
                  />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`border p-2 rounded flex-grow focus:outline-none focus:ring-2 ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-teal-500"
                        : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
                    }`}
                    placeholder="Due date"
                  />
                  <button
                    onClick={addSubGoal}
                    className={`bg-teal-500 text-white px-4 py-2 rounded w-full sm:w-auto ${
                      theme === "dark"
                        ? "hover:bg-teal-600"
                        : "hover:bg-teal-400"
                    }`}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Render Sub-goals */}
            <ul className="mt-4 space-y-2">
              {goal?.subGoals?.map((subGoal, index) => (
                <li
                  key={index}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 border rounded gap-4 ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-700 text-gray-200"
                      : "bg-white border-gray-300 text-gray-800"
                  }  ${
                    isOverdue(subGoal.dueDate)
                      ? theme === "dark"
                        ? "border-red-500 text-red-600"
                        : "border-red-500 text-red-600"
                      : ""
                  }`}
                >
                  {editingSubGoalIndex === index &&
                  currentGoalId === goal.id ? (
                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
                      <input
                        type="text"
                        value={editingSubGoalName}
                        onChange={(e) => setEditingSubGoalName(e.target.value)}
                        className={`border p-2 rounded flex-grow focus:outline-none focus:ring-2 ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
                            : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
                        }`}
                        placeholder="Edit sub-goal"
                      />
                      <input
                        type="date"
                        value={editingDueDate}
                        onChange={(e) => setEditingDueDate(e.target.value)}
                        className={`border p-2 rounded flex-grow focus:outline-none focus:ring-2 ${
                          theme === "dark"
                            ? "bg-gray-800 border-gray-600 text-gray-200 focus:ring-teal-500"
                            : "bg-white border-gray-300 text-gray-800 focus:ring-teal-400"
                        }`}
                      />
                      <button
                        onClick={saveSubGoalEdit}
                        className={`${
                          theme === "dark"
                            ? "text-teal-400 hover:text-teal-500"
                            : "text-teal-500 hover:text-teal-600"
                        }`}
                      >
                        <FaCheck />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                      <div className="flex items-center gap-2 flex-grow">
                        <input
                          type="checkbox"
                          checked={subGoal.completed}
                          onChange={() =>
                            toggleSubGoalCompletion(goal.id, index)
                          }
                          className={`mr-2 ${
                            theme === "dark"
                              ? "accent-teal-500"
                              : "accent-teal-500"
                          }`}
                        />
                        <span
                          className={`${
                            subGoal.completed
                              ? theme === "dark"
                                ? "line-through text-gray-400"
                                : "line-through text-gray-500"
                              : ""
                          }`}
                        >
                          {subGoal.name} (Due: {subGoal.dueDate})
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onTriggerPomodoro(subGoal.name)}
                          className={`${
                            theme === "dark"
                              ? "text-teal-400 hover:text-teal-500"
                              : "text-teal-500 hover:text-teal-600"
                          }`}
                        >
                          <FaClock />
                        </button>
                        <button
                          onClick={() =>
                            editSubGoal(
                              goal.id,
                              index,
                              subGoal.name,
                              subGoal.dueDate
                            )
                          }
                          className={`${
                            theme === "dark"
                              ? "text-teal-400 hover:text-teal-500"
                              : "text-teal-500 hover:text-teal-600"
                          }`}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteSubGoal(goal.id, index)}
                          className={`${
                            theme === "dark"
                              ? "text-red-400 hover:text-red-500"
                              : "text-red-500 hover:text-red-600"
                          }`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            </>}
          </li>
        ))}
      </ul>
      {/* View Calendar Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => toggleCalendarModal(getCalendarEvents())}
          className={`bg-teal-500 text-white px-6 py-3 rounded-lg font-bold ${
            theme === "dark" ? "hover:bg-teal-600" : "hover:bg-teal-400"
          }`}
        >
          <FaCalendarAlt className="inline-block mr-2" />
          View Calendar
        </button>
      </div>
    </div>
  );
};

export default GoalTracker;
