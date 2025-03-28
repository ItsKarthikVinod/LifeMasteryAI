import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc,  doc, updateDoc, deleteDoc, } from 'firebase/firestore';
import { FaCheck, FaEdit, FaTrash } from 'react-icons/fa'; // Icons for edit, delete, and check
import { useAuth } from "../contexts/authContext";

import useGetGoals from '../hooks/useGetGoals';
const GoalTracker = () => {
  const [goalName, setGoalName] = useState('');

  const [subGoalInput, setSubGoalInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currentGoalId, setCurrentGoalId] = useState(null);
  const [editingSubGoalIndex, setEditingSubGoalIndex] = useState(null);
  const [editingSubGoalName, setEditingSubGoalName] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');
  const { currentUser } = useAuth();
  const userId = currentUser.uid;
  const { fetchGoals, goalss } = useGetGoals();

  useEffect(() => {
    fetchGoals();
  });

  

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
      fetchGoals();
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
      fetchGoals();
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

      fetchGoals();
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
      fetchGoals();
    } catch (error) {
      console.error('Error deleting sub-goal: ', error);
    }
  };

  const deleteGoal = async (goalId) => {
    const goalRef = doc(db, 'goals', goalId);
    try {
      await deleteDoc(goalRef);
      fetchGoals();
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
      fetchGoals();
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
    <div className="goal-tracker-container">
      <h2 className="text-2xl font-semibold mb-4">Your Goals</h2>

      <form onSubmit={addGoal} className="mb-6">
        <input
          type="text"
          value={goalName}
          onChange={(e) => setGoalName(e.target.value)}
          className="border p-2 rounded"
          placeholder="Enter your goal"
        />
        <button type="submit" className="ml-2 bg-teal-500 text-white px-4 py-2 rounded">Add Goal</button>
      </form>

      <ul>
        {goalss?.map((goal) => (
          <li key={goal.id} className="mb-4 p-4 border rounded">
            <div className="flex justify-between items-center">
              <h3 className={`text-xl font-semibold ${goal.completed ? 'line-through text-gray-500' : ''}`}>
                {goal.name}
              </h3>
              <button onClick={() => deleteGoal(goal.id)} className="text-red-500">
                <FaTrash />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <label className="block text-sm">Progress</label>
              <progress
                value={calculateProgress(goal?.subGoals || [])} 
                max="100" 
                className="w-full h-2 bg-gray-200 rounded"
              />
              <span className="text-sm ml-2">{Math.round(calculateProgress(goal?.subGoals || []))}%</span>
            </div>

            {/* Add Sub-goal Button */}
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => setCurrentGoalId(goal.id)} 
                className="bg-teal-500 text-white px-4 py-2 rounded"
              >
                Add Sub-goal
              </button>
              {currentGoalId === goal.id && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={subGoalInput}
                    onChange={(e) => setSubGoalInput(e.target.value)}
                    className="border p-2 rounded"
                    placeholder="Enter sub-goal"
                  />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="border p-2 rounded"
                    placeholder="Due date"
                  />
                  <button
                    onClick={addSubGoal}
                    className="bg-teal-500 text-white px-4 py-2 rounded"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Render sub-goals */}
            <ul className="mt-4">
              {goal?.subGoals?.map((subGoal, index) => (
                <li key={index} className="flex items-center justify-between mb-2 p-2 border rounded">
                  {editingSubGoalIndex === index && currentGoalId === goal.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editingSubGoalName}
                        onChange={(e) => setEditingSubGoalName(e.target.value)}
                        className="border p-2 rounded"
                        placeholder="Edit sub-goal"
                      />
                      <input
                        type="date"
                        value={editingDueDate}
                        onChange={(e) => setEditingDueDate(e.target.value)}
                        className="border p-2 rounded"
                      />
                      <button onClick={saveSubGoalEdit} className="text-teal-500">
                        <FaCheck />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={subGoal.completed}
                        onChange={() => toggleSubGoalCompletion(goal.id, index)}
                        className="mr-2"
                      />
                      <span className={`${subGoal.completed ? 'line-through text-gray-500' : ''}`}>
                        {subGoal.name} (Due: {subGoal.dueDate})
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => editSubGoal(goal.id, index, subGoal.name, subGoal.dueDate)} className="text-teal-500">
                          <FaEdit />
                        </button>
                        <button onClick={() => deleteSubGoal(goal.id, index)} className="text-red-500">
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoalTracker;
