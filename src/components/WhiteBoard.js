import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Text,
  Image,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import { useAuth } from "../contexts/authContext";
import GoToGalleryButton from "./GoToGalleryOption";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const WhiteBoard = () => {
  const stageRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [tool, setTool] = useState("pen");
  const [lines, setLines] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [textItems, setTextItems] = useState([]);
  const [images, setImages] = useState([]);
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(10);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [startPos, setStartPos] = useState(null);
  const [tempShape, setTempShape] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const lastImageId = images[images.length - 1].id;
      if (selectedId !== lastImageId) {
        setTool("cursor");
        setSelectedId(lastImageId);
      }
    }
    // eslint-disable-next-line
  }, [images]);

  useEffect(() => {
    const handlePaste = (event) => {
      if (event.clipboardData) {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function (evt) {
              const image = {
                id: `img_${Date.now()}`,
                src: evt.target.result,
                x: 150,
                y: 150,
                draggable: true,
              };
              setImages((prev) => [...prev, image]);
              setHistory((prev) => [
                ...prev,
                {
                  lines,
                  shapes,
                  textItems,
                  images: [...(prev[prev.length - 1]?.images || images), image],
                },
              ]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [lines, shapes, textItems, images, setImages, setHistory]);

  const CLOUDINARY_UPLOAD_PRESET = "gallery";
  const CLOUDINARY_CLOUD_NAME = "dovnydco5";

  const handleSaveToGallery = async (dataUrl, bgColor) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", dataUrl);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      await addDoc(collection(db, "whiteboard_galleries"), {
        userId: currentUser.uid,
        url: data.secure_url,
        title: "Untitled",
        createdAt: serverTimestamp(),
        bgColor,
      });

      toast.success("Whiteboard saved to gallery!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (err) {
      toast.error("Failed to save whiteboard.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
    setSaving(false);
  };

  // Erase logic for shapes and lines
  const eraseAtPoint = (point) => {
    const eraserRadius = eraserWidth / 2;

    // Erase lines
    let newLines = lines.filter((line) => {
      for (let i = 0; i < line.points.length; i += 2) {
        const x = line.points[i];
        const y = line.points[i + 1];
        const distance = Math.sqrt(
          Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
        );
        if (distance <= eraserRadius) {
          return false;
        }
      }
      return true;
    });

    // Erase shapes
    let newShapes = shapes.filter((shape) => {
      if (shape.type === "rect") {
        // Check if point is inside rectangle
        if (
          point.x >= shape.x &&
          point.x <= shape.x + shape.width &&
          point.y >= shape.y &&
          point.y <= shape.y + shape.height
        ) {
          return false;
        }
      } else if (shape.type === "circle") {
        const distance = Math.sqrt(
          Math.pow(point.x - shape.x, 2) + Math.pow(point.y - shape.y, 2)
        );
        if (distance <= shape.radius) {
          return false;
        }
      } else if (shape.type === "line") {
        // Check if point is near the line segment
        const [x1, y1, x2, y2] = shape.points;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return true;
        const t =
          ((point.x - x1) * dx + (point.y - y1) * dy) / (length * length);
        if (t < 0 || t > 1) return true;
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        const dist = Math.sqrt(
          Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
        );
        if (dist <= eraserRadius) {
          return false;
        }
      }
      return true;
    });

    setLines(newLines);
    setShapes(newShapes);
  };

  const handleMouseDown = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    const pos = stage.getPointerPosition();
    if (tool === "text" && clickedOnEmpty) {
      const newText = {
        id: `text_${Date.now()}`,
        x: pos.x,
        y: pos.y,
        text: "Double-click to edit",
        fontSize: 20,
        draggable: true,
      };
      setTextItems([...textItems, newText]);
      setHistory([
        ...history,
        { lines, shapes, textItems: [...textItems, newText], images },
      ]);
    } else if (tool === "pen" || tool === "eraser") {
      setIsDrawing(true);

      if (tool === "eraser") {
        eraseAtPoint(pos);
      } else {
        const newLine = {
          tool,
          points: [pos.x, pos.y],
          stroke: color,
          strokeWidth: strokeWidth,
          id: `line_${Date.now()}`,
        };
        setLines([...lines, newLine]);
        setHistory([...history, { lines, shapes, textItems, images }]);
      }
    } else if (tool === "rect" || tool === "circle" || tool === "line") {
      setStartPos(pos);
    }
  };

  const handleTextEdit = (id, newText) => {
    const updatedTextItems = textItems.map((item) =>
      item.id === id ? { ...item, text: newText } : item
    );
    setTextItems(updatedTextItems);
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (tool === "pen" && isDrawing) {
      const lastLine = lines[lines.length - 1];
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      const newLines = lines.slice(0, -1).concat(lastLine);
      setLines(newLines);
    } else if (tool === "eraser" && isDrawing) {
      eraseAtPoint(point);
    } else if (
      startPos &&
      (tool === "rect" || tool === "circle" || tool === "line")
    ) {
      let newShape;
      if (tool === "rect") {
        newShape = {
          type: "rect",
          x: Math.min(startPos.x, point.x),
          y: Math.min(startPos.y, point.y),
          width: Math.abs(point.x - startPos.x),
          height: Math.abs(point.y - startPos.y),
          stroke: color,
          strokeWidth: strokeWidth,
        };
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(point.x - startPos.x, 2) + Math.pow(point.y - startPos.y, 2)
        );
        newShape = {
          type: "circle",
          x: startPos.x,
          y: startPos.y,
          radius: radius,
          stroke: color,
          strokeWidth: strokeWidth,
        };
      } else if (tool === "line") {
        newShape = {
          type: "line",
          points: [startPos.x, startPos.y, point.x, point.y],
          stroke: color,
          strokeWidth: strokeWidth,
        };
      }
      setTempShape(newShape);
    }
  };

  const handleMouseUp = () => {
    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(false);
    } else if (
      startPos &&
      (tool === "rect" || tool === "circle" || tool === "line")
    ) {
      setShapes([...shapes, { ...tempShape, id: `shape_${Date.now()}` }]);
      setTempShape(null);
      setStartPos(null);
      setHistory([...history, { lines, shapes, textItems, images }]);
    }
  };

  // Touch events for mobile resizing/moving
  const handleTouchStart = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (tool === "eraser") {
      eraseAtPoint(pos);
      setIsDrawing(true);
    } else if (tool === "pen") {
      setIsDrawing(true);
      const newLine = {
        tool,
        points: [pos.x, pos.y],
        stroke: color,
        strokeWidth: strokeWidth,
        id: `line_${Date.now()}`,
      };
      setLines([...lines, newLine]);
      setHistory([...history, { lines, shapes, textItems, images }]);
    } else if (tool === "rect" || tool === "circle" || tool === "line") {
      setStartPos(pos);
    }
  };

  const handleTouchMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (tool === "pen" && isDrawing) {
      const lastLine = lines[lines.length - 1];
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      const newLines = lines.slice(0, -1).concat(lastLine);
      setLines(newLines);
    } else if (tool === "eraser" && isDrawing) {
      eraseAtPoint(point);
    } else if (
      startPos &&
      (tool === "rect" || tool === "circle" || tool === "line")
    ) {
      let newShape;
      if (tool === "rect") {
        newShape = {
          type: "rect",
          x: Math.min(startPos.x, point.x),
          y: Math.min(startPos.y, point.y),
          width: Math.abs(point.x - startPos.x),
          height: Math.abs(point.y - startPos.y),
          stroke: color,
          strokeWidth: strokeWidth,
        };
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(point.x - startPos.x, 2) + Math.pow(point.y - startPos.y, 2)
        );
        newShape = {
          type: "circle",
          x: startPos.x,
          y: startPos.y,
          radius: radius,
          stroke: color,
          strokeWidth: strokeWidth,
        };
      } else if (tool === "line") {
        newShape = {
          type: "line",
          points: [startPos.x, startPos.y, point.x, point.y],
          stroke: color,
          strokeWidth: strokeWidth,
        };
      }
      setTempShape(newShape);
    }
  };

  const handleTouchEnd = () => {
    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(false);
    } else if (
      startPos &&
      (tool === "rect" || tool === "circle" || tool === "line")
    ) {
      setShapes([...shapes, { ...tempShape, id: `shape_${Date.now()}` }]);
      setTempShape(null);
      setStartPos(null);
      setHistory([...history, { lines, shapes, textItems, images }]);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setLines(last.lines);
    setShapes(last.shapes);
    setTextItems(last.textItems);
    setImages(last.images);
    setHistory(history.slice(0, -1));
  };

  const handleExport = () => {
    const stage = stageRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = stage.width();
    canvas.height = stage.height();
    const context = canvas.getContext("2d");
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const stageDataURL = stage.toDataURL();
    const stageImage = new window.Image();
    stageImage.src = stageDataURL;
    stageImage.onload = () => {
      context.drawImage(stageImage, 0, 0);
      const link = document.createElement("a");
      link.download = "whiteboard.png";
      link.href = canvas.toDataURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (evt) {
      const image = {
        id: `img_${Date.now()}`,
        src: evt.target.result,
        x: 150,
        y: 150,
        draggable: true,
        scaleX: 1,
        scaleY: 1,
      };
      setImages([...images, image]);
      setHistory([...history, { lines, shapes, textItems, images }]);
    };
    reader.readAsDataURL(file);
  };

  const isGuest = currentUser && currentUser.isAnonymous;

  const handleDelete = useCallback(
    (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        setLines((prevLines) => prevLines.filter((l) => l.id !== selectedId));
        setShapes((prevShapes) =>
          prevShapes.filter((s) => s.id !== selectedId)
        );
        setTextItems((prevTextItems) =>
          prevTextItems.filter((t) => t.id !== selectedId)
        );
        setImages((prevImages) =>
          prevImages.filter((i) => i.id !== selectedId)
        );
        setSelectedId(null);
      }
    },
    [selectedId]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [selectedId, lines, shapes, textItems, images, handleDelete]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 mt-24 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-teal-700">
            Please sign in to use the Whiteboard
          </h2>
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
    <div className={`p-7 bg-gray-100 mt-24 rounded-lg shadow-md ${isGuest === true ? 'pt-[7rem] lg:pt-16' : 'pt-0'} `}>
      <ToastContainer />
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-teal-400 to-blue-400 animate-pulse w-full" />
            </div>
            <span className="text-lg font-semibold text-white drop-shadow">
              Saving to gallery...
            </span>
          </div>
        </div>
      )}
      <h1 className="text-4xl font-bold mb-4 text-center text-teal-900">
        Whiteboard
      </h1>
      <h3 className=" text-lg text-center text-gray-700 mb-4">
        Use the tools below to draw, write, and create shapes on the canvas. You
        can also upload images and save your work as a PNG file.
      </h3>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center justify-center">
        {/* ...toolbar buttons unchanged... */}
        <button
          onClick={() => {
            setTool("cursor");
            setSelectedId(null);
          }}
          className={`btn px-4 py-2 rounded-lg shadow-md transition-all ${
            tool === "cursor"
              ? "bg-teal-500 text-white shadow-lg transform scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          🖱️ Cursor
        </button>
        <button
          onClick={() => {
            setTool("pen");
            setSelectedId(null);
          }}
          className={`btn px-4 py-2 rounded-lg shadow-md transition-all ${
            tool === "pen"
              ? "bg-teal-500 text-white shadow-lg transform scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          ✏️ Pen
        </button>
        <button
          onClick={() => {
            setTool("eraser");
            setSelectedId(null);
          }}
          className={`btn px-4 py-2 rounded-lg shadow-md transition-all ${
            tool === "eraser"
              ? "bg-teal-500 text-white shadow-lg transform scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          🧽 Eraser
        </button>
        <button
          onClick={() => {
            setTool("rect");
            setSelectedId(null);
          }}
          className={`btn px-4 py-2 rounded-lg shadow-md transition-all ${
            tool === "rect"
              ? "bg-teal-500 text-white shadow-lg transform scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          ▭ Rectangle
        </button>
        <button
          onClick={() => {
            setTool("circle");
            setSelectedId(null);
          }}
          className={`btn px-4 py-2 rounded-lg shadow-md transition-all ${
            tool === "circle"
              ? "bg-teal-500 text-white shadow-lg transform scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          ⚪ Circle
        </button>
        <button
          onClick={() => {
            setTool("line");
            setSelectedId(null);
          }}
          className={`btn px-4 py-2 rounded-lg shadow-md transition-all ${
            tool === "line"
              ? "bg-teal-500 text-white shadow-lg transform scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          ➖ Line
        </button>
        <button
          onClick={() => {
            setTool("text");
            setSelectedId(null);
          }}
          className={`btn px-4 py-2 rounded-lg shadow-md transition-all ${
            tool === "text"
              ? "bg-teal-500 text-white shadow-lg transform scale-105"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          🔤 Text
        </button>
        <button
          onClick={handleUndo}
          className="btn px-4 py-2 rounded-lg shadow-md transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          ↩️ Undo
        </button>
        <label className="btn cursor-pointer px-4 py-2 rounded-lg shadow-md transition-all bg-gray-200 text-gray-700 hover:bg-gray-300">
          🖼 Upload Image
          <input type="file" onChange={handleImageUpload} className="hidden" />
        </label>
        <button
          onClick={() => {
            setHistory([...history, { lines, shapes, textItems, images }]);
            setLines([]);
            setShapes([]);
            setTextItems([]);
            setImages([]);
            toast.warn(
              "Whiteboard cleared! You can undo using the ↩️ Undo button.",
              {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              }
            );
          }}
          className="btn px-4 py-2 rounded-lg shadow-md transition-all bg-red-200 text-red-700 hover:bg-red-300 font-bold"
        >
          🗑️ Clear
        </button>
        <button
          onClick={() => {
            const stage = stageRef.current;
            const dataUrl = stage.toDataURL({ pixelRatio: 2 });
            handleSaveToGallery(dataUrl, bgColor);
          }}
          className="inline-flex items-center px-2 py-2 rounded-xl font-semibold text-lg bg-white text-teal-700 border border-teal-500 shadow-md hover:bg-teal-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
        >
          <span className="mr-2 text-2xl">📤</span>
          <span>Save to Gallery</span>
        </button>
        <button
          onClick={handleExport}
          className="btn px-6 py-3 rounded-full shadow-xl transition-all bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold text-xl hover:from-blue-600 hover:to-green-600 hover:shadow-2xl transform hover:scale-110"
        >
          📤 Save as PNG
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 justify-center">
        {/* ...color pickers unchanged... */}
        <div>
          <label className="block mb-1"> Ink Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">Stroke Width</label>
          <input
            type="range"
            min="1"
            max="30"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-1">Eraser Size</label>
          <input
            type="range"
            min="5"
            max="50"
            value={eraserWidth}
            onChange={(e) => setEraserWidth(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block mb-1">Canvas Background</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
          />
        </div>
        <GoToGalleryButton />
      </div>
      <p className="text-center text-gray-700 mb-4">
        To delete, select the item and press the Delete/ Backspace key.
      </p>
      <div
        className="border-2 border-gray-400 rounded overflow-hidden"
        style={{
          position: "relative",
          cursor:
            tool === "pen"
              ? "crosshair"
              : tool === "eraser"
              ? "cell"
              : tool === "rect"
              ? "crosshair"
              : tool === "circle"
              ? "crosshair"
              : tool === "line"
              ? "crosshair"
              : tool === "text"
              ? "text"
              : "default",
          touchAction: "none",
        }}
      >
        <Stage
          width={window.innerWidth - 60}
          height={window.innerHeight - 400}
          ref={stageRef}
          style={{ backgroundColor: bgColor }}
          onMouseDown={(e) => {
            if (window.innerWidth > 768) {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty && tool === "cursor") {
                setSelectedId(null);
              } else {
                handleMouseDown(e);
              }
            }
          }}
          onMousemove={(e) => {
            if (window.innerWidth > 768) {
              handleMouseMove(e);
            }
          }}
          onMouseUp={(e) => {
            if (window.innerWidth > 768) {
              handleMouseUp(e);
            }
          }}
          onPointerDown={(e) => {
            if (window.innerWidth <= 768) {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty && tool === "cursor") {
                setSelectedId(null);
              } else {
                handleTouchStart(e);
              }
            }
          }}
          onPointerMove={(e) => {
            if (window.innerWidth <= 768) {
              handleTouchMove(e);
            }
          }}
          onPointerUp={(e) => {
            if (window.innerWidth <= 768) {
              handleTouchEnd(e);
            }
          }}
        >
          <Layer>
            {images.map((img) => (
              <URLImage
                key={img.id}
                {...img}
                id={img.id}
                onClick={() => tool === "cursor" && setSelectedId(img.id)}
                isSelected={selectedId === img.id}
                tool={tool}
              />
            ))}

            {shapes.map((shape) =>
              shape.type === "rect" ? (
                <Rect
                  key={shape.id}
                  {...shape}
                  id={shape.id}
                  draggable={tool === "cursor"}
                  onClick={() => tool === "cursor" && setSelectedId(shape.id)}
                  onDragEnd={(e) => {
                    const updatedShapes = shapes.map((s) =>
                      s.id === shape.id
                        ? { ...s, x: e.target.x(), y: e.target.y() }
                        : s
                    );
                    setShapes(updatedShapes);
                  }}
                  onTouchStart={(e) => {
                    if (tool === "cursor") {
                      setSelectedId(shape.id);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (tool === "cursor") {
                      const touch = e.evt.touches[0];
                      if (touch) {
                        const stage = e.target.getStage();
                        const pointer = stage.getPointerPosition();
                        const updatedShapes = shapes.map((s) =>
                          s.id === shape.id
                            ? { ...s, x: pointer.x, y: pointer.y }
                            : s
                        );
                        setShapes(updatedShapes);
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "move";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "default";
                    }
                  }}
                />
              ) : shape.type === "circle" ? (
                <Circle
                  key={shape.id}
                  {...shape}
                  id={shape.id}
                  draggable={tool === "cursor"}
                  onClick={() => tool === "cursor" && setSelectedId(shape.id)}
                  onDragEnd={(e) => {
                    const updatedShapes = shapes.map((s) =>
                      s.id === shape.id
                        ? { ...s, x: e.target.x(), y: e.target.y() }
                        : s
                    );
                    setShapes(updatedShapes);
                  }}
                  onTouchStart={(e) => {
                    if (tool === "cursor") {
                      setSelectedId(shape.id);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (tool === "cursor") {
                      const touch = e.evt.touches[0];
                      if (touch) {
                        const stage = e.target.getStage();
                        const pointer = stage.getPointerPosition();
                        const updatedShapes = shapes.map((s) =>
                          s.id === shape.id
                            ? { ...s, x: pointer.x, y: pointer.y }
                            : s
                        );
                        setShapes(updatedShapes);
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "move";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "default";
                    }
                  }}
                />
              ) : (
                <Line
                  key={shape.id}
                  {...shape}
                  id={shape.id}
                  draggable={tool === "cursor"}
                  onClick={() => tool === "cursor" && setSelectedId(shape.id)}
                  onDragEnd={(e) => {
                    const updatedShapes = shapes.map((s) =>
                      s.id === shape.id
                        ? {
                            ...s,
                            points: shape.points.map((_, i) =>
                              i % 2 === 0
                                ? e.target.points()[i]
                                : e.target.points()[i + 1]
                            ),
                          }
                        : s
                    );
                    setShapes(updatedShapes);
                  }}
                  onTouchStart={(e) => {
                    if (tool === "cursor") {
                      setSelectedId(shape.id);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (tool === "cursor") {
                      const touch = e.evt.touches[0];
                      if (touch) {
                        const stage = e.target.getStage();
                        const pointer = stage.getPointerPosition();
                        const updatedShapes = shapes.map((s) =>
                          s.id === shape.id
                            ? {
                                ...s,
                                points: [
                                  pointer.x,
                                  pointer.y,
                                  pointer.x + 50,
                                  pointer.y + 50,
                                ],
                              }
                            : s
                        );
                        setShapes(updatedShapes);
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "move";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "default";
                    }
                  }}
                />
              )
            )}
            {tempShape &&
              (tempShape.type === "rect" ? (
                <Rect {...tempShape} dash={[10, 5]} />
              ) : tempShape.type === "circle" ? (
                <Circle {...tempShape} dash={[10, 5]} />
              ) : (
                <Line {...tempShape} dash={[10, 5]} />
              ))}

            {textItems.map((textItem) => (
              <Text
                key={textItem.id}
                {...textItem}
                draggable={tool === "cursor"}
                onMouseEnter={(e) => {
                  if (tool === "cursor") {
                    e.target.getStage().container().style.cursor = "move";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.getStage().container().style.cursor = "default";
                }}
                onClick={() => {
                  if (tool === "cursor") {
                    setSelectedId(textItem.id);
                  }
                }}
                onTouchStart={(e) => {
                  if (tool === "cursor") {
                    setSelectedId(textItem.id);
                  }
                }}
                onTouchMove={(e) => {
                  if (tool === "cursor") {
                    const touch = e.evt.touches[0];
                    if (touch) {
                      const stage = e.target.getStage();
                      const pointer = stage.getPointerPosition();
                      const updatedTextItems = textItems.map((item) =>
                        item.id === textItem.id
                          ? { ...item, x: pointer.x, y: pointer.y }
                          : item
                      );
                      setTextItems(updatedTextItems);
                    }
                  }
                }}
                onDblClick={() => {
                  const newText = prompt("Edit text:", textItem.text);
                  if (newText !== null) {
                    handleTextEdit(textItem.id, newText);
                  }
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const updatedTextItems = textItems.map((item) =>
                    item.id === textItem.id
                      ? {
                          ...item,
                          x: node.x(),
                          y: node.y(),
                          fontSize: node.fontSize(),
                        }
                      : item
                  );
                  setTextItems(updatedTextItems);
                }}
              />
            ))}

            {lines.map((line, i) => (
              <Line
                key={i}
                id={line.id}
                points={line.points}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
                draggable={tool === "cursor"}
                onClick={() => tool === "cursor" && setSelectedId(line.id)}
                onDragEnd={(e) => {
                  const updatedLines = lines.map((l) =>
                    l.id === line.id
                      ? {
                          ...l,
                          points: e.target.points(),
                        }
                      : l
                  );
                  setLines(updatedLines);
                }}
                onTouchStart={(e) => {
                  if (tool === "cursor") {
                    setSelectedId(line.id);
                  }
                }}
                onTouchMove={(e) => {
                  if (tool === "cursor") {
                    const touch = e.evt.touches[0];
                    if (touch) {
                      const stage = e.target.getStage();
                      const pointer = stage.getPointerPosition();
                      const updatedLines = lines.map((l) =>
                        l.id === line.id
                          ? {
                              ...l,
                              points: [
                                pointer.x,
                                pointer.y,
                                pointer.x + 50,
                                pointer.y + 50,
                              ],
                            }
                          : l
                      );
                      setLines(updatedLines);
                    }
                  }
                }}
              />
            ))}
            <Transformer
              ref={(node) => {
                if (node) {
                  if (selectedId) {
                    const selectedNode = stageRef.current.findOne(
                      `#${selectedId}`
                    );
                    if (selectedNode) {
                      node.nodes([selectedNode]);
                      node.getLayer().batchDraw();
                    } else {
                      node.nodes([]);
                    }
                  } else {
                    node.nodes([]);
                  }
                }
              }}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={true}
              resizeEnabled={true}
              anchorSize={10}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

// Component to render uploaded image with resizing (Transformer) and pinch-to-zoom
const URLImage = ({ src, x, y, id, isSelected, onClick, tool, scaleX = 1, scaleY = 1 }) => {
  const [image] = useImage(src);
  const shapeRef = useRef();
  const trRef = useRef();
  const lastDistanceRef = useRef(null);

  // Pinch-to-zoom for touch devices
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) return;

    const handleTouchMove = (e) => {
      if (tool !== "cursor") return;
      if (e.evt.touches.length === 2) {
        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastDistanceRef.current) {
          const scaleChange = distance / lastDistanceRef.current;
          node.scaleX(node.scaleX() * scaleChange);
          node.scaleY(node.scaleY() * scaleChange);
          node.getLayer().batchDraw();
        }
        lastDistanceRef.current = distance;
      }
    };

    const handleTouchEnd = (e) => {
      lastDistanceRef.current = null;
    };

    node.on("touchmove", handleTouchMove);
    node.on("touchend", handleTouchEnd);

    return () => {
      node.off("touchmove", handleTouchMove);
      node.off("touchend", handleTouchEnd);
    };
  }, [tool]);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, image]);

  return (
    <>
      <Image
        image={image}
        x={x}
        y={y}
        draggable={tool === "cursor"}
        onClick={onClick}
        id={id}
        ref={shapeRef}
        scaleX={scaleX}
        scaleY={scaleY}
        onTouchStart={(e) => {
          if (tool === "cursor") {
            if (onClick) onClick();
          }
        }}
        onTouchMove={(e) => {
          if (tool === "cursor" && e.evt.touches.length === 1) {
            const touch = e.evt.touches[0];
            if (touch) {
              const stage = e.target.getStage();
              const pointer = stage.getPointerPosition();
              shapeRef.current.x(pointer.x);
              shapeRef.current.y(pointer.y);
              shapeRef.current.getLayer().batchDraw();
            }
          }
        }}
        onMouseEnter={(e) => {
          if (tool === "cursor") {
            e.target.getStage().container().style.cursor = "move";
          }
        }}
        onMouseLeave={(e) => {
          if (tool === "cursor") {
            e.target.getStage().container().style.cursor = "default";
          }
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            return newBox.width < 5 || newBox.height < 5 ? oldBox : newBox;
          }}
          rotateEnabled={true}
          resizeEnabled={true}
          anchorSize={10}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
        />
      )}
    </>
  );
}
export default WhiteBoard;