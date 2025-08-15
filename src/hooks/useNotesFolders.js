import { useEffect, useState} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// --------- FOLDERS ---------
export function useNotesFolders(ownerId) {
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    if (!ownerId) return;
    const q = query(
      collection(db, "notesFolders"),
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setFolders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [ownerId]);

  return folders;
}

export async function addFolder(name, ownerId) {
  if (!name?.trim()) return null;
  const docRef = await addDoc(collection(db, "notesFolders"), {
    name: name.trim(),
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function renameFolder(folderId, name) {
  await updateDoc(doc(db, "notesFolders", folderId), {
    name: name.trim() || "Untitled",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFolder(folderId) {
  // Delete subcollection notes first (client-side batch)
  const notesCol = collection(db, "notesFolders", folderId, "notes");
  const notesSnap = await getDocs(notesCol);
  await Promise.all(notesSnap.docs.map((n) => deleteDoc(n.ref)));
  await deleteDoc(doc(db, "notesFolders", folderId));
}

// --------- NOTES (from all folders the user owns) ---------
export function useUserNotes(ownerId) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!ownerId) {
      setNotes([]);
      return;
    }
    // Get all folders the user owns
    const foldersQ = query(
      collection(db, "notesFolders"),
      where("ownerId", "==", ownerId)
    );
    getDocs(foldersQ).then((foldersSnap) => {
      const folderIds = foldersSnap.docs.map((doc) => doc.id);
      if (folderIds.length === 0) {
        setNotes([]);
        return;
      }
      // Listen to all notes in all folders the user owns
      const allUnsubs = [];
      let allNotes = [];
      folderIds.forEach((fid) => {
        const q = query(
          collection(db, "notesFolders", fid, "notes"),
          orderBy("updatedAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
          const notesArr = snap.docs.map((d) => {
            const data = d.data();
            let content = data.content;
            if (typeof content === "string") {
              try {
                content = JSON.parse(content);
              } catch {
                content = [{ type: "paragraph", content: [] }];
              }
            }
            return { id: d.id, ...data, content, folderId: fid };
          });
          // Replace notes for this folder
          allNotes = [
            ...allNotes.filter((n) => n.folderId !== fid),
            ...notesArr,
          ];
          setNotes([...allNotes]);
        });
        allUnsubs.push(unsub);
      });
      // Cleanup
      return () => allUnsubs.forEach((u) => u());
    });
  }, [ownerId]);

  return notes;
}

export async function addEmptyNote(folderId) {
  const EMPTY_DOC = [{ type: "paragraph", content: [] }];
  const newRef = await addDoc(
    collection(db, "notesFolders", folderId, "notes"),
    {
      title: "Untitled",
      coverUrl: "",
      content: JSON.stringify(EMPTY_DOC),
      folderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );
  return {
    id: newRef.id,
    title: "Untitled",
    coverUrl: "",
    content: EMPTY_DOC,
    folderId,
  };
}

export async function deleteNote(note) {
  await deleteDoc(doc(db, "notesFolders", note.folderId, "notes", note.id));
}
