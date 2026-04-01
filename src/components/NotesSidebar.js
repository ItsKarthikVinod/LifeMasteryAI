import React, { useEffect, useState } from "react";
import {
  FaBars,
  FaEdit,
  FaFileAlt,
  FaFolder,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import Footer from "./Footer";
import { useAuth } from "../contexts/authContext";
import {
  addFolder,
  deleteFolder,
  renameFolder,
  useNotesFolders,
} from "../hooks/useNotesFolders";

const NotesSidebar = ({
  selectedFolder,
  setSelectedFolder,
  selectedNote,
  setSelectedNote,
  notes,
  onAddNoteToFolder,
  onDeleteNote,
  theme,
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobile = false,
  onMobileClose,
}) => {
  const { currentUser } = useAuth();
  const folders = useNotesFolders(currentUser?.uid);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const isDark = theme === "dark";

  useEffect(() => {
    if (selectedFolder && folders.length > 0) {
      const folderExists = folders.some((f) => f.id === selectedFolder);
      if (!folderExists) {
        setSelectedFolder(folders[0]?.id || null);
      }
    }
  }, [selectedFolder, folders, setSelectedFolder]);

  const getFolderName = (folderId) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder ? folder.name : "Unknown Folder";
  };

  const globalSearchResults = searchTerm
    ? notes.filter(
        (n) =>
          n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof n.content === "string"
            ? n.content.toLowerCase().includes(searchTerm.toLowerCase())
            : JSON.stringify(n.content)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())),
      )
    : [];

  const handleFolderClick = (folderId) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: true }));
    setSelectedFolder(folderId);
    const folderNotes = notes.filter((n) => n.folderId === folderId);
    setSelectedNote(folderNotes.length > 0 ? folderNotes[0] : null);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const wrapperClass = isMobile
    ? "fixed inset-y-0 left-0 z-50 w-80 max-w-[80vw] h-full shadow-2xl bg-white dark:bg-gray-900"
    : `transition-all duration-300 ${sidebarCollapsed ? "w-12 min-w-[3rem]" : "w-72 min-w-[16rem]"} h-full flex flex-col border-r ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`;

  return (
    <div
      className={`${wrapperClass}`}
      style={{ overflow: "hidden", zIndex: 999 }}
    >
      <div
        className={`flex items-center justify-between px-2 py-2 border-b sticky top-0 z-20 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <button
          className={`p-2 rounded transition ${isDark ? "bg-gray-800 text-teal-300 hover:bg-gray-700" : "bg-teal-50 text-teal-700 hover:bg-teal-100"}`}
          onClick={() => {
            if (isMobile) {
              if (onMobileClose) onMobileClose();
            } else {
              setSidebarCollapsed((c) => !c);
            }
          }}
          title={
            isMobile
              ? "Close sidebar"
              : sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
          }
        >
          {isMobile ? <FaTimes /> : <FaBars />}
        </button>

        {!sidebarCollapsed && !isMobile && (
          <>
            <span
              className={`font-bold text-lg ${isDark ? "text-teal-300" : "text-teal-700"}`}
            >
              My Notes
            </span>
            <button
              className={`p-2 rounded transition ${isDark ? "bg-teal-800 text-white hover:bg-teal-700" : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
              onClick={() => setShowNewFolder(true)}
              title="New Folder"
            >
              <FaPlus />
            </button>
          </>
        )}
      </div>

      {!sidebarCollapsed && (
        <div className="flex-1 overflow-auto px-2 py-2">
          <div className="mb-2 flex items-center gap-2">
            <FaSearch className={isDark ? "text-teal-300" : "text-teal-700"} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes..."
              className={`flex-1 px-2 py-1 rounded border text-sm ${isDark ? "bg-gray-800 border-teal-700 text-teal-200" : "bg-white border-teal-300 text-teal-700"}`}
            />
            {searchTerm && (
              <button
                className={`ml-1 px-2 py-1 rounded text-xs ${isDark ? "bg-gray-700 text-teal-300 hover:bg-gray-600" : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {searchTerm ? (
            <div>
              <div className="mb-2 text-xs font-semibold text-gray-500">
                {globalSearchResults.length === 0
                  ? "No notes found."
                  : `Found ${globalSearchResults.length} note${globalSearchResults.length > 1 ? "s" : ""}`}
              </div>
              <ul className="space-y-1">
                {globalSearchResults.map((note) => (
                  <li key={note.id} className="flex items-center">
                    <button
                      className={`flex-1 w-full text-left px-2 py-1 rounded transition flex items-center gap-2 ${selectedNote?.id === note.id ? (isDark ? "bg-blue-900 text-white" : "bg-blue-100 text-blue-700") : isDark ? "hover:bg-gray-800 text-teal-200" : "hover:bg-blue-50 text-blue-700"}`}
                      onClick={() => {
                        setSelectedNote(note);
                        setSelectedFolder(note.folderId);
                        if (isMobile && onMobileClose) onMobileClose();
                      }}
                    >
                      <FaFileAlt className="opacity-60" />
                      <span className="truncate">
                        {note.title || "Untitled"}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 italic">
                        {getFolderName(note.folderId)}
                      </span>
                    </button>
                    <button
                      className="ml-1 p-1 text-xs text-gray-400 hover:text-red-500"
                      onClick={() => onDeleteNote(note)}
                      title="Delete Page"
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="space-y-1">
              {folders.map((folder) => (
                <li key={folder.id} className="group flex flex-col">
                  <div className="flex items-center">
                    {editingFolder === folder.id ? (
                      <form
                        className="flex-1 flex items-center gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (renameValue.trim()) {
                            await renameFolder(folder.id, renameValue);
                          }
                          setEditingFolder(null);
                        }}
                      >
                        <input
                          className={`flex-1 px-2 py-1 rounded border text-sm ${isDark ? "bg-gray-800 border-teal-700 text-teal-200" : "bg-white border-teal-300 text-teal-700"}`}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="text-teal-500 font-bold"
                        >
                          Save
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          className={`flex-1 flex items-center gap-2 px-2 py-2 rounded transition text-left ${selectedFolder === folder.id ? (isDark ? "bg-teal-900 text-white" : "bg-teal-100 text-teal-700") : isDark ? "hover:bg-gray-800 text-teal-200" : "hover:bg-teal-50 text-teal-700"}`}
                          onClick={() => handleFolderClick(folder.id)}
                        >
                          <FaFolder className="mr-1" />
                          <span className="truncate">{folder.name}</span>
                        </button>
                        <button
                          className="ml-1 p-1 text-xs text-gray-400 hover:text-teal-500"
                          onClick={() => {
                            setEditingFolder(folder.id);
                            setRenameValue(folder.name);
                          }}
                          title="Rename"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="ml-1 p-1 text-xs text-gray-400 hover:text-red-500"
                          onClick={() => deleteFolder(folder.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="ml-1 p-1 text-xs text-gray-400 hover:text-teal-500"
                          onClick={() => onAddNoteToFolder(folder.id)}
                          title="Add Page"
                        >
                          <FaPlus />
                        </button>
                      </>
                    )}
                  </div>

                  {expandedFolders[folder.id] && notes && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {notes
                        .filter((n) => n.folderId === folder.id)
                        .map((note) => (
                          <li
                            key={`${note.id}-${folder.id}`}
                            className="flex items-center"
                          >
                            <button
                              className={`flex-1 w-full text-left px-2 py-1 rounded transition flex items-center gap-2 ${selectedNote?.id === note.id ? (isDark ? "bg-blue-900 text-white" : "bg-blue-100 text-blue-700") : isDark ? "hover:bg-gray-800 text-teal-200" : "hover:bg-blue-50 text-blue-700"}`}
                              onClick={() => {
                                setSelectedNote(note);
                                if (isMobile && onMobileClose) onMobileClose();
                              }}
                            >
                              <FaFileAlt className="opacity-60" />
                              <span className="truncate">
                                {note.title || "Untitled"}
                              </span>
                            </button>
                            <button
                              className="ml-1 p-1 text-xs text-gray-400 hover:text-red-500"
                              onClick={() => onDeleteNote(note)}
                              title="Delete Page"
                            >
                              <FaTrash />
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Footer />
        </div>
      )}

      {showNewFolder && !sidebarCollapsed && (
        <form
          className="flex items-center gap-2 mt-2 px-2 pb-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const id = await addFolder(newFolderName, currentUser?.uid);
            if (id) {
              setSelectedFolder(id);
              setNewFolderName("");
              setShowNewFolder(false);
            }
          }}
        >
          <input
            className={`flex-1 px-2 py-1 rounded border text-sm ${isDark ? "bg-gray-800 border-teal-700 text-teal-200" : "bg-white border-teal-300 text-teal-700"}`}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
          <button type="submit" className="text-teal-500 font-bold">
            Add
          </button>
          <button
            type="button"
            className={`ml-2 px-2 py-1 rounded text-xs ${isDark ? "bg-gray-700 text-teal-300 hover:bg-gray-600" : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
            onClick={() => setShowNewFolder(false)}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};

export default NotesSidebar;
