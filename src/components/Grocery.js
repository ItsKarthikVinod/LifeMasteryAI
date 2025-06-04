import React, { useState, useEffect, useRef } from "react";
import {
  FaCheckCircle,
  FaRegCircle,
  FaShareAlt,
  FaPlus,
  FaTrash,
  FaCopy,
} from "react-icons/fa";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Debounce utility to avoid too many requests
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const db = getFirestore();

const Grocery = () => {
  const [groceries, setGroceries] = useState([]);
  const [input, setInput] = useState("");
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = getAuth().currentUser;

  // Fetch groceries from Firestore for the signed-in user
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchGroceries = async () => {
      try {
        const q = query(
          collection(db, "grocery"),
          where("uid", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id });
        });
        setGroceries(items);
      } catch (err) {
        setGroceries([]);
      }
      setLoading(false);
    };
    fetchGroceries();
    // eslint-disable-next-line
  }, [user]);

  // Debounced update to Firestore
  const debouncedUpdateRef = useRef(
    debounce(async (id, data) => {
      try {
        await updateDoc(doc(db, "grocery", id), data);
      } catch (err) {}
    }, 400)
  );

  // Add grocery item
  const addGrocery = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const newItem = {
      name: input.trim(),
      available: false,
      checked: false,
      uid: user.uid,
      createdAt: Date.now(),
    };
    try {
      const docRef = await addDoc(collection(db, "grocery"), newItem);
      setGroceries((prev) => [...prev, { ...newItem, id: docRef.id }]);
      setInput("");
    } catch (err) {}
  };

  // Toggle available in table
  const toggleAvailable = (id) => {
    setGroceries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, available: !g.available } : g))
    );
    const grocery = groceries.find((g) => g.id === id);
    if (grocery)
      debouncedUpdateRef.current(id, { available: !grocery.available });
  };

  // Remove item
  const removeGrocery = async (id) => {
    setGroceries((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteDoc(doc(db, "grocery", id));
    } catch (err) {}
  };

  // Toggle checked in list
  const toggleChecked = (id) => {
    setGroceries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
    );
    const grocery = groceries.find((g) => g.id === id);
    if (grocery) debouncedUpdateRef.current(id, { checked: !grocery.checked });
  };

  // Copy grocery list (to clipboard)
  const copyList = () => {
    const text = groceries
      .filter((g) => !g.available)
      .map((g) => `- [ ] ${g.name}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Grocery list copied to clipboard! Share it anywhere.");
  };

  // Native share
  const nativeShare = () => {
    const text = groceries
      .filter((g) => !g.available)
      .map((g) => `- ${g.name}`)
      .join("\n");
    if (navigator.share) {
      navigator
        .share({
          title: "My Grocery List",
          text,
        })
        .catch(() => {});
    } else {
      alert("Sharing is not supported on this device/browser.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-teal-200">
        <div className="bg-white/90 rounded-2xl shadow-2xl p-10 text-center text-base sm:text-lg text-teal-700 font-bold">
          Please sign in to use the Grocery feature.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-green-100 to-teal-200 pt-20  sm:pt-44 px-1 sm:px-6">
      <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-2xl p-3 sm:p-6 flex flex-col items-center justify-center mt-20 sm:mt-10">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-teal-700 mb-4 sm:mb-6 text-center tracking-tight">
          🛒 Grocery Database
        </h1>
        {/* Add Grocery */}
        <form
          onSubmit={addGrocery}
          className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6 w-full max-w-xl"
        >
          <input
            type="text"
            className="flex-1 border border-teal-300 rounded-lg px-3 py-2 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Add a grocery item..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition text-sm sm:text-base"
            disabled={loading}
          >
            <FaPlus /> Add
          </button>
        </form>
        {/* Notion-style Table */}
        <div className="overflow-x-auto mb-6 w-full max-w-xl">
          <table className="min-w-full border-separate border-spacing-y-1 sm:border-spacing-y-2 text-xs sm:text-base">
            <thead>
              <tr>
                <th className="text-left text-teal-700 font-bold">Item</th>
                <th className="text-center text-teal-700 font-bold">
                  Available
                </th>
                <th className="text-center text-teal-700 font-bold">Remove</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-2">
                    Loading...
                  </td>
                </tr>
              ) : groceries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-2">
                    No groceries added yet.
                  </td>
                </tr>
              ) : (
                groceries.map((g) => (
                  <tr
                    key={g.id}
                    className="bg-white/80 hover:bg-teal-50 rounded-lg shadow transition"
                  >
                    <td className="py-1 px-2 sm:py-2 sm:px-4 font-medium">
                      {g.name}
                    </td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4 text-center">
                      <button
                        onClick={() => toggleAvailable(g.id)}
                        className="focus:outline-none"
                        aria-label="Toggle Available"
                      >
                        {g.available ? (
                          <FaCheckCircle className="text-green-500 text-lg sm:text-2xl" />
                        ) : (
                          <FaRegCircle className="text-gray-400 text-lg sm:text-2xl" />
                        )}
                      </button>
                    </td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4 text-center">
                      <button
                        onClick={() => removeGrocery(g.id)}
                        className="text-red-500 hover:text-red-700 text-base sm:text-xl"
                        aria-label="Remove"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Generate List Button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 w-full max-w-xl gap-2">
          <button
            onClick={() => setShowList((v) => !v)}
            className="bg-yellow-400 hover:bg-yellow-500 text-teal-900 px-4 py-2 rounded-lg font-bold shadow transition text-sm sm:text-base"
          >
            {showList ? "Hide Grocery List" : "Generate Grocery List"}
          </button>
          {showList && (
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={copyList}
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold shadow transition text-sm sm:text-base w-full sm:w-auto"
                title="Copy Grocery List"
              >
                <FaCopy /> Copy
              </button>
              <button
                onClick={nativeShare}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow transition text-sm sm:text-base w-full sm:w-auto"
                title="Share Grocery List"
              >
                <FaShareAlt /> Share
              </button>
            </div>
          )}
        </div>
        {/* Grocery List */}
        {showList && (
          <div className="bg-white border-2 border-dashed border-teal-300 rounded-xl p-4 sm:p-6 shadow-lg w-full max-w-xl">
            <h2 className="text-lg sm:text-2xl font-bold text-teal-700 mb-3 sm:mb-4 flex items-center gap-2">
              <span role="img" aria-label="list">
                📝
              </span>
              Grocery List
            </h2>
            <ul className="space-y-2 sm:space-y-3">
              {groceries.filter((g) => !g.available).length === 0 && (
                <li className="text-gray-400 italic text-sm sm:text-base">
                  All items are available!
                </li>
              )}
              {groceries
                .filter((g) => !g.available)
                .map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg bg-yellow-50 rounded-lg px-3 sm:px-4 py-2 shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={!!g.checked}
                      onChange={() => toggleChecked(g.id)}
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-teal-500"
                    />
                    <span
                      className={`${
                        g.checked
                          ? "line-through text-gray-400"
                          : "text-gray-800"
                      } font-medium`}
                    >
                      {g.name}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Grocery;
