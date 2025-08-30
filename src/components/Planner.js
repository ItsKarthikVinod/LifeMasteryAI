import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/authContext";
import useGetTodos from "../hooks/useGetTodos";
import useGetHabits from "../hooks/useGetHabits";
import useGetGoals from "../hooks/useGetGoals";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaList,
  FaBullseye,
  FaLeaf,
  FaCalendarDay,
  FaMagic,
  FaTimes,
} from "react-icons/fa";

const getIcon = (type) => {
  switch (type) {
    case "todo":
      return <FaList className="text-blue-400 mr-2" />;
    case "subgoal":
      return <FaBullseye className="text-purple-400 mr-2" />;
    case "habit":
      return <FaLeaf className="text-green-400 mr-2" />;
    default:
      return null;
  }
};

// Example templates
const TEMPLATES = [
  {
    name: "Morning Routine",
    items: [
      {
        id: "habit-wakeup",
        text: "Wake up early",
        type: "habit",
        completed: false,
      },
      {
        id: "habit-meditate",
        text: "Meditate 10 min",
        type: "habit",
        completed: false,
      },
      {
        id: "todo-breakfast",
        text: "Healthy breakfast",
        type: "todo",
        completed: false,
      },
    ],
  },
  {
    name: "Work Sprint",
    items: [
      {
        id: "todo-email",
        text: "Check emails",
        type: "todo",
        completed: false,
      },
      {
        id: "todo-coding",
        text: "Code 2 hours",
        type: "todo",
        completed: false,
      },
      {
        id: "habit-standup",
        text: "Team standup",
        type: "habit",
        completed: false,
      },
    ],
  },
];

const Planner = () => {
  const { theme } = useAuth();
  const { todoss } = useGetTodos();
  const { fetchedHabits } = useGetHabits();
  const { goalss } = useGetGoals();

  // Prepare lists
  const todos = useMemo(
    () =>
      (todoss || []).map((todo) => ({
        id: `todo-${todo.id}`,
        text: todo.name,
        type: "todo",
        completed: todo.isCompleted,
      })),
    [todoss]
  );

  const habits = useMemo(
    () =>
      (fetchedHabits || []).map((habit) => ({
        id: `habit-${habit.id}`,
        text: habit.name,
        type: "habit",
        completed: habit.completedDates?.includes(
          new Date().toISOString().slice(0, 10)
        ),
      })),
    [fetchedHabits]
  );

  const subgoals = useMemo(
    () =>
      (goalss || []).flatMap((goal) =>
        (goal.subGoals || []).map((sub) => ({
          id: `subgoal-${goal.id}-${sub.name}`,
          text: `${sub.name} (${goal.name})`,
          type: "subgoal",
          completed: sub.completed,
        }))
      ),
    [goalss]
  );

  // State for planner
  const [planner, setPlanner] = useState([]);
  const [todoList, setTodoList] = useState(todos);
  const [habitList, setHabitList] = useState(habits);
  const [subgoalList, setSubgoalList] = useState(subgoals);
  const [showTemplates, setShowTemplates] = useState(false);

  // Sync lists when data changes
  React.useEffect(() => setTodoList(todos), [todos]);
  React.useEffect(() => setHabitList(habits), [habits]);
  React.useEffect(() => setSubgoalList(subgoals), [subgoals]);

  // Drag and drop logic
  const getList = (id) => {
    switch (id) {
      case "todos":
        return todoList;
      case "habits":
        return habitList;
      case "subgoals":
        return subgoalList;
      case "planner":
        return planner;
      default:
        return [];
    }
  };
  const setList = (id, items) => {
    switch (id) {
      case "todos":
        setTodoList(items);
        break;
      case "habits":
        setHabitList(items);
        break;
      case "subgoals":
        setSubgoalList(items);
        break;
      case "planner":
        setPlanner(items);
        break;
      default:
        break;
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) {
      // Reorder in same list
      const items = Array.from(getList(source.droppableId));
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);
      setList(source.droppableId, items);
    } else {
      // Move between lists
      const sourceItems = Array.from(getList(source.droppableId));
      const destItems = Array.from(getList(destination.droppableId));
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      setList(source.droppableId, sourceItems);
      setList(destination.droppableId, destItems);
    }
  };

  // Mark as completed
  const handleToggleCompleted = (item) => {
    setPlanner((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, completed: !i.completed } : i
      )
    );
  };

  // Edit and delete handlers (demo only, you can connect to backend)
  const handleEdit = (item) => {
    const newText = prompt("Edit item:", item.text);
    if (!newText) return;
    setPlanner((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, text: newText } : i))
    );
  };
  const handleDelete = (item) => {
    setPlanner((prev) => prev.filter((i) => i.id !== item.id));
  };

  // Add template items to planner
  const handleApplyTemplate = (template) => {
    setPlanner((prev) => [
      ...prev,
      ...template.items.filter((t) => !prev.some((p) => p.id === t.id)),
    ]);
    setShowTemplates(false);
  };

  // Theme classes
  const isDark = theme === "dark";
  const bg = isDark
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
    : "bg-gradient-to-br from-teal-100 to-blue-100 text-gray-900";
  const card = isDark ? "bg-gray-800/90" : "bg-white/90";
  const border = isDark ? "border-gray-700" : "border-teal-300";
  const shadow = "shadow-xl";

  // Responsive grid
  const gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  // Progress
  const totalTasks = planner.length;
  const completedTasks = planner.filter((i) => i.completed).length;

  // Sort planner: incomplete first, completed at bottom
  const sortedPlanner = [
    ...planner.filter((i) => !i.completed),
    ...planner.filter((i) => i.completed),
  ];

  return (
    <div className={`min-h-screen p-2 pt-28 sm:p-6 sm:pt-28 ${bg}`}>
      <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-500 drop-shadow-lg tracking-tight">
        <FaCalendarDay className="inline-block mr-2 mb-1" />
        Plan Your Day
      </h1>
      <div className="flex justify-center mb-4 gap-4">
        <span className="text-lg font-bold text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-800/70 px-4 py-2 rounded-xl shadow">
          {completedTasks}/{totalTasks} tasks done
        </span>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold shadow bg-purple-100 dark:bg-gray-700 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-gray-600 transition"
          onClick={() => setShowTemplates(true)}
        >
          <FaMagic />
          Templates
        </button>
      </div>
      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl min-w-[320px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-600 dark:text-purple-300">
                Choose a Template
              </h2>
              <button
                className="text-gray-400 hover:text-red-400 text-xl"
                onClick={() => setShowTemplates(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.name}
                  className="p-4 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-gray-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-700 transition"
                  onClick={() => handleApplyTemplate(tpl)}
                >
                  <div className="font-bold text-purple-700 dark:text-purple-200 mb-2">
                    {tpl.name}
                  </div>
                  <ul className="list-disc pl-5 text-gray-700 dark:text-gray-200">
                    {tpl.items.map((item) => (
                      <li key={item.id}>{item.text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={`grid ${gridCols} gap-4`}>
          {/* Todos */}
          <Droppable droppableId="todos">
            {(provided) => (
              <div
                className={`rounded-2xl p-4 border-2 ${border} ${card} ${shadow} flex flex-col min-h-[200px]`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2 className="font-bold mb-3 text-lg flex items-center text-blue-400">
                  <FaList className="mr-2" /> Todos
                </h2>
                {todoList.length === 0 && (
                  <div className="italic text-gray-400 text-sm mb-2">
                    No todos
                  </div>
                )}
                {todoList.map((item, idx) => (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="mb-2 p-3 rounded-xl bg-blue-50 dark:bg-gray-700 text-gray-900 dark:text-blue-200 shadow flex items-center"
                      >
                        {getIcon(item.type)}
                        <span className="flex-1">{item.text}</span>
                        {item.completed && (
                          <FaCheckCircle
                            className="ml-2 text-green-400"
                            title="Completed"
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {/* Subgoals */}
          <Droppable droppableId="subgoals">
            {(provided) => (
              <div
                className={`rounded-2xl p-4 border-2 ${border} ${card} ${shadow} flex flex-col min-h-[200px]`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2 className="font-bold mb-3 text-lg flex items-center text-purple-400">
                  <FaBullseye className="mr-2" /> Subgoals
                </h2>
                {subgoalList.length === 0 && (
                  <div className="italic text-gray-400 text-sm mb-2">
                    No subgoals
                  </div>
                )}
                {subgoalList.map((item, idx) => (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="mb-2 p-3 rounded-xl bg-purple-50 dark:bg-gray-700 text-gray-900 dark:text-purple-200 shadow flex items-center"
                      >
                        {getIcon(item.type)}
                        <span className="flex-1">{item.text}</span>
                        {item.completed && (
                          <FaCheckCircle
                            className="ml-2 text-green-400"
                            title="Completed"
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {/* Habits */}
          <Droppable droppableId="habits">
            {(provided) => (
              <div
                className={`rounded-2xl p-4 border-2 ${border} ${card} ${shadow} flex flex-col min-h-[200px]`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2 className="font-bold mb-3 text-lg flex items-center text-green-400">
                  <FaLeaf className="mr-2" /> Habits
                </h2>
                {habitList.length === 0 && (
                  <div className="italic text-gray-400 text-sm mb-2">
                    No habits
                  </div>
                )}
                {habitList.map((item, idx) => (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="mb-2 p-3 rounded-xl bg-green-50 dark:bg-gray-700 text-gray-900 dark:text-green-200 shadow flex items-center"
                      >
                        {getIcon(item.type)}
                        <span className="flex-1">{item.text}</span>
                        {item.completed && (
                          <FaCheckCircle
                            className="ml-2 text-green-400"
                            title="Completed"
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {/* Planner */}
          <Droppable droppableId="planner">
            {(provided) => (
              <div
                className={`rounded-2xl p-4 border-4 border-dashed ${border} ${card} ${shadow} flex flex-col min-h-[200px]`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2 className="font-bold mb-3 text-lg flex items-center text-yellow-500">
                  <FaCalendarDay className="mr-2" /> Today's Plan
                </h2>
                {sortedPlanner.length === 0 && (
                  <div className="italic text-gray-400 text-sm mb-2">
                    Drag items here to plan your day!
                  </div>
                )}
                {sortedPlanner.map((item, idx) => (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className={`mb-2 p-3 rounded-xl shadow flex items-center group transition
                          ${
                            item.completed
                              ? "opacity-50 bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                              : "bg-yellow-50 dark:bg-gray-700 text-gray-900 dark:text-yellow-200"
                          }`}
                      >
                        {/* Serial number only for incomplete */}
                        {!item.completed && (
                          <span className="mr-2 font-bold text-gray-400">
                            {idx + 1}
                          </span>
                        )}
                        {getIcon(item.type)}
                        <span className="flex-1">{item.text}</span>
                        <button
                          onClick={() => handleToggleCompleted(item)}
                          className={`ml-2 text-xl ${
                            item.completed
                              ? "text-green-400"
                              : "text-gray-400 hover:text-green-500"
                          } transition`}
                          title={
                            item.completed
                              ? "Mark as incomplete"
                              : "Mark as completed"
                          }
                        >
                          <FaCheckCircle />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="ml-2 opacity-60 group-hover:opacity-100 transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="ml-2 opacity-60 group-hover:opacity-100 transition text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
      <div className="mt-8 text-center text-xs text-gray-400">
        <span>
          Drag and drop your todos, subgoals, and habits to plan your day. Edit
          or remove items as needed!
        </span>
      </div>
    </div>
  );
};

export default Planner;
