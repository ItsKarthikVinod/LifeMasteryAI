import React from "react";
import { useNavigate } from "react-router-dom";

const GoToGalleryButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/whiteboard-gallery")}
      className="ml-5 mb-2 px-5 py-2 rounded-lg bg-teal-200 text-gray-800 font-semibold shadow hover:bg-teal-600 hover:text-white transition text-center"
    >
      📁 Go to Whiteboard Gallery
    </button>
  );
};

export default GoToGalleryButton;
