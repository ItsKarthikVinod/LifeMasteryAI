import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const useGetJournalEntries = () => {
  const [journalEntries, setFetchedJournalEntries] = useState([]); // State to store journal entries
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(null); // State to track errors
  const db = getFirestore();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    const journalEntriesRef = collection(db, "journalEntries");
    const q = query(journalEntriesRef, where("userId", "==", user.uid));

    // Set up Firestore listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const journalEntriesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFetchedJournalEntries(journalEntriesData); // Update state with real-time data
        setLoading(false); // Set loading to false after data is fetched
      },
      (err) => {
        console.error("Error fetching journal entries in real-time:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [db]);

  const deleteJournalEntry = async (id) => {
    try {
      const journalRef = doc(db, "journalEntries", id);
      await deleteDoc(journalRef);
    } catch (error) {
      console.error("Error deleting journal: ", error);
    }
  };

  return { journalEntries, loading, error, deleteJournalEntry };
};

export default useGetJournalEntries;
