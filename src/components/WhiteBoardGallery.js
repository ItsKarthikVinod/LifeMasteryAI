import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toPng } from "html-to-image";

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4 1 1-4 13.362-13.726z"
    />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 7h12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z"
    />
  </svg>
);

const WhiteboardGallery = () => {
  const { currentUser, theme } = useAuth();
  const [modalImg, setModalImg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [galleryState, setGalleryState] = useState([]);
  const navigate = useNavigate();

  // For export as PNG from gallery card
  const cardExportRefs = useRef({});

  // Fetch gallery from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const fetchGallery = async () => {
      const q = query(
        collection(db, "whiteboard_galleries"),
        where("userId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(q);
      setGalleryState(
        snapshot.docs.map((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to JS Date for display
          let createdAt = "";
          if (data.createdAt && data.createdAt.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (typeof data.createdAt === "number") {
            createdAt = new Date(data.createdAt);
          } else {
            createdAt = "";
          }
          return { id: doc.id, ...data, createdAt };
        })
      );
    };
    fetchGallery();
  }, [currentUser]);

  if (!currentUser)
    return (
      <div className="text-center mt-10 text-lg">
        Please log in to view your gallery.
      </div>
    );

  // Delete a whiteboard from Firestore and update state
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "whiteboard_galleries", id));
    setGalleryState((prev) => prev.filter((item) => item.id !== id));
    setModalImg(null);
    setEditingId(null);
  };

  // Rename a whiteboard in Firestore and update state
  const handleRename = async (id, newTitle) => {
    if (newTitle && newTitle.trim()) {
      await updateDoc(doc(db, "whiteboard_galleries", id), {
        title: newTitle.trim(),
        updatedAt: serverTimestamp(),
      });
      setGalleryState((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, title: newTitle.trim() } : item
        )
      );
      if (modalImg && modalImg.id === id) {
        setModalImg({ ...modalImg, title: newTitle.trim() });
      }
    }
  };

  // Export as PNG from card
  const handleCardExport = async (item) => {
    try {
      // Create an image element
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = item.url;

      img.onload = () => {
        // Create a canvas with the image's natural size
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");

        // Optional: Fill background if needed
        if (item.bgColor) {
          ctx.fillStyle = item.bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        // Export as PNG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const link = document.createElement("a");
              link.download = `${item.title || "whiteboard"}-LifeMastery.png`;
              link.href = URL.createObjectURL(blob);
              link.click();
              URL.revokeObjectURL(link.href);
            } else {
              alert("Failed to export image.");
            }
          },
          "image/png"
        );
      };

      img.onerror = () => {
        alert("Failed to load image for export.");
      };
    } catch (err) {
      alert("Failed to export image.");
    }
  };

  // Theme classes
  const isDark = theme === "dark";
  const bgMain = isDark
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
    : "bg-[repeating-linear-gradient(135deg,#fff_0_40px,#f8f8f8_40px_80px)]";
  const cardBg = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";
  const cardShadow = isDark ? "shadow-xl" : "shadow-lg";
  const textMain = isDark ? "text-teal-300" : "text-teal-700";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const badgeBg = isDark
    ? "bg-teal-900 text-teal-300"
    : "bg-teal-50 text-teal-700";
  const hoverRename = isDark ? "hover:bg-teal-900" : "hover:bg-teal-100";
  const hoverDelete = isDark ? "hover:bg-red-900" : "hover:bg-red-100";
  const modalBg = isDark ? "bg-gray-900" : "bg-white";
  const closeBtnBg = isDark
    ? "bg-gray-800 text-teal-300"
    : "bg-white text-teal-700";

  // Modal with zoom, pan, inline editing, and export as PNG
  const ModalWithZoomPan = ({
    modalImg,
    setModalImg,
    handleDelete,
    handleRename,
    hoverDelete,
    hoverRename,
    textMain,
    closeBtnBg,
    modalBg,
    isDark,
  }) => {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(modalImg.title);

    // Ref for export
    const exportRef = useRef();

    // Pan handlers
    const handleMouseDown = (e) => {
      e.preventDefault();
      setDragging(true);
      setStart({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    };
    const handleMouseMove = (e) => {
      if (!dragging) return;
      setOffset({
        x: e.clientX - start.x,
        y: e.clientY - start.y,
      });
    };
    const handleMouseUp = () => setDragging(false);

    // Touch handlers for mobile
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      setDragging(true);
      setStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    };
    const handleTouchMove = (e) => {
      if (!dragging || e.touches.length !== 1) return;
      setOffset({
        x: e.touches[0].clientX - start.x,
        y: e.touches[0].clientY - start.y,
      });
    };
    const handleTouchEnd = () => setDragging(false);

    // Save title
    const handleEditSave = () => {
      if (editTitle.trim()) {
        handleRename(modalImg.id, editTitle.trim());
        setEditing(false);
      }
    };

    // Export as PNG for modal
    const handleExport = async () => {
      if (!exportRef.current) return;
      try {
        const dataUrl = await toPng(exportRef.current, { cacheBust: true });
        const link = document.createElement("a");
        link.download = `${modalImg.title || "whiteboard"}-LifeMastery.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        alert("Failed to export image.");
      }
    };
    

    

    // Reset pan/zoom and editing on modal open/close or image change
    useEffect(() => {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setEditTitle(modalImg.title);
      setEditing(false);
    }, [modalImg]);

    return (
      <div
        onClick={() => setModalImg(null)}
        className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out  `}
        style={{ transition: "background 0.2s" }}
      >
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          {/* Delete button */}
          <button
            onClick={() => {
              if (window.confirm("Delete this whiteboard?"))
                handleDelete(modalImg.id);
            }}
            className={`absolute top-2 right-2 bg-red-50 text-red-600 ${hoverDelete} rounded-full p-2 shadow transition z-50`}
            title="Delete"
            aria-label="Delete"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
          {/* Zoom controls */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2 z-50">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              className="bg-white/80 text-teal-700 rounded-full w-9 h-9 flex items-center justify-center text-2xl font-bold shadow hover:bg-teal-50"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="bg-white/80 text-teal-700 rounded-full w-9 h-9 flex items-center justify-center text-2xl font-bold shadow hover:bg-teal-50"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="bg-white/80 text-teal-700 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold shadow hover:bg-teal-50"
              title="Reset"
            >
              ⟳
            </button>
          </div>
          {/* Export as PNG button */}
          <button
            onClick={handleExport}
            className="absolute bottom-4 right-4 bg-teal-600 text-white px-4 py-2 rounded shadow hover:bg-teal-700 transition z-50"
            title="Export as PNG"
          >
            Export as PNG
          </button>
          {/* Image with canvas background */}
          <div
            ref={exportRef}
            className={`max-w-[95vw] max-h-[75vh] rounded-2xl shadow-2xl ${modalBg} p-2 flex items-center justify-center overflow-hidden`}
            style={{
              background: modalImg.bgColor || (isDark ? "#111827" : "#fff"),
              cursor: dragging ? "grabbing" : zoom !== 1 ? "grab" : "default",
              transition: "background 0.2s",
            }}
            onMouseDown={zoom !== 1 ? handleMouseDown : undefined}
            onMouseMove={zoom !== 1 ? handleMouseMove : undefined}
            onMouseUp={zoom !== 1 ? handleMouseUp : undefined}
            onMouseLeave={zoom !== 1 ? handleMouseUp : undefined}
            onTouchStart={zoom !== 1 ? handleTouchStart : undefined}
            onTouchMove={zoom !== 1 ? handleTouchMove : undefined}
            onTouchEnd={zoom !== 1 ? handleTouchEnd : undefined}
          >
            <img
              src={modalImg.url}
              alt={modalImg.title}
              className="max-h-[70vh] max-w-full object-contain rounded-xl transition-transform"
              style={{
                transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${
                  offset.y / zoom
                }px)`,
                cursor:
                  zoom !== 1 ? (dragging ? "grabbing" : "grab") : "default",
                transition: dragging ? "none" : "transform 0.2s",
              }}
              draggable={false}
            />
          </div>
          {/* Editable Title */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {editing ? (
              <>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`px-2 py-1 rounded border ${textMain} bg-transparent outline-none`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  autoFocus
                  maxLength={50}
                />
                <button
                  onClick={handleEditSave}
                  className="px-2 py-1 rounded bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition"
                  title="Save"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-2 py-1 rounded bg-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-300 transition"
                  title="Cancel"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className={`font-semibold text-lg text-center truncate max-w-[200px] ${textMain} cursor-pointer underline`}
                  title={modalImg.title}
                  onClick={() => setEditing(true)}
                >
                  {modalImg.title}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className={`ml-1 p-2 rounded ${hoverRename} ${textMain} transition`}
                  title="Rename"
                  aria-label="Rename"
                >
                  <PencilIcon className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          {/* Close button */}
          <button
            onClick={() => setModalImg(null)}
            className={`absolute top-2 left-2 ${closeBtnBg} border-none rounded-full w-10 h-10 text-2xl font-bold cursor-pointer shadow flex items-center justify-center z-50`}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      </div>
    );
  };

  const isGuest = currentUser && currentUser.isAnonymous;

  return (
    <div
      className={`min-h-screen py-8 mt-24 transition-colors duration-300 ${bgMain} ${
        isGuest === true ? "pt-[7rem] lg:pt-16" : "pt-0"
      }`}
    >
      <h2
        className={`text-center text-4xl font-bold mb-8 tracking-wide drop-shadow ${textMain}`}
      >
        Your Whiteboard Gallery
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-2">
        {galleryState.length === 0 && (
          <div
            className={`col-span-full text-center text-lg rounded-xl p-8 ${cardBg} ${cardShadow} ${textSecondary}`}
          >
            No whiteboards saved yet.
          </div>
        )}
        {galleryState.map((item) => (
          <div
            key={item.id}
            className={`${cardBg} ${cardShadow} p-5 flex flex-col items-center rounded-2xl relative overflow-hidden transition-transform hover:scale-105 hover:shadow-2xl group border-2`}
            onClick={() => setModalImg(item)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setModalImg(item);
            }}
          >
            {/* Delete button at top-right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Delete this whiteboard?"))
                  handleDelete(item.id);
              }}
              className={`absolute top-3 right-3 bg-red-50 text-red-600 ${hoverDelete} rounded-full p-2 shadow transition z-10`}
              title="Delete"
              aria-label="Delete"
            >
              <TrashIcon />
            </button>
            {/* Export as PNG button for card */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardExport(item);
              }}
              className="absolute top-3 left-3 bg-teal-600 text-white px-3 py-1 rounded shadow hover:bg-teal-700 transition z-10 text-xs font-semibold"
              title="Export as PNG"
              aria-label="Export as PNG"
            >
              Export as PNG
            </button>
            <div
              ref={(el) => (cardExportRefs.current[item.id] = el)}
              className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 flex items-center justify-center shadow"
              style={{
                background: item.bgColor || (isDark ? "#374151" : "#f3f4f6"),
              }}
            >
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-contain rounded-xl transition-transform duration-200"
                loading="lazy"
              />
            </div>
            {/* Inline editing for card title */}
            <div className="flex items-center w-full justify-center gap-2 mb-1">
              {editingId === item.id ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`px-2 py-1 rounded border ${textMain} bg-transparent outline-none`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRename(item.id, editTitle);
                        setEditingId(null);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    maxLength={50}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(item.id, editTitle);
                      setEditingId(null);
                    }}
                    className="px-2 py-1 rounded bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition"
                    title="Save"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    className="px-2 py-1 rounded bg-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-300 transition"
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`font-semibold text-base text-center truncate max-w-[140px] ${textMain} cursor-pointer`}
                    title={item.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(item.id);
                      setEditTitle(item.title);
                    }}
                  >
                    {item.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(item.id);
                      setEditTitle(item.title);
                    }}
                    className={`ml-1 p-1 rounded ${hoverRename} ${textMain} transition`}
                    title="Rename"
                    aria-label="Rename"
                  >
                    <PencilIcon />
                  </button>
                </>
              )}
            </div>
            <div className={`text-sm text-center mb-2 ${textSecondary}`}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
            </div>
            <span
              className={`absolute bottom-0 right-1 text-xs px-3 py-1 rounded font-medium shadow ${badgeBg}`}
            >
              Whiteboard
            </span>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-center w-full">
        <button
          onClick={() => navigate("/dashboard")}
          className={`px-8 py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
            theme === "dark"
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "bg-teal-500 text-white hover:bg-teal-400"
          }`}
        >
          Go Back to Dashboard
        </button>
      </div>
      <div className="mt-10 flex justify-center w-full">
        <button
          onClick={() => navigate("/whiteboard")}
          className={`px-8 py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
            theme === "dark"
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "bg-teal-500 text-white hover:bg-teal-400"
          }`}
        >
          Go Back to Whiteboard
        </button>
      </div>

      {/* Fullscreen Modal */}
      {modalImg && (
        <ModalWithZoomPan
          modalImg={modalImg}
          setModalImg={setModalImg}
          handleDelete={handleDelete}
          handleRename={handleRename}
          hoverDelete={hoverDelete}
          hoverRename={hoverRename}
          textMain={"text-white"}
          closeBtnBg={closeBtnBg}
          modalBg={modalBg}
          isDark={isDark}
        />
      )}
    </div>
  );
}
export default WhiteboardGallery;