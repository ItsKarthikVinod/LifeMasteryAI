import React, { useEffect, useState } from "react";
import NotesSidebar from "../components/NotesSidebar";
import NotesEditor from "../components/NotesEditor";
import { useAuth } from "../contexts/authContext";
import {
  useNotesFolders,
  useUserNotes,
  addFolder,
  addEmptyNote,
  deleteNote,
} from "../hooks/useNotesFolders";

const NotesPage = () => {
  const { theme, currentUser } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const folders = useNotesFolders(currentUser?.uid);
  const notesFromFirestore = useUserNotes(currentUser?.uid);
  const [notesLocal, setNotesLocal] = useState([]);

  const isDark = theme === "dark";

  

  // Sync local notes with Firestore notes
  useEffect(() => {
    setNotesLocal(notesFromFirestore);
  }, [notesFromFirestore]);

  // When folder changes, select the first note in that folder (if any)
  useEffect(() => {
    if (selectedFolder) {
      const folderNotes = notesLocal.filter(
        (n) => n.folderId === selectedFolder
      );
      if (folderNotes.length > 0) {
        setSelectedNote(folderNotes[0]);
      } else {
        setSelectedNote(null);
      }
    } else {
      setSelectedNote(null);
    }
  }, [selectedFolder, notesLocal]);

  // Add a new note and select it immediately (only if folder exists)
  const handleAddNoteToFolder = async (folderId) => {
    if (!folders.find((f) => f.id === folderId)) return;
    const note = await addEmptyNote(folderId);
    setSelectedFolder(folderId);
    setSelectedNote(note);
    setNotesLocal((prev) =>
      prev.some((n) => n.id === note.id) ? prev : [...prev, note]
    ); // Optimistically add note, avoid duplicates
  };

  const handleDeleteNote = async (note) => {
    if (!note) return;
    await deleteNote(note);
    setSelectedNote(null);
    setNotesLocal((prev) => prev.filter((n) => n.id !== note.id));
  };

  // Add first folder
  const handleCreateFirstFolder = async () => {
    const folderId = await addFolder("My First Folder", currentUser?.uid);
    setSelectedFolder(folderId);
    setSelectedNote(null);
  };

  // Add first note in selected folder
  const handleCreateFirstNote = async () => {
    if (!selectedFolder) return;
    const note = await addEmptyNote(selectedFolder);
    setSelectedNote(note);
    setNotesLocal((prev) =>
      prev.some((n) => n.id === note.id) ? prev : [...prev, note]
    );
  };

  // Handle note rename (called from NotesEditor)
  const handleNoteRename = (noteId, newTitle) => {
    setNotesLocal((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, title: newTitle } : n))
    );
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, title: newTitle });
    }
  };

  // If there are no folders, show onboarding card
  if (folders.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div
          className={`rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 ${
            isDark ? "bg-gray-800 text-teal-200" : "bg-teal-50 text-teal-700"
          }`}
        >
          <h1 className="text-2xl font-bold mb-2">Welcome to Notes!</h1>
          <p className="text-lg mb-4 text-center">
            Start by creating your first folder.
          </p>
          <button
            className={`px-6 py-3 rounded-xl font-bold text-lg transition ${
              isDark
                ? "bg-teal-700 text-white hover:bg-teal-800"
                : "bg-teal-500 text-white hover:bg-teal-600"
            }`}
            onClick={handleCreateFirstFolder}
          >
            Create Folder
          </button>
        </div>
      </div>
    );
  }

  // If folder selected but no notes, show onboarding card for note
  if (
    selectedFolder &&
    notesLocal.filter((n) => n.folderId === selectedFolder).length === 0 &&
    !selectedNote
  ) {
    const folder = folders.find((f) => f.id === selectedFolder);
    return (
      <div
        className={`flex items-center justify-center h-screen ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div
          className={`rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 ${
            isDark ? "bg-gray-800 text-teal-200" : "bg-teal-50 text-teal-700"
          }`}
        >
          <h1 className="text-2xl font-bold mb-2">
            {folder?.name || "Folder"}
          </h1>
          <p className="text-lg mb-4 text-center">
            This folder is empty. Create your first note!
          </p>
          <button
            className={`px-6 py-3 rounded-xl font-bold text-lg transition ${
              isDark
                ? "bg-teal-700 text-white hover:bg-teal-800"
                : "bg-teal-500 text-white hover:bg-teal-600"
            }`}
            onClick={handleCreateFirstNote}
          >
            Create Note
          </button>
        </div>
      </div>
    );
  }

  // Normal layout
  return (
    <div
      className={`flex flex-col md:flex-row h-screen md:h-[calc(100vh-4rem)] pt-32 sm:pt-36 ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}
      style={{ minHeight: "100vh" }}
    >
      <div className="w-full md:w-auto">
        <NotesSidebar
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          selectedNote={selectedNote}
          setSelectedNote={setSelectedNote}
          notes={notesLocal}
          onAddNoteToFolder={handleAddNoteToFolder}
          onDeleteNote={handleDeleteNote}
          theme={theme}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
      </div>
      <div className="flex-1 h-full w-full overflow-auto">
        {selectedFolder && selectedNote ? (
          <NotesEditor
            folderId={selectedFolder}
            theme={theme}
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            folders={folders}
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
            onNoteRename={handleNoteRename} // Pass to editor
          />
        ) : (
          <div
            className={`text-gray-400 text-xl text-center mt-32 px-4 ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            Select a folder and a note to view or create notes.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
