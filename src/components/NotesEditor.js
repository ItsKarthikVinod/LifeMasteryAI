import React, { useEffect, useState, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/authContext";
import {
  FaSave,
  FaShareAlt,
  FaFolderOpen,
  FaFileAlt,
  FaMoon,
  FaSun,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Responsive container
const containerClass = (theme) =>
  `flex flex-col h-[calc(100vh-64px)] w-full max-w-4xl mt-32 mx-auto shadow-lg border
   ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
   transition-all duration-300 rounded-lg`;

// Toolbar button style
const toolbarBtn = (theme, active) =>
  `px-2 py-1 rounded mx-1 text-lg transition
   ${theme === "dark"
     ? active
       ? "bg-teal-700 text-white"
       : "bg-gray-800 text-teal-300 hover:bg-teal-900"
     : active
       ? "bg-teal-500 text-white"
       : "bg-gray-100 text-teal-700 hover:bg-teal-200"}
   `;

// Editor area
const editorAreaClass = (theme) =>
  `flex-1 overflow-auto px-2 py-2 rounded-lg
   ${theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-gray-50 text-gray-900"}
   `;

// Info bar
const infoBarClass = (theme) =>
  `flex items-center gap-2 px-4 py-2 border-b
   ${theme === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}
   rounded-t-lg`;

const NotesEditor = ({
  noteId = "demoNoteId",
  folderId = "demoFolderId",
  noteTitle = "Untitled",
  folderName = "My Notes",
  sharedWith = [],
  onShare,
  onRename,
  onMove,
  onThemeToggle,
}) => {
  const { currentUser, theme } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(noteTitle || "");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareList, setShareList] = useState(sharedWith || []);
  const [lastSavedContent, setLastSavedContent] = useState(null);
  const saveTimeout = useRef(null);

  // Tiptap editor setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    autofocus: true,
    editable: true,
    onUpdate: ({ editor }) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        handleSave(editor.getJSON());
      }, 1000);
    },
  });

  // Load note content from Firestore
  useEffect(() => {
    if (!editor || !noteId || !folderId || !currentUser?.uid) return;
    let isMounted = true;
    async function fetchNote() {
      setLoading(true);
      try {
        const ref = doc(db, "notesFolders", folderId, "notes", noteId);
        const snap = await getDoc(ref);
        if (isMounted && snap.exists()) {
          const data = snap.data();
          if (data.content) {
            editor.commands.setContent(data.content);
            setLastSavedContent(JSON.stringify(data.content));
          } else {
            editor.commands.setContent("");
            setLastSavedContent(JSON.stringify(""));
          }
          setTitleInput(data.title || "");
          setShareList(data.sharedWith || []);
        } else {
          // If note doesn't exist, create a new one
          await setDoc(ref, {
            title: noteTitle,
            content: "",
            ownerId: currentUser.uid,
            sharedWith: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setTitleInput(noteTitle);
          setShareList([]);
        }
      } catch (err) {
        toast.error(
          "Error loading note. Please check your connection and permissions."
        );
      }
      setLoading(false);
    }
    fetchNote();
    return () => {
      isMounted = false;
    };
  }, [editor, noteId, folderId, currentUser]);

  // Save note to Firestore
  const handleSave = async (content) => {
    if (!noteId || !folderId || !currentUser?.uid) return;
    if (JSON.stringify(content) === lastSavedContent) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "notesFolders", folderId, "notes", noteId),
        {
          content,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      setLastSavedContent(JSON.stringify(content));
      toast.success("Note saved!", { autoClose: 1200 });
    } catch (err) {
      toast.error(
        "Failed to save note. Please check your connection and permissions."
      );
    }
    setSaving(false);
  };

  // Save title change
  const handleTitleSave = async () => {
    if (!noteId || !folderId || !currentUser?.uid) return;
    try {
      await updateDoc(doc(db, "notesFolders", folderId, "notes", noteId), {
        title: titleInput,
        updatedAt: new Date(),
      });
      setEditTitle(false);
      toast.success("Title updated!", { autoClose: 1000 });
      if (onRename) onRename(titleInput);
    } catch (err) {
      toast.error("Failed to update title.");
    }
  };

  // Share note with user
  const handleShare = async () => {
    if (!noteId || !folderId || !currentUser?.uid || !shareEmail) return;
    if (shareList.includes(shareEmail)) {
      toast.info("Already shared with this email.");
      return;
    }
    try {
      const updatedSharedWith = [...shareList, shareEmail];
      await updateDoc(doc(db, "notesFolders", folderId, "notes", noteId), {
        sharedWith: updatedSharedWith,
        updatedAt: new Date(),
      });
      setShareList(updatedSharedWith);
      setShareEmail("");
      setShowShareModal(false);
      toast.success("Note shared!", { autoClose: 1000 });
      if (onShare) onShare(updatedSharedWith);
    } catch (err) {
      toast.error("Failed to share note.");
    }
  };

  // Remove shared user
  const handleRemoveShare = async (email) => {
    if (!noteId || !folderId || !currentUser?.uid) return;
    const updatedSharedWith = shareList.filter((e) => e !== email);
    try {
      await updateDoc(doc(db, "notesFolders", folderId, "notes", noteId), {
        sharedWith: updatedSharedWith,
        updatedAt: new Date(),
      });
      setShareList(updatedSharedWith);
      toast.success("Removed from shared list.", { autoClose: 1000 });
    } catch (err) {
      toast.error("Failed to update sharing.");
    }
  };

  // Responsive height
  useEffect(() => {
    function handleResize() {
      document.documentElement.style.setProperty(
        "--notes-editor-height",
        `${window.innerHeight - 160}px`
      );
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show loading only until editor is ready
  if (loading || !editor) {
    return (
      <div
        className={
          containerClass(theme) +
          " min-h-[300px] flex items-center justify-center"
        }
      >
        <div
          className={`text-xl animate-pulse ${
            theme === "dark" ? "text-teal-300" : "text-teal-700"
          }`}
        >
          Loading Note...
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass(theme)}>
      {/* Navbar */}
      <nav
        className={`w-full h-16 flex items-center px-6 border-b ${
          theme === "dark"
            ? "bg-gray-950 border-gray-800"
            : "bg-white border-gray-200"
        } shadow`}
      >
        <span
          className={`font-bold text-xl ${
            theme === "dark" ? "text-teal-300" : "text-teal-700"
          }`}
        >
          LifeMastery Notes
        </span>
        <div className="flex-1" />
        <button
          className={toolbarBtn(theme, false)}
          onClick={onThemeToggle}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>
      </nav>

      {/* Info Bar */}
      <div className={infoBarClass(theme)}>
        <FaFolderOpen className="mr-2" />
        <span
          className={`font-semibold truncate max-w-[120px] ${
            theme === "dark" ? "text-teal-300" : "text-teal-700"
          }`}
        >
          {folderName || "Folder"}
        </span>
        <FaFileAlt className="ml-4 mr-2" />
        {editTitle ? (
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className={`px-2 py-1 rounded border focus:outline-none focus:ring-2 w-40
              ${
                theme === "dark"
                  ? "bg-gray-800 border-teal-700 text-teal-300 focus:ring-teal-500"
                  : "bg-white border-teal-300 text-teal-700 focus:ring-teal-400"
              }`}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
            }}
            autoFocus
          />
        ) : (
          <span
            className={`font-bold text-lg cursor-pointer truncate max-w-[160px] ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
            onClick={() => setEditTitle(true)}
            title="Rename note"
          >
            {titleInput || "Untitled"}
          </span>
        )}
        <div className="flex-1" />
        <button
          className={toolbarBtn(theme, false)}
          onClick={() => setShowShareModal(true)}
          title="Share"
        >
          <FaShareAlt />
        </button>
        <button
          className={toolbarBtn(theme, false)}
          onClick={() => handleSave(editor.getJSON())}
          disabled={saving}
          title="Save"
        >
          <FaSave />
        </button>
      </div>

      {/* Toolbar */}
      <div
        className={`flex flex-wrap items-center px-4 py-2 border-b ${
          theme === "dark"
            ? "border-gray-800 bg-gray-900"
            : "border-gray-200 bg-white"
        }`}
      >
        <button
          className={toolbarBtn(theme, editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <b>B</b>
        </button>
        <button
          className={toolbarBtn(theme, editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <i>I</i>
        </button>
        <button
          className={toolbarBtn(theme, editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          className={toolbarBtn(
            theme,
            editor.isActive("heading", { level: 1 })
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Heading 1"
        >
          H1
        </button>
        <button
          className={toolbarBtn(
            theme,
            editor.isActive("heading", { level: 2 })
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          H2
        </button>
        <button
          className={toolbarBtn(theme, editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          • List
        </button>
        <button
          className={toolbarBtn(theme, editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1. List
        </button>
        <button
          className={toolbarBtn(theme, editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          “”
        </button>
        <button
          className={toolbarBtn(theme, editor.isActive("codeBlock"))}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          {"</>"}
        </button>
        <button
          className={toolbarBtn(theme, false)}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          ⎌
        </button>
        <button
          className={toolbarBtn(theme, false)}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          ↻
        </button>
      </div>

      {/* Editor Area */}
      <div
        className={editorAreaClass(theme)}
        style={{
          minHeight: "300px",
          height: "var(--notes-editor-height, 60vh)",
          maxHeight: "80vh",
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div
            className={`rounded-xl shadow-2xl p-6 w-full max-w-md ${
              theme === "dark"
                ? "bg-gray-900 border border-teal-700"
                : "bg-white border border-teal-300"
            }`}
          >
            <div className="text-lg font-bold mb-2">Share Note</div>
            <div className="mb-4 text-sm">
              Enter the email of the user you want to share with:
            </div>
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 mb-4
                ${
                  theme === "dark"
                    ? "bg-gray-800 border-teal-700 text-teal-300 focus:ring-teal-500"
                    : "bg-white border-teal-300 text-teal-700 focus:ring-teal-400"
                }`}
              placeholder="user@example.com"
            />
            <div className="flex gap-2 justify-end">
              <button
                className={`px-4 py-2 rounded font-bold transition
                  ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-200 hover:bg-teal-800"
                      : "bg-gray-200 text-gray-700 hover:bg-teal-200"
                  }`}
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded font-bold transition
                  ${
                    theme === "dark"
                      ? "bg-teal-700 text-white hover:bg-teal-800"
                      : "bg-teal-500 text-white hover:bg-teal-600"
                  }`}
                onClick={handleShare}
                disabled={!shareEmail}
              >
                Share
              </button>
            </div>
            {shareList.length > 0 && (
              <div className="mt-4 text-xs">
                <div className="font-semibold mb-1">Shared with:</div>
                <ul>
                  {shareList.map((email, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2"
                    >
                      <span
                        className={`${
                          theme === "dark" ? "text-teal-300" : "text-teal-700"
                        }`}
                      >
                        {email}
                      </span>
                      <button
                        className={`ml-2 px-2 py-1 rounded ${
                          theme === "dark"
                            ? "bg-gray-800 text-red-400 hover:bg-red-900"
                            : "bg-gray-100 text-red-600 hover:bg-red-200"
                        }`}
                        onClick={() => handleRemoveShare(email)}
                        title="Remove"
                      >
                        <FaTimes />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesEditor;