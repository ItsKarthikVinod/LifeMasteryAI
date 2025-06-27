import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { FaUtensils, FaBookOpen } from "react-icons/fa";
import ChefHat from "../assets/chef-hat.png";

export default function RecipeSharePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipe() {
      const docRef = doc(db, "recipes", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) setRecipe(snap.data());
      setLoading(false);
    }
    fetchRecipe();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Loading...
      </div>
    );
  if (!recipe)
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl text-red-500">
        Recipe not found.
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-orange-100 py-10 px-2">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 border-4 border-yellow-300 relative">
        <div className="absolute -top-[4rem] left-1/2 -translate-x-1/2">
          <img
            src={ChefHat}
            alt="Chef Hat"
            className="w-24 h-24 drop-shadow-lg"
          />
        </div>
        <h1 className="text-3xl font-extrabold text-center text-pink-700 mt-8 mb-2 flex items-center justify-center gap-2">
          <FaBookOpen className="text-orange-400" /> {recipe.name}
        </h1>
        <div className="flex justify-center mb-4">
          <a
            href={recipe.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline text-sm break-all"
          >
            {recipe.link}
          </a>
        </div>
        <div className="flex items-center justify-center mb-6">
          <FaUtensils className="text-pink-400 text-2xl mr-2" />
          <span className="text-lg font-bold text-orange-700">Ingredients</span>
        </div>
        <ul className="list-disc ml-8 mb-8 text-lg text-gray-700">
          {(recipe.ingredients || []).map((ing, idx) => (
            <li key={idx} className="mb-1">
              {ing}
            </li>
          ))}
        </ul>
        <div className="flex justify-center mt-8">
          <span className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300 text-pink-900 font-bold shadow">
            Shared from LifeMastery Cookbook
          </span>
        </div>
        {/* Decorative chef/kitchen SVGs can be added here */}
      </div>
    </div>
  );
}
