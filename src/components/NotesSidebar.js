import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFileAlt,
  FaBars,
  FaSearch,
} from "react-icons/fa";
import { useAuth } from "../contexts/authContext";
import {
  useNotesFolders,
  addFolder,
  renameFolder,
  deleteFolder,
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
      setExpandedFolders((prev) => ({
        ...prev,
        [selectedFolder]: true,
      }));
    }
  }, [selectedFolder, folders.length]);

  // Helper to get folder name by id
  const getFolderName = (folderId) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder ? folder.name : "Unknown Folder";
  };

  // Search notes globally by title/content, across all folders the user owns
  const globalSearchResults = searchTerm
    ? notes.filter(
        (n) =>
          n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof n.content === "string"
            ? n.content.toLowerCase().includes(searchTerm.toLowerCase())
            : JSON.stringify(n.content)
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleFolderClick = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: true,
    }));
    setSelectedFolder(folderId);
    // Select first note in folder if exists
    const folderNotes = notes.filter((n) => n.folderId === folderId);
    setSelectedNote(folderNotes.length > 0 ? folderNotes[0] : null);
  };

  // Visual onboarding for first folder/note
  if (folders.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full w-full ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div
          className={`rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 ${
            isDark ? "bg-gray-800 text-teal-200" : "bg-teal-50 text-teal-700"
          }`}
        >
          <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
          <p className="text-lg mb-4 text-center">
            Create your first folder to get started.
          </p>
          <form
            className="flex items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newFolderName.trim()) return;
              await addFolder(newFolderName.trim(), currentUser?.uid);
              setNewFolderName("");
            }}
          >
            <input
              className={`flex-1 px-2 py-2 rounded border text-lg ${
                isDark
                  ? "bg-gray-800 border-teal-700 text-teal-200"
                  : "bg-white border-teal-300 text-teal-700"
              }`}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
            />
            <button
              type="submit"
              className={`px-4 py-2 rounded font-bold text-lg ${
                isDark
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }`}
            >
              Create
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${
        sidebarCollapsed ? "w-12 min-w-[3rem]" : "w-72 min-w-[16rem]"
      } h-full flex flex-col border-r ${
        isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
      }`}
      style={{ overflow: "hidden" }}
    >
      {/* Collapse/Expand */}
      <div className="flex items-center justify-between px-2 py-2 border-b sticky top-0 z-10">
        <button
          className={`p-2 rounded transition ${
            isDark
              ? "bg-gray-800 text-teal-300 hover:bg-gray-700"
              : "bg-teal-50 text-teal-700 hover:bg-teal-100"
          }`}
          onClick={() => setSidebarCollapsed((c) => !c)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FaBars />
        </button>
        {!sidebarCollapsed && (
          <>
            <span
              className={`font-bold text-lg ${
                isDark ? "text-teal-300" : "text-teal-700"
              }`}
            >
              My Notes
            </span>
            <button
              className={`p-2 rounded transition ${
                isDark
                  ? "bg-teal-800 text-white hover:bg-teal-700"
                  : "bg-teal-100 text-teal-700 hover:bg-teal-200"
              }`}
              onClick={() => setShowNewFolder(true)}
              title="New Folder"
            >
              <FaPlus />
            </button>
          </>
        )}
      </div>

      <div
        className={`flex-1 overflow-y-auto px-2 py-2 ${
          sidebarCollapsed ? "hidden" : ""
        }`}
      >
        {/* Search bar */}
        <div className="mb-2 flex items-center gap-2">
          <FaSearch className={isDark ? "text-teal-300" : "text-teal-700"} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className={`flex-1 px-2 py-1 rounded border text-sm ${
              isDark
                ? "bg-gray-800 border-teal-700 text-teal-200"
                : "bg-white border-teal-300 text-teal-700"
            }`}
          />
          {searchTerm && (
            <button
              className={`ml-1 px-2 py-1 rounded text-xs ${
                isDark
                  ? "bg-gray-700 text-teal-300 hover:bg-gray-600"
                  : "bg-teal-100 text-teal-700 hover:bg-teal-200"
              }`}
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        {/* Show search results if searching */}
        {searchTerm ? (
          <div>
            <div className="mb-2 text-xs font-semibold text-gray-500">
              {globalSearchResults.length === 0
                ? "No notes found."
                : `Found ${globalSearchResults.length} note${
                    globalSearchResults.length > 1 ? "s" : ""
                  }`}
            </div>
            <ul className="space-y-1">
              {globalSearchResults.map((note) => (
                <li key={note.id} className="flex items-center">
                  <button
                    className={`flex-1 w-full text-left px-2 py-1 rounded transition flex items-center gap-2 ${
                      selectedNote?.id === note.id
                        ? isDark
                          ? "bg-blue-900 text-white"
                          : "bg-blue-100 text-blue-700"
                        : isDark
                        ? "hover:bg-gray-800 text-teal-200"
                        : "hover:bg-blue-50 text-blue-700"
                    }`}
                    onClick={() => {
                      setSelectedFolder(note.folderId);
                      setSelectedNote(note);
                    }}
                  >
                    <FaFileAlt className="opacity-60" />
                    <span className="truncate">{note.title || "Untitled"}</span>
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
                  {/* Folder button / rename */}
                  {editingFolder === folder.id ? (
                    <form
                      className="flex-1 flex items-center gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await renameFolder(folder.id, renameValue);
                        setEditingFolder(null);
                      }}
                    >
                      <input
                        className={`flex-1 px-2 py-1 rounded border text-sm ${
                          isDark
                            ? "bg-gray-800 border-teal-700 text-teal-200"
                            : "bg-white border-teal-300 text-teal-700"
                        }`}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="text-teal-500 font-bold">
                        Save
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        className={`flex-1 flex items-center gap-2 px-2 py-2 rounded transition text-left ${
                          selectedFolder === folder.id
                            ? isDark
                              ? "bg-teal-900 text-white"
                              : "bg-teal-100 text-teal-700"
                            : isDark
                            ? "hover:bg-gray-800 text-teal-200"
                            : "hover:bg-teal-50 text-teal-700"
                        }`}
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

                {/* Notes list */}
                {expandedFolders[folder.id] && notes && (
                  <ul className="ml-6 mt-1 space-y-1">
                    {notes
                      .filter((n) => n.folderId === folder.id)
                      .map((note) => (
                        <li key={note.id + folder.id} className="flex items-center">
                          <button
                            className={`flex-1 w-full text-left px-2 py-1 rounded transition flex items-center gap-2 ${
                              selectedNote?.id === note.id
                                ? isDark
                                  ? "bg-blue-900 text-white"
                                  : "bg-blue-100 text-blue-700"
                                : isDark
                                ? "hover:bg-gray-800 text-teal-200"
                                : "hover:bg-blue-50 text-blue-700"
                            }`}
                            onClick={() => setSelectedNote(note)}
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

        {/* New Folder Modal */}
        {showNewFolder && (
          <form
            className="flex items-center gap-2 mt-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newFolderName.trim()) return;
              await addFolder(newFolderName.trim(), currentUser?.uid);
              setNewFolderName("");
              setShowNewFolder(false);
            }}
          >
            <input
              className={`flex-1 px-2 py-1 rounded border text-sm ${
                isDark
                  ? "bg-gray-800 border-teal-700 text-teal-200"
                  : "bg-white border-teal-300 text-teal-700"
              }`}
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
              className={`ml-2 px-2 py-1 rounded text-xs ${
                isDark
                  ? "bg-gray-700 text-teal-300 hover:bg-gray-600"
                  : "bg-teal-100 text-teal-700 hover:bg-teal-200"
              }`}
              onClick={() => setShowNewFolder(false)}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
export default NotesSidebar;