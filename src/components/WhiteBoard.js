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
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Only run if the last added image is not already selected
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

  // ...inside your WhiteBoard component
  

  const CLOUDINARY_UPLOAD_PRESET = "gallery"; // Replace with your preset
  const CLOUDINARY_CLOUD_NAME = "dovnydco5"; // Replace with your cloud name

  const handleSaveToGallery = async (dataUrl, bgColor) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      // Upload to Cloudinary
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

      // Save metadata to Firestore
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

  const handleMouseDown = (e) => {
    e.evt.preventDefault(); // Prevent default browser behavior
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

      // Set the selectedId to the new text item
    } else if (tool === "pen" || tool === "eraser") {
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
      const pos = e.target.getStage().getPointerPosition();
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
      // Eraser logic: Check for intersection with lines
      const eraserRadius = eraserWidth / 2;

      const newLines = lines.filter((line) => {
        // Check if any point in the line is within the eraser radius
        for (let i = 0; i < line.points.length; i += 2) {
          const x = line.points[i];
          const y = line.points[i + 1];
          const distance = Math.sqrt(
            Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
          );
          if (distance <= eraserRadius) {
            return false; // Remove this line
          }
        }
        return true; // Keep this line
      });

      setLines(newLines);
    } else if (
      startPos &&
      (tool === "rect" || tool === "circle" || tool === "line")
    ) {
      const pos = e.target.getStage().getPointerPosition();
      let newShape;

      if (tool === "rect") {
        newShape = {
          type: "rect",
          x: Math.min(startPos.x, pos.x),
          y: Math.min(startPos.y, pos.y),
          width: Math.abs(pos.x - startPos.x),
          height: Math.abs(pos.y - startPos.y),
          stroke: color,
          strokeWidth: strokeWidth,
        };
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
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
          points: [startPos.x, startPos.y, pos.x, pos.y],
          stroke: color,
          strokeWidth: strokeWidth,
        };
      }

      setTempShape(newShape); // Update the temporary shape for visual feedback
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
      setTempShape(null); // Clear the temporary shape
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

    // Create a temporary canvas to include the background color
    const canvas = document.createElement("canvas");
    canvas.width = stage.width();
    canvas.height = stage.height();
    const context = canvas.getContext("2d");

    // Fill the background color
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the stage content onto the temporary canvas
    const stageDataURL = stage.toDataURL();
    const stageImage = new window.Image();
    stageImage.src = stageDataURL;
    stageImage.onload = () => {
      context.drawImage(stageImage, 0, 0);

      // Export the combined canvas as an image
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
    <div className={`p-7 bg-gray-100 mt-24 rounded-lg shadow-md ${ isGuest===true ? 'pt-[7rem] lg:pt-16':'pt-0'} `}>
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
        <button
          onClick={() => {
            setTool("cursor");
            setSelectedId(null); // Clear the selectedId when switching tools
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
            setSelectedId(null); // Clear the selectedId when switching tools
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
            setSelectedId(null); // Clear the selectedId when switching tools
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
            setSelectedId(null); // Clear the selectedId when switching tools
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
            setSelectedId(null); // Clear the selectedId when switching tools
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
            setSelectedId(null); // Clear the selectedId when switching tools
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
            setSelectedId(null); // Clear the selectedId when switching tools
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
            // Export the whiteboard as an image and save to gallery
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
          onMouseDown={(e) => {
            if (window.innerWidth > 768) {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty && tool === "cursor") {
                setSelectedId(null); // Clear the selectedId only if the tool is "cursor"
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
                setSelectedId(null); // Clear the selectedId only if the tool is "cursor"
              } else {
                handleMouseDown(e);
              }
            }
          }}
          onPointerMove={(e) => {
            if (window.innerWidth <= 768) {
              handleMouseMove(e);
            }
          }}
          onPointerUp={(e) => {
            if (window.innerWidth <= 768) {
              handleMouseUp(e);
            }
          }}
          ref={stageRef}
          style={{ backgroundColor: bgColor }}
        >
          <Layer>
            {images.map((img) => (
              <URLImage
                key={img.id}
                {...img}
                id={img.id}
                onClick={() => tool === "cursor" && setSelectedId(img.id)}
                isSelected={selectedId === img.id}
                tool={tool} // Pass tool as a prop
              />
            ))}

            {shapes.map((shape) =>
              shape.type === "rect" ? (
                <Rect
                  key={shape.id}
                  {...shape}
                  id={shape.id}
                  draggable={tool === "cursor"} // Enable dragging only when the cursor tool is selected
                  onClick={() => tool === "cursor" && setSelectedId(shape.id)} // Select on single click
                  onDragEnd={(e) => {
                    const updatedShapes = shapes.map((s) =>
                      s.id === shape.id
                        ? { ...s, x: e.target.x(), y: e.target.y() }
                        : s
                    );
                    setShapes(updatedShapes);
                  }}
                  onMouseEnter={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "move"; // Change cursor to "move"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tool === "cursor") {
                      e.target.getStage().container().style.cursor = "default";
                    } // Reset cursor
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
            {tempShape && // Render the temporary shape for visual feedback
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
                      node.nodes([selectedNode]); // Attach the Transformer to the selected node
                      node.getLayer().batchDraw(); // Redraw the layer
                    } else {
                      node.nodes([]); // Clear the Transformer if no node is selected
                    }
                  } else {
                    node.nodes([]); // Clear the Transformer if selectedId is null
                  }
                }
              }}
              boundBoxFunc={(oldBox, newBox) => {
                // Prevent resizing to negative dimensions
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

// 🔽 Component to render uploaded image with resizing (Transformer)
const URLImage = ({ src, x, y, id, isSelected, onClick, tool }) => {
  const [image] = useImage(src);
  const shapeRef = useRef();
  const trRef = useRef();

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
        draggable={tool === "cursor"} // Use the tool prop here
        onClick={onClick}
        id={id}
        ref={shapeRef}
        onMouseEnter={(e) => {
          if (tool === "cursor") {
            e.target.getStage().container().style.cursor = "move"; // Change cursor to "move"
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
        />
      )}
    </>
  );
};

export default WhiteBoard;
