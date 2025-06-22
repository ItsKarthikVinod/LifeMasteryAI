import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaList,
  FaThLarge,
  FaBan,
} from "react-icons/fa";

import { useAuth } from "../contexts/authContext";
import { getAuth } from "firebase/auth";
import stringSimilarity from "string-similarity";

function areAllIngredientsAvailable(recipeIngredients, groceries) {
  const groceryNames = groceries.map((g) => g.name.trim().toLowerCase());
  return recipeIngredients.every((ing) => {
    const ingNorm = ing.trim().toLowerCase();
    // Use string-similarity to check if any grocery name is similar enough
    return groceryNames.some(
      (g) => stringSimilarity.compareTwoStrings(ingNorm, g) > 0.6
    );
  });
}

const initialForm = { name: "", link: "", ingredients: "" };

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [viewMode, setViewMode] = useState("card"); // "card" or "list"
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
    const [error, setError] = useState("");
  const { theme } = useAuth(); // Get the theme from context
  const [groceries, setGroceries] = useState([]);
  const user = getAuth().currentUser; 

  // Fetch recipes from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "recipes"),
          where("uid", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        setRecipes(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (err) {
        setError("Failed to fetch recipes.");
      }
      setLoading(false);
    };
    fetchRecipes();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchGroceries = async () => {
      try {
        const q = query(
          collection(db, "grocery"),
          where("uid", "==", user.uid),
          where('available', '==', true),
        );
        const snapshot = await getDocs(q);
        setGroceries(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchGroceries();
  }, [user]);

  // Add or update recipe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ingredientsArr = form.ingredients
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i);
    if (!form.name || !form.link) {
      setError("Name and link are required.");
      setLoading(false);
      return;
    }
    try {
      if (editId) {
        // Update
        await updateDoc(doc(db, "recipes", editId), {
          name: form.name,
          link: form.link,
          ingredients: ingredientsArr,
        });
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === editId
              ? {
                  ...r,
                  name: form.name,
                  link: form.link,
                  ingredients: ingredientsArr,
                }
              : r
          )
        );
      } else {
        // Add
        const docRef = await addDoc(collection(db, "recipes"), {
          name: form.name,
          link: form.link,
          ingredients: ingredientsArr,
          createdAt: serverTimestamp(),
          uid: user?.uid || null,
        });
        setRecipes((prev) => [
          {
            id: docRef.id,
            name: form.name,
            link: form.link,
            ingredients: ingredientsArr,
          },
          ...prev,
        ]);
      }
      setModalOpen(false);
      setForm(initialForm);
      setEditId(null);
    } catch (err) {
      setError("Failed to save recipe.");
    }
    setLoading(false);
  };

  // Delete recipe
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recipe?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "recipes", id));
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete recipe.");
    }
    setLoading(false);
  };

  // Open modal for edit
  const handleEdit = (recipe) => {
    setForm({
      name: recipe.name,
      link: recipe.link,
      ingredients: recipe.ingredients.join(", "),
    });
    setEditId(recipe.id);
    setModalOpen(true);
  };
  console.log(error)

  // Theme classes
  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-gray-900" : "bg-white";
  const cardText = isDark ? "text-teal-100" : "text-teal-900";
  const badgeBg = isDark ? "bg-green-700" : "bg-green-500";
  const badgeText = "text-white";
  const cardShadow = isDark ? "shadow-xl" : "shadow-lg";
  const inputBg = isDark ? "bg-gray-800" : "bg-white";
  const inputText = isDark ? "text-teal-100" : "text-teal-900";
  const borderColor = isDark ? "border-teal-700" : "border-teal-200";
  const btnPrimary = isDark
    ? "bg-teal-700 hover:bg-teal-800 text-white"
    : "bg-teal-600 hover:bg-teal-700 text-white";
  const btnSecondary = isDark
    ? "bg-gray-700 hover:bg-gray-800 text-teal-200"
    : "bg-gray-300 hover:bg-gray-400 text-teal-900";
  const pageBg = isDark
    ? "bg-gradient-to-br from-gray-900 via-teal-900 to-blue-900"
        : "bg-gradient-to-br from-teal-100 via-blue-100 to-white";
    const hovercolor = isDark
        ? "hover:bg-teal-800 rounded-lg transition hover:shadow-lg" 
    : "hover:bg-teal-50 rounded-lg";
  
  useEffect(() => {
        // Scroll to the top of the page when the component is mounted
        window.scrollTo(0, 0);
      }, []);

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${pageBg} py-10 px-2 mt-10 sm:mt-0`}
      style={{ minHeight: "100vh" }}
    >
      <div
        className={`w-full max-w-5xl mx-auto ${cardBg} ${cardShadow} rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center space-y-8`}
        style={{ margin: "32px 0" }}
      >
        {/* Title */}
        <div className="w-full flex flex-col items-center mb-2">
          <div className="flex items-center gap-2 justify-center">
            <h2
              className={`text-2xl sm:text-3xl font-extrabold ${cardText} text-center`}
            >
              🍲 Food Recipes
            </h2>
            <span className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-400 to-teal-400 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
              <FaCheckCircle
                className="inline mr-1"
                style={{ fontSize: "0.9em" }}
              />{" "}
              AI
            </span>
          </div>
        </div>
        {/* Description */}
        <div
          className={`w-full text-md text-center ${
            isDark ? "text-teal-200" : "text-teal-700"
          } mb-4`}
        >
          Organize your favorite food recipes with links and ingredients.
          <br />
          <span className="font-semibold">AI Matching:</span> Add ingredients
          and our AI will check your grocery list to show if you have everything
          needed for each recipe!
        </div>
        {/* Controls */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-full transition ${
                viewMode === "list" ? btnPrimary : btnSecondary
              } hidden sm:inline-flex`}
              title="List View"
            >
              <FaList />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-full transition ${
                viewMode === "card" ? btnPrimary : btnSecondary
              } hidden sm:inline-flex`}
              title="Card View"
            >
              <FaThLarge />
            </button>
          </div>
          <button
            onClick={() => {
              setModalOpen(true);
              setForm(initialForm);
              setEditId(null);
            }}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${btnPrimary}`}
          >
            <FaPlus /> Add Recipe
          </button>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div
              className={`${cardBg} ${cardText} ${cardShadow} rounded-2xl p-6 max-w-md w-full border ${borderColor} relative`}
            >
              <h3 className="font-extrabold text-xl mb-2 flex items-center gap-2">
                {editId ? <FaEdit /> : <FaPlus />} {editId ? "Edit" : "Add"}{" "}
                Recipe
              </h3>
              <form onSubmit={handleSubmit}>
                <input
                  className={`w-full border ${borderColor} ${inputBg} ${inputText} rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-400 transition`}
                  placeholder="Recipe Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={loading}
                  required
                />
                <input
                  className={`w-full border ${borderColor} ${inputBg} ${inputText} rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-400 transition`}
                  placeholder="Recipe Link (URL)"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  disabled={loading}
                  required
                  type="url"
                />
                <textarea
                  className={`w-full border ${borderColor} ${inputBg} ${inputText} rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-400 transition`}
                  rows={3}
                  placeholder="Ingredients (comma separated or paste recipe text for AI extraction)"
                  value={form.ingredients}
                  onChange={(e) =>
                    setForm({ ...form, ingredients: e.target.value })
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  className={`mb-2 px-3 py-1 rounded font-semibold ${btnSecondary}`}
                  disabled={loading || !form.ingredients}
                  onClick={async () => {
                    setLoading(true);
                    setError("");
                    try {
                      // Call Cohere API directly (NOT RECOMMENDED for production)
                      const cohereApiKey = process.env.REACT_APP_COHERE_API_KEY; // Replace with your key for testing only!
                      const prompt = `Extract a list of ingredients from this recipe text:\n${form.ingredients}\nOnly return a comma-separated list of ingredients.`;
                      const res = await fetch(
                        "https://api.cohere.ai/v1/generate",
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${cohereApiKey}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            model: "command",
                            prompt,
                            max_tokens: 100,
                            temperature: 0.2,
                          }),
                        }
                      );
                      const data = await res.json();
                      const aiIngredients = data.generations?.[0]?.text
                        ?.split(",")
                        .map((i) => i.trim())
                        .filter(Boolean);
                      if (aiIngredients && aiIngredients.length > 0) {
                        setForm((f) => ({
                          ...f,
                          ingredients: aiIngredients.join(", "),
                        }));
                      } else {
                        setError("AI could not extract ingredients.");
                      }
                    } catch (err) {
                      setError("AI extraction failed.");
                    }
                    setLoading(false);
                  }}
                >
                  Extract Ingredients with AI
                </button>
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg font-bold ${btnPrimary}`}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : editId ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-bold ${btnSecondary}`}
                    onClick={() => {
                      setModalOpen(false);
                      setForm(initialForm);
                      setEditId(null);
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Card View */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {loading ? (
              <div className="col-span-2 text-center text-teal-500">
                Loading...
              </div>
            ) : recipes.length === 0 ? (
              <div className="col-span-2 text-center text-teal-400">
                No recipes added yet.
              </div>
            ) : (
              recipes.map((recipe) => {
                const hasIngredients =
                  Array.isArray(recipe.ingredients) &&
                  recipe.ingredients.length > 0;
                const allAvailable =
                  hasIngredients &&
                  areAllIngredientsAvailable(recipe.ingredients, groceries);
                return (
                  <div
                    key={recipe.id}
                    className={`${cardBg} ${cardText} ${cardShadow} rounded-xl p-5 relative border ${borderColor} transition-transform transform hover:scale-105 hover:shadow-2xl duration-200`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">{recipe.name}</h3>
                      {hasIngredients && allAvailable && (
                        <span
                          className={`${badgeBg} ${badgeText} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}
                          title="All ingredients available"
                        >
                          <FaCheckCircle className="inline mr-1" /> Available
                        </span>
                      )}
                    </div>
                    <a
                      href={recipe.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline text-xs break-all"
                    >
                      {recipe.link}
                    </a>
                    <div className="mt-2 text-sm">
                      <span className="font-semibold">Ingredients [AI]:</span>
                      {hasIngredients ? (
                        <ul className="list-none ml-0 mt-1 max-h-20 overflow-y-auto pr-2">
                          {recipe.ingredients.map((ing, idx) => {
                            const ingNorm = ing.trim().toLowerCase();
                            const available = groceries.some(
                              (g) =>
                                stringSimilarity.compareTwoStrings(
                                  ingNorm,
                                  g.name.trim().toLowerCase()
                                ) > 0.6
                            );
                            return (
                              <li key={idx} className="flex items-center gap-2">
                                {available ? (
                                  <FaCheckCircle
                                    className="text-green-500"
                                    title="Available"
                                  />
                                ) : (
                                  <FaBan
                                    className="text-red-400"
                                    title="Not available"
                                  />
                                )}
                                <span>{ing}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="italic text-xs mt-1 text-yellow-500">
                          Please add the ingredients and let AI match it for
                          you!
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(recipe)}
                        className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 ${btnSecondary} hover:scale-105 transition`}
                        title="Edit"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(recipe.id)}
                        className="px-3 py-1 rounded-lg font-bold flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white hover:scale-105 transition"
                        title="Delete"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="overflow-x-auto w-full">
            <table
              className={`min-w-full border-separate border-spacing-y-2 text-xs sm:text-sm ${cardBg} ${cardText} rounded-xl`}
            >
              <thead className="hidden sm:table-header-group">
                <tr>
                  <th className="text-center font-bold py-3 px-4 w-10">#</th>
                  <th className="text-left font-bold py-3 px-4 w-40">Name</th>
                  <th className="text-left font-bold py-3 px-4">Link</th>
                  <th className="text-left font-bold py-3 px-4">Ingredients</th>
                  <th className="text-center font-bold py-3 px-4">Status</th>
                  <th className="text-center font-bold py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-teal-500 py-6">
                      Loading...
                    </td>
                  </tr>
                ) : recipes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-teal-400 py-6">
                      No recipes added yet.
                    </td>
                  </tr>
                ) : (
                  recipes.map((recipe, idx) => {
                    const hasIngredients =
                      Array.isArray(recipe.ingredients) &&
                      recipe.ingredients.length > 0;
                    const allAvailable =
                      hasIngredients &&
                      areAllIngredientsAvailable(recipe.ingredients, groceries);
                    return (
                      <tr
                        key={recipe.id}
                        className={`rounded-xl transition ${hovercolor} border ${borderColor} hover:shadow-lg align-top`}
                      >
                        {/* Serial Number */}
                        <td className="text-center font-bold py-4 px-4 align-middle hidden sm:table-cell">
                          {idx + 1}
                        </td>
                        {/* Name */}
                        <td className=" font-semibold text-base align-middle hidden sm:table-cell max-w-xs">
                          <span className="flex items-center gap-2">
                            <span className="break-words whitespace-normal">
                              {recipe.name}
                            </span>
                          </span>
                        </td>
                        {/* Link */}
                        <td className="py-4 px-4 align-middle hidden sm:table-cell max-w-xs">
                          <a
                            href={recipe.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline break-all hover:text-blue-700 transition"
                            title={recipe.link}
                          >
                            {recipe.link.length > 32
                              ? recipe.link.slice(0, 32) + "..."
                              : recipe.link}
                          </a>
                        </td>
                        {/* Ingredients */}
                        <td className="py-4 px-4 max-w-xs align-middle hidden sm:table-cell">
                          <div className="max-h-20 overflow-y-auto text-sm space-y-1">
                            {hasIngredients ? (
                              <ul className="list-none ml-0">
                                {(recipe.ingredients || []).map((ing, idx2) => {
                                  const ingNorm = ing.trim().toLowerCase();
                                  const available = groceries.some(
                                    (g) =>
                                      stringSimilarity.compareTwoStrings(
                                        ingNorm,
                                        g.name.trim().toLowerCase()
                                      ) > 0.6
                                  );
                                  return (
                                    <li
                                      key={idx2}
                                      className="flex items-center gap-2"
                                    >
                                      {available ? (
                                        <FaCheckCircle
                                          className="text-green-500"
                                          title="Available"
                                        />
                                      ) : (
                                        <FaBan
                                          className="text-red-400"
                                          title="Not available"
                                        />
                                      )}
                                      <span>{ing}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <span className="italic text-yellow-500">
                                Add ingredients for AI matching
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Status */}
                        <td className="py-4 px-4 text-center align-middle hidden sm:table-cell">
                          {hasIngredients && allAvailable ? (
                            <span
                              className={`${badgeBg} ${badgeText} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow`}
                              title="All ingredients available"
                            >
                              <FaCheckCircle className="inline mr-1" />{" "}
                              Available
                            </span>
                          ) : hasIngredients ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow">
                              <FaBan className="inline mr-1" />
                              Unavailable
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-bold shadow">
                              -
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="py-4 px-4 text-center align-middle hidden sm:table-cell">
                          <div className="flex gap-3 justify-center flex-col">
                            <button
                              onClick={() => handleEdit(recipe)}
                              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 ${btnSecondary} hover:scale-105 transition shadow`}
                              title="Edit"
                            >
                              <FaEdit />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(recipe.id)}
                              className="px-3 py-1 rounded-lg font-bold flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white hover:scale-105 transition shadow"
                              title="Delete"
                            >
                              <FaTrash />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
