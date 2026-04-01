import React, { useEffect, useMemo, useState, useRef } from "react";
import { MantineProvider } from "@mantine/core";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import { db } from "../firebase/firebase";
import {
  doc,
  updateDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  FaSave,
  FaImage,
  FaChevronRight,
  FaFolder,
  FaFileAlt,
  FaTimes,
  FaSpinner,
  FaFilePdf,

} from "react-icons/fa";
import { codeBlock } from "@blocknote/code-block";
import { jsPDF } from "jspdf";

const CLOUDINARY_UPLOAD_PRESET = "gallery";
const CLOUDINARY_CLOUD_NAME = "dovnydco5";
const EMPTY_DOC = [{ type: "paragraph", content: [] }];

function showToast(msg, isDark) {
  const toast = document.createElement("div");
  toast.innerText = msg;
  toast.style.position = "fixed";
  toast.style.bottom = "32px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "8px";
  toast.style.fontWeight = "bold";
  toast.style.zIndex = 9999;
  toast.style.background = isDark ? "#222" : "#14b8a6";
  toast.style.color = "#fff";
  toast.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2200);
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  return data.secure_url;
}

function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/,
  );
  return match ? match[1] : null;
}

function CustomVideoBlockContent({ url }) {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return (
      <div style={{ margin: "1em 0", textAlign: "center" }}>
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 12, maxWidth: "100%" }}
        />
      </div>
    );
  }
  return (
    <video
      src={url}
      controls
      style={{ maxWidth: "100%", borderRadius: 12, margin: "1em 0" }}
    />
  );
}

function flattenBlocknoteToText(blockContent) {
  if (!blockContent) return "";

  if (blockContent.content && Array.isArray(blockContent.content)) {
    blockContent = blockContent.content;
  }

  if (!Array.isArray(blockContent)) return "";

  const nodeToText = (node) => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (node.type === "text") return node.text || "";
    if (Array.isArray(node.content)) {
      return node.content.map(nodeToText).join("");
    }
    if (Array.isArray(node.children)) {
      return node.children.map(nodeToText).join("");
    }
    return node.text || "";
  };

  let output = "";
  blockContent.forEach((block) => {
    if (!block || typeof block !== "object") return;

    let blockText = "";
    if (Array.isArray(block.content)) {
      blockText = block.content.map(nodeToText).join("");
    } else if (block.text) {
      blockText = block.text;
    }

    const prefix =
      block.type === "heading"
        ? "# "
        : block.type === "blockquote"
          ? "> "
          : block.type === "ordered_list_item" ||
              block.type === "bullet_list_item"
            ? "• "
            : "";

    output += prefix + blockText + "\n";
    if (
      [
        "paragraph",
        "heading",
        "blockquote",
        "ordered_list_item",
        "bullet_list_item",
      ].includes(block.type)
    ) {
      output += "\n";
    }
  });

  return output.trim();
}

export default function NotesEditor({
  folderId,
  theme,
  selectedNote,
  setSelectedNote,
  folders,
  selectedFolder,
  setSelectedFolder,
  onNoteRename,
}) {
  const isDark = theme === "dark";
  const [title, setTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [initialContent, setInitialContent] = useState("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const editorRef = useRef(null);
  const exportTargetRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title || "");
      setCoverUrl(selectedNote.coverUrl || "");
      let content = selectedNote.content;
      if (typeof content === "string") {
        try {
          content = JSON.parse(content);
        } catch {
          content = EMPTY_DOC;
        }
      }
      setInitialContent(content?.length ? content : EMPTY_DOC);
      setIsDirty(false);
    } else {
      setTitle("");
      setCoverUrl("");
      setInitialContent(EMPTY_DOC);
      setIsDirty(false);
    }
  }, [selectedNote]);

  const editor = useMemo(() => {
    if (initialContent === "loading") return undefined;

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const ed = BlockNoteEditor.create({
      blockComponents: {
        video: {
          render: ({ block }) => <CustomVideoBlockContent url={block.url} />,
        },
      },
      codeBlock,
      tables: {
        splitCells: true,
        cellBackgroundColor: true,
        cellTextColor: true,
        headers: true,
      },
      initialContent,
      uploadFile: uploadToCloudinary,
    });
    editorRef.current = ed;

    return ed;
  }, [initialContent]);

  // Add change listener after editor is created
  useEffect(() => {
    if (editor) {
      const unsubscribe = editor.on("change", () => {
        setIsDirty(true);
      });
      unsubscribeRef.current = unsubscribe;
    }
  }, [editor]);

  // Cleanup editor change listener when component unmounts
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const handleSave = async () => {
    if (!editor || !folderId) return;
    const contentString = JSON.stringify(editor.document || EMPTY_DOC);
    setIsSaving(true);
    const data = {
      title: title?.trim() || "Untitled",
      coverUrl: coverUrl || "",
      content: contentString,
      folderId,
      updatedAt: serverTimestamp(),
    };

    try {
      if (selectedNote?.id) {
        const noteRef = doc(
          db,
          "notesFolders",
          folderId,
          "notes",
          selectedNote.id,
        );
        try {
          await updateDoc(noteRef, data);
        } catch (err) {
          // If no document, do an upsert using setDoc + merge
          if (
            err.code === "not-found" ||
            err.message?.includes("No document to update")
          ) {
            await setDoc(
              noteRef,
              {
                ...data,
                createdAt: selectedNote.createdAt || serverTimestamp(),
              },
              { merge: true },
            );
          } else {
            console.error("Failed to update note:", err);
            showToast("Save failed. Please try again.", isDark);
            setIsSaving(false);
            return;
          }
        }
        setSelectedNote({ ...selectedNote, ...data, content: editor.document });
        if (onNoteRename && typeof onNoteRename === "function") {
          onNoteRename(selectedNote.id, data.title);
        }
      } else {
        const ref = await addDoc(
          collection(db, "notesFolders", folderId, "notes"),
          {
            ...data,
            createdAt: serverTimestamp(),
          },
        );
        setSelectedNote({ id: ref.id, ...data, content: editor.document });
        if (onNoteRename && typeof onNoteRename === "function") {
          onNoteRename(ref.id, data.title);
        }
      }

      setIsSaving(false);
      setIsDirty(false);
      showToast("Note saved!", isDark);
    } catch (err) {
      console.error("Save error:", err);
      showToast("Save failed. Please try again.", isDark);
      setIsSaving(false);
    }
  };

  const exportNoteToPdf = async () => {
    if (!editor) return;
    setIsExporting(true);

    const rawDoc = editor.document || initialContent;
    const plainText = flattenBlocknoteToText(rawDoc);

    if (!plainText.trim()) {
      showToast("No content to export.", isDark);
      setIsExporting(false);
      return;
    }

    const safeTitle = (title?.trim() || "Untitled Note").replace(
      /[<>:"\\/|?*]/g,
      "",
    );

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const margin = 15;
      const maxWidth = 180;
      const lineHeight = 7;
      let cursorY = 20;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.text(safeTitle, margin, cursorY);
      cursorY += lineHeight + 6;
      pdf.setFontSize(11);

      const paragraphs = plainText.split(/\n+/);
      for (const p of paragraphs) {
        const lines = pdf.splitTextToSize(p, maxWidth);
        for (const line of lines) {
          if (cursorY > 285) {
            pdf.addPage();
            cursorY = 20;
          }
          pdf.text(line, margin, cursorY);
          cursorY += lineHeight;
        }
        cursorY += 3;
      }

      pdf.save(`${safeTitle}.pdf`);
      showToast("PDF export complete!", isDark);
    } catch (err) {
      console.error("PDF export failed", err);
      showToast("PDF export failed. Please try again.", isDark);
    } finally {
      setIsExporting(false);
    }
  };

  // Monitor unsaved changes when leaving page/browser
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        setShowUnsavedPrompt(true);
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const UnsavedPrompt = () =>
    showUnsavedPrompt ? (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 99999,
          width: "100vw",
          height: "100vh",
          background: isDark ? "rgba(20,20,20,0.85)" : "rgba(255,255,255,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: isDark ? "#222" : "#fff",
            color: isDark ? "#fff" : "#222",
            padding: "32px",
            borderRadius: "16px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
            minWidth: 320,
            textAlign: "center",
          }}
        >
          <div className="mb-4 text-lg font-bold">
            You have unsaved changes. Save before leaving?
          </div>
          <div className="flex gap-4 justify-center">
            <button
              className={`px-4 py-2 rounded font-bold ${
                isDark
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }`}
              onClick={async () => {
                await handleSave();
                setShowUnsavedPrompt(false);
              }}
            >
              Save & Continue
            </button>
            <button
              className={`px-4 py-2 rounded font-bold ${
                isDark
                  ? "bg-gray-700 text-white hover:bg-gray-800"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setShowUnsavedPrompt(false)}
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    ) : null;

  const getBreadcrumbs = () => {
    const crumbs = [];
    crumbs.push({
      label: "All Folders",
      icon: <FaFolder />,
      onClick: () => {
        setSelectedFolder(null);
        setSelectedNote(null);
      },
    });
    const folder = folders?.find((f) => f.id === selectedFolder);
    if (folder)
      crumbs.push({
        label: folder.name,
        icon: <FaFolder />,
        onClick: () => setSelectedNote(null),
      });
    if (selectedNote)
      crumbs.push({
        label: selectedNote.title || "Untitled",
        icon: <FaFileAlt />,
        onClick: () => {},
      });
    return crumbs;
  };

  const onCoverPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadToCloudinary(file);
    setCoverUrl(url);
    setIsDirty(true);
  };

  if (editor === undefined) {
    return (
      <div
        className={`flex items-center justify-center h-full text-lg ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Loading content...
      </div>
    );
  }

  return (
    <MantineProvider theme={{ colorScheme: isDark ? "dark" : "light" }}>
      <UnsavedPrompt />
      <div
        className="flex flex-col w-full "
        style={{
          minHeight: "100vh",
          background: isDark ? "#18181b" : "#f9fafb",
        }}
      >
        <nav
          className={`sticky top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-3 mb-2 border-b ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          }`}
        >
          {getBreadcrumbs().map((c, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              <button
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded transition ${
                  isDark
                    ? "bg-gray-800 text-teal-300 hover:bg-teal-900"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
                onClick={c.onClick}
                disabled={i === arr.length - 1}
              >
                {c.icon}
                <span className="truncate max-w-[120px]">{c.label}</span>
              </button>
              {i < arr.length - 1 && (
                <FaChevronRight className="mx-1 text-gray-400" />
              )}
            </span>
          ))}
        </nav>

        <div className="w-full flex justify-center relative mb-2 ">
          <div
            className="w-full max-w-4xl h-48 sm:h-56 md:h-64 rounded-2xl overflow shadow-lg relative"
            style={{
              background: coverUrl
                ? `url(${coverUrl}) center/cover no-repeat`
                : isDark
                  ? "linear-gradient(135deg,#222,#333)"
                  : "linear-gradient(135deg,#e0f7fa,#f9fafb)",
              display: coverUrl ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {coverUrl && (
              <button
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition"
                title="Remove Cover"
                onClick={() => {
                  setCoverUrl("");
                  setIsDirty(true);
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6 w-full h-full max-w-6xl px-2 sm:px-6 md:px-6 mx-auto sticky top-[0rem] z-10 bg-inherit p-3 rounded-xl shadow backdrop-blur-sm">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border font-bold text-2xl sm:text-3xl focus:outline-none transition shadow ${
                  isDark
                    ? "bg-gray-900 border-teal-700 text-teal-200"
                    : "bg-white border-teal-300 text-teal-800"
                }`}
                placeholder="Page Title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                maxLength={120}
                style={{ minWidth: 0 }}
              />
            </div>
            {(isSaving || isExporting) && (
              <div className="flex items-center gap-2 text-xs font-semibold mt-1">
                <FaSpinner className="animate-spin" />
                <span className={isDark ? "text-teal-300" : "text-teal-700"}>
                  {isSaving
                    ? "Saving..."
                    : isExporting
                      ? "Preparing PDF..."
                      : ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isDirty && (
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                  isDark
                    ? "bg-yellow-900 text-yellow-300"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                Unsaved
              </span>
            )}
            <label
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold shadow transition cursor-pointer ${
                isDark
                  ? "bg-teal-800 text-white hover:bg-teal-700"
                  : "bg-teal-100 text-teal-700 hover:bg-teal-200"
              }`}
              title="Add/Change Cover"
            >
              <FaImage />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onCoverPick}
              />
              <span className="text-xs font-semibold">Cover</span>
            </label>

            <button
              onClick={exportNoteToPdf}
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold shadow transition ${
                isDark
                  ? "bg-indigo-700 text-white hover:bg-indigo-800"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              disabled={isExporting || isSaving}
              title="Export current note to PDF"
            >
              <FaFilePdf />
              <span className="text-xs font-semibold">Export as PDF</span>
            </button>

            <button
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold shadow transition ${
                isDark
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }`}
              onClick={handleSave}
              title="Save"
              disabled={isSaving || isExporting}
            >
              <FaSave />
              <span className="text-xs font-semibold">Save</span>
            </button>
          </div>
        </div>

        <div
          className="flex-1 w-full max-w-full sm:max-w-4xl md:max-w-5xl px-2 sm:px-4 md:px-8 pb-8 mx-auto"
          style={{
            minHeight: 300,

            borderRadius: 18,
            background: isDark ? "#18181b" : "#fff",
            boxShadow: isDark
              ? "0 4px 24px 0 rgba(0,0,0,0.25)"
              : "0 4px 24px 0 rgba(0,0,0,0.07)",

            width: "100%",
            padding: "16px",
          }}
        >
          <BlockNoteView
            onChange={() => setIsDirty(true)}
            editor={editor}
            theme={isDark ? "dark" : "light"}
          />
        </div>

        <div
          ref={exportTargetRef}
          style={{
            position: "fixed",
            width: 800,
            left: -9999,
            top: -9999,
            padding: 20,
            zIndex: -1,
            opacity: 0,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
      </div>
    </MantineProvider>
  );
}
