import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/authContext";
import { FaEdit, FaTrash, FaCheck, FaBolt } from "react-icons/fa";
import { format, differenceInDays } from "date-fns";
import clsx from "clsx";

// --- Helper Functions ---
const getNextRevisionDate = (confidence) => {
  const today = new Date();
  let days = 1;
  if (confidence === 3) days = 3;
  else if (confidence === 4) days = 7;
  else if (confidence === 5) days = 14;
  return format(new Date(today.setDate(today.getDate() + days)), "yyyy-MM-dd");
};

const calcAiPriorityScore = (confidence, difficulty, lastRevised) => {
  const daysSince = differenceInDays(
    new Date(),
    lastRevised ? lastRevised.toDate() : new Date()
  );
  return (5 - confidence) * 2 + difficulty + daysSince / 2;
};

const getPriorityColor = (score, isUrgent) => {
  if (isUrgent) return "bg-red-100 border-red-500";
  if (score > 8) return "bg-yellow-100 border-yellow-500";
  if (score > 5) return "bg-green-100 border-green-500";
  return "bg-gray-100 border-gray-300";
};

const confidenceColors = {
  1: "bg-red-200 text-red-700",
  2: "bg-orange-200 text-orange-700",
  3: "bg-yellow-200 text-yellow-700",
  4: "bg-green-200 text-green-700",
  5: "bg-teal-200 text-teal-700",
};

// --- Main Component ---
const SmartRevisionSidebar = () => {
  const { currentUser, theme } = useAuth();
  const userId = currentUser?.uid || "demo";
  const [revisions, setRevisions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [search, setSearch] = useState("");
  const sortBy = "aiPriorityScore"; // Default sort by AI priority score
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [reviseRow, setReviseRow] = useState(null);
  const [timeSpent, setTimeSpent] = useState("");
  const [newConfidence, setNewConfidence] = useState(3);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      const q = query(
        collection(db, "revisions"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRevisions(data);
    };
    fetchData();
  }, [userId, sortBy]);

  // --- Add New Revision (Mock Data) ---
  const addMockRevision = async () => {
    const newRev = {
      subject: "Chemistry",
      chapter: "Electrochemistry",
      topic: "Nernst Equation",
      difficulty: 4,
      confidence: 2,
      lastRevised: serverTimestamp(),
      nextRevisionDate: getNextRevisionDate(2),
      tags: ["IIT", "Important"],
      notes: "Remember the formula and application.",
      flashcards: [
        {
          q: "What is Nernst Equation?",
          a: "It relates cell potential to concentrations.",
        },
      ],
      revisionHistory: [],
      aiPriorityScore: 10.5,
      isUrgent: true,
      userId,
    };
    await addDoc(collection(db, "revisions"), newRev);
  };

  // --- Edit/Save ---
  const startEdit = (row) => {
    setEditingId(row.id);
    setEditRow({ ...row });
  };
  const saveEdit = async () => {
    await updateDoc(doc(db, "revisions", editingId), editRow);
    setEditingId(null);
    setEditRow({});
  };

  // --- Delete ---
  const deleteRevision = async (id) => {
    await deleteDoc(doc(db, "revisions", id));
    setRevisions(revisions.filter((r) => r.id !== id));
  };

  // --- Revise Now ---
  const openReviseModal = (row) => {
    setReviseRow(row);
    setShowReviseModal(true);
    setTimeSpent("");
    setNewConfidence(row.confidence || 3);
  };
  const handleRevise = async () => {
    const now = new Date();
    const nextDate = getNextRevisionDate(newConfidence);
    const updatedHistory = [
      ...(reviseRow.revisionHistory || []),
      { date: format(now, "yyyy-MM-dd"), confidence: newConfidence, timeSpent },
    ];
    const updated = {
      ...reviseRow,
      lastRevised: now,
      confidence: newConfidence,
      nextRevisionDate: nextDate,
      revisionHistory: updatedHistory,
      aiPriorityScore: calcAiPriorityScore(
        newConfidence,
        reviseRow.difficulty,
        { toDate: () => now }
      ),
      isUrgent:
        calcAiPriorityScore(newConfidence, reviseRow.difficulty, {
          toDate: () => now,
        }) > 10,
      userId,
    };
    await updateDoc(doc(db, "revisions", reviseRow.id), updated);
    setShowReviseModal(false);
    setReviseRow(null);
  };

  // --- Filter/Sort ---
  const filteredRevisions = useMemo(() => {
    return revisions
      .filter(
        (r) =>
          r.subject?.toLowerCase().includes(search.toLowerCase()) ||
          r.chapter?.toLowerCase().includes(search.toLowerCase()) ||
          r.topic?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }, [revisions, search, sortBy]);

  // --- AI Alerts ---
  const urgentTopic = filteredRevisions.find((r) => r.isUrgent);

  return (
    <aside
      className={`w-full md:w-80 h-full p-4 border-r ${
        theme === "dark"
          ? "bg-gray-900 text-gray-100 border-gray-800"
          : "bg-white text-gray-900 border-gray-200"
      } flex flex-col`}
      style={{ minHeight: "100vh" }}
    >
      <h2 className="text-xl font-bold mb-4 text-center">Revision Sidebar</h2>
      <div className="mb-2 flex gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`p-2 rounded border flex-grow ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-gray-100"
              : "bg-white border-gray-300"
          }`}
        />
        <button
          onClick={addMockRevision}
          className="px-3 py-2 bg-teal-500 text-white rounded font-bold"
        >
          +
        </button>
      </div>
      {urgentTopic && (
        <div className="mb-2 p-2 bg-red-100 border-l-4 border-red-500 text-red-800 font-bold flex items-center gap-2">
          <FaBolt className="text-red-500 text-xl" />
          <span>
            🧠 Revise <span className="underline">{urgentTopic.topic}</span>{" "}
            today!
          </span>
        </div>
      )}
      <div className="overflow-y-auto flex-1">
        <table className="min-w-full border rounded shadow-sm text-sm">
          <thead>
            <tr
              className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <th className="p-2">Subject</th>
              <th className="p-2">Topic</th>
              <th className="p-2">Conf.</th>
              <th className="p-2">Next</th>
              <th className="p-2">Pri.</th>
              <th className="p-2">Act</th>
            </tr>
          </thead>
          <tbody>
            {filteredRevisions.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  "border-b",
                  getPriorityColor(row.aiPriorityScore, row.isUrgent),
                  theme === "dark" ? "text-gray-100" : ""
                )}
              >
                <td className="p-2">
                  {editingId === row.id ? (
                    <input
                      value={editRow.subject}
                      onChange={(e) =>
                        setEditRow({ ...editRow, subject: e.target.value })
                      }
                      className="p-1 rounded border"
                    />
                  ) : (
                    row.subject
                  )}
                </td>
                <td className="p-2">
                  {editingId === row.id ? (
                    <input
                      value={editRow.topic}
                      onChange={(e) =>
                        setEditRow({ ...editRow, topic: e.target.value })
                      }
                      className="p-1 rounded border"
                    />
                  ) : (
                    row.topic
                  )}
                </td>
                <td className="p-2">
                  {editingId === row.id ? (
                    <select
                      value={editRow.confidence}
                      onChange={(e) =>
                        setEditRow({
                          ...editRow,
                          confidence: Number(e.target.value),
                        })
                      }
                      className="p-1 rounded border"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded ${
                        confidenceColors[row.confidence]
                      }`}
                    >
                      {row.confidence}
                    </span>
                  )}
                </td>
                <td className="p-2">{row.nextRevisionDate || "-"}</td>
                <td className="p-2">
                  <span
                    className={clsx(
                      "px-2 py-1 rounded font-bold",
                      row.isUrgent
                        ? "bg-red-500 text-white"
                        : row.aiPriorityScore > 8
                        ? "bg-yellow-400 text-gray-900"
                        : row.aiPriorityScore > 5
                        ? "bg-green-400 text-gray-900"
                        : "bg-gray-200 text-gray-700"
                    )}
                  >
                    {row.isUrgent ? "!" : row.aiPriorityScore.toFixed(1)}
                  </span>
                </td>
                <td className="p-2 flex gap-1">
                  {editingId === row.id ? (
                    <>
                      <button onClick={saveEdit} className="text-green-600">
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400"
                      >
                        <FaTrash />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(row)}
                        className="text-teal-600"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteRevision(row.id)}
                        className="text-red-500"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      <button
                        onClick={() => openReviseModal(row)}
                        className="text-blue-500 font-bold"
                        title="Revise Now"
                      >
                        R
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRevisions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No revision topics found.
          </div>
        )}
      </div>
      {/* Revise Modal */}
      {showReviseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div
            className={`relative z-50 p-8 rounded-lg shadow-lg w-11/12 max-w-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-900"
            }`}
          >
            <button
              onClick={() => setShowReviseModal(false)}
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-red-500"
              aria-label="Close"
            >
              &times;
            </button>
            <h3
              className={`text-2xl font-bold mb-4 ${
                theme === "dark" ? "text-teal-300" : "text-teal-700"
              }`}
            >
              Revise Topic: {reviseRow?.topic}
            </h3>
            <div className="mb-4">
              <label className="block mb-1 font-semibold">
                Time Spent (minutes):
              </label>
              <input
                type="number"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                className="px-3 py-2 rounded-lg border w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold">
                Confidence (1-5):
              </label>
              <select
                value={newConfidence}
                onChange={(e) => setNewConfidence(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border w-full"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRevise}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg font-bold mt-2"
            >
              Save Revision
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default SmartRevisionSidebar;
