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
import { useAuth } from "../contexts/authContext";
import GroceryAIModal from "./GroceryAIModal";
import { Link } from "react-router-dom";
import { writeBatch } from "firebase/firestore";

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
  const [aiOpen, setAiOpen] = useState(false);
  const { currentUser } = useAuth();

  const handleAddAIItems = async (items) => {
    for (const name of items) {
      // Prevent duplicate items (case-insensitive, trimmed)
      const alreadyExists = groceries.some(
        (g) => g.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (alreadyExists) continue;
      const newItem = {
        name,
        available: false,
        checked: false,
        uid: user.uid,
        createdAt: Date.now(),
      };
      try {
        const docRef = await addDoc(collection(db, "grocery"), newItem);
        setGroceries((prev) => [...prev, { ...newItem, id: docRef.id }]);
      } catch {}
    }
  };

  const handleShoppingCompleted = async () => {
    const checkedItems = groceries.filter((g) => g.checked && !g.available);
    if (checkedItems.length === 0) {
      alert("No checked items to mark as available!");
      return;
    }
    try {
      const batch = writeBatch(db);
      checkedItems.forEach((item) => {
        const ref = doc(db, "grocery", item.id);
        batch.update(ref, { available: true, checked: false });
      });
      await batch.commit();
      setGroceries((prev) =>
        prev.map((g) =>
          checkedItems.some((item) => item.id === g.id)
            ? { ...g, available: true, checked: false }
            : g
        )
      );
      alert("Checked items marked as available!");
    } catch (err) {
      alert("Failed to update items.");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { theme } = useAuth();
  const isGuest = currentUser && currentUser.isAnonymous;

  const user = getAuth().currentUser;

  // Theme classes
  const isDark = theme === "dark";
  const bgMain = isDark
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
    : "bg-gradient-to-br from-green-100 to-teal-200";
  const cardBg = isDark ? "bg-gray-800" : "bg-white/90";
  const cardShadow = isDark ? "shadow-2xl" : "shadow-2xl";
  const textMain = isDark ? "text-teal-300" : "text-teal-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const borderColor = isDark ? "border-gray-700" : "border-teal-300";
  const inputBg = isDark ? "bg-gray-900" : "bg-white";
  const tableHead = isDark ? "text-teal-200" : "text-teal-700";
  const tableRow = isDark
    ? "bg-gray-900 hover:bg-gray-800"
    : "bg-white/80 hover:bg-teal-50";
  const yellowBg = isDark ? "bg-yellow-900" : "bg-yellow-50";
  const inputTextColor = isDark
    ? "text-teal-200 placeholder-gray-400"
    : "text-teal-900 placeholder-gray-400";
  const cardTextColor = isDark ? "text-teal-100" : "text-teal-900";
  const cardTitleColor = isDark ? "text-teal-300" : "text-teal-700";

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
    // Prevent duplicate items (case-insensitive, trimmed)
    const alreadyExists = groceries.some(
      (g) => g.name.trim().toLowerCase() === input.trim().toLowerCase()
    );
    if (alreadyExists) {
      alert("Item already exists in your grocery list!");
      setInput("");
      return;
    }
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
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((g) => `- [ ] ${g.name}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Grocery list copied to clipboard! Share it anywhere.");
  };

  // Native share
  const nativeShare = () => {
    const text = groceries
      .filter((g) => !g.available)
      .sort((a, b) => a.name.localeCompare(b.name))
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
      <div
        className={`min-h-screen flex items-center justify-center ${bgMain}`}
      >
        <div
          className={`${cardBg} ${cardShadow} rounded-2xl p-8 sm:p-10 text-center text-base sm:text-lg ${textMain} font-bold flex flex-col items-center gap-4`}
        >
          Please sign in to use the Grocery feature.
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
      className={`min-h-screen flex items-start justify-center ${bgMain} pt-20 sm:pt-32 px-1 sm:px-6 ${
        isGuest === true ? "pt-[7rem] lg:pt-32" : "pt-0"
      } `}
    >
      <div
        className={`w-full max-w-3xl ${cardBg} ${cardShadow} rounded-2xl p-3 sm:p-6 flex flex-col items-center justify-center mt-20 sm:mt-10`}
      >
        <h1
          className={`text-base sm:text-xl md:text-2xl font-extrabold mb-3 sm:mb-5 text-center tracking-tight ${cardTitleColor} flex items-center gap-2`}
        >
          🛒 Grocery Database
        </h1>
        {/* Add Grocery */}
        <form
          onSubmit={addGrocery}
          className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6 w-full max-w-xl"
        >
          <input
            type="text"
            className={`flex-1 border ${borderColor} ${inputBg} ${inputTextColor} rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-400 transition placeholder-opacity-80`}
            placeholder="Add a grocery item..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 transition text-xs sm:text-sm"
            disabled={loading}
          >
            <FaPlus /> Add
          </button>
        </form>
        <button
          onClick={() => setAiOpen(true)}
          className={`
    mb-4
    flex items-center justify-center gap-2
    font-bold shadow transition text-xs sm:text-sm
    px-5 py-2
    rounded-full
    focus:outline-none
    focus:ring-2 focus:ring-pink-400
    group
    ${
      isDark
        ? "bg-gradient-to-r from-purple-800 via-pink-700 to-pink-600 text-white"
        : "bg-gradient-to-r from-purple-400 via-pink-400 to-pink-500 text-white"
    }
    hover:scale-105 hover:shadow-2xl hover:from-pink-500 hover:to-purple-500
    duration-200
  `}
          style={{
            letterSpacing: "0.02em",
            boxShadow: isDark
              ? "0 4px 24px 0 rgba(236, 72, 153, 0.15)"
              : "0 4px 24px 0 rgba(168, 85, 247, 0.12)",
          }}
        >
          <span
            className={`
      text-lg
      animate-pulse
      group-hover:animate-none
      transition
      ${
        isDark
          ? "text-pink-300 drop-shadow-[0_0_6px_rgba(236,72,153,0.4)]"
          : "text-pink-200 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]"
      }
    `}
            style={{ filter: "drop-shadow(0 0 6px #ec4899aa)" }}
            role="img"
            aria-label="ai"
          >
            🤖
          </span>
          <span
            className={`
      transition
      group-hover:text-yellow-200
      group-hover:drop-shadow-[0_0_8px_rgba(253,224,71,0.7)]
    `}
          >
            AI Add from Recipe
          </span>
        </button>
        <GroceryAIModal
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          onAddItems={handleAddAIItems}
          existingItems={groceries.map((g) => g.name)}
        />
        {/* Notion-style Table */}
        <div className="overflow-x-auto mb-5 w-full max-w-xl">
          <table className="min-w-full border-separate border-spacing-y-1 sm:border-spacing-y-2 text-xs sm:text-sm">
            <thead>
              <tr>
                <th className={`text-left ${tableHead} font-bold`}>Item</th>
                <th className={`text-center ${tableHead} font-bold`}>
                  Available
                </th>
                <th className={`text-center ${tableHead} font-bold`}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className={`text-center ${textSecondary} py-2`}
                  >
                    Loading...
                  </td>
                </tr>
              ) : groceries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className={`text-center ${textSecondary} py-2`}
                  >
                    No groceries added yet.
                  </td>
                </tr>
              ) : (
                groceries
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((g) => (
                    <tr
                      key={g.id}
                      className={`${tableRow} rounded-lg shadow transition`}
                    >
                      <td
                        className={`py-1 px-2 sm:py-2 sm:px-4 font-medium ${cardTextColor}`}
                      >
                        {g.name}
                      </td>
                      <td className="py-1 px-2 sm:py-2 sm:px-4 text-center">
                        <button
                          onClick={() => toggleAvailable(g.id)}
                          className="focus:outline-none"
                          aria-label="Toggle Available"
                        >
                          {g.available ? (
                            <FaCheckCircle className="text-green-500 text-base sm:text-xl" />
                          ) : (
                            <FaRegCircle className="text-gray-400 text-base sm:text-xl" />
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
            className="bg-yellow-400 hover:bg-yellow-500 text-teal-900 px-4 py-2 rounded-lg font-bold shadow transition text-xs sm:text-sm"
          >
            {showList ? "Hide Grocery List" : "Generate Grocery List"}
          </button>
          {showList && (
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={copyList}
                className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold shadow transition text-xs sm:text-sm w-full sm:w-auto"
                title="Copy Grocery List"
              >
                <FaCopy /> Copy
              </button>
              <button
                onClick={nativeShare}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow transition text-xs sm:text-sm w-full sm:w-auto"
                title="Share Grocery List"
              >
                <FaShareAlt /> Share
              </button>
            </div>
          )}
        </div>
        {/* Grocery List */}
        {showList && (
          <div
            className={`${cardBg} border-2 border-dashed border-teal-300 rounded-xl p-4 sm:p-6 shadow-lg w-full max-w-xl`}
          >
            <h2
              className={`text-base sm:text-xl font-bold ${cardTitleColor} mb-3 sm:mb-4 flex items-center gap-2`}
            >
              <span role="img" aria-label="list">
                📝
              </span>
              Grocery List
            </h2>

            <ul className="space-y-2 sm:space-y-3">
              {groceries.filter((g) => !g.available).length === 0 && (
                <li className={`italic ${textSecondary} text-xs sm:text-base`}>
                  All items are available!
                </li>
              )}
              {groceries
                .filter((g) => !g.available)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((g) => (
                  <li
                    key={g.id}
                    className={`flex items-center gap-2 sm:gap-3 text-sm sm:text-lg ${yellowBg} rounded-lg px-3 sm:px-4 py-2 shadow-sm`}
                  >
                    <input
                      type="checkbox"
                      checked={!!g.checked}
                      onChange={() => toggleChecked(g.id)}
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-teal-500"
                    />
                    <span
                      className={`${
                        g.checked ? "line-through text-gray-400" : cardTextColor
                      } font-medium`}
                    >
                      {g.name}
                    </span>
                  </li>
                ))}
            </ul>
            <button
              onClick={handleShoppingCompleted}
              className={`mt-4 font-bold shadow transition text-xs sm:text-sm px-4 py-2 rounded-lg
                ${
                  isDark
                    ? "bg-teal-700 hover:bg-teal-800 text-teal-100"
                    : "bg-teal-500 hover:bg-teal-600 text-white"
                }`}
            >
              Shopping Completed
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
export default Grocery;