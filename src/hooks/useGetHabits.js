import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const useGetHabits = () => {
  const [fetchedHabits, setFetchedHabits] = useState([]); // State to store habits
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(null); // State to track errors

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const habitsRef = collection(db, "habits");
    const q = query(habitsRef, where("userId", "==", user.uid));

    // Set up Firestore listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const habitsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFetchedHabits(habitsData); // Update state with real-time data
        setLoading(false); // Set loading to false after data is fetched
      },
      (err) => {
        console.error("Error fetching habits in real-time:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  return { fetchedHabits, loading, error };
};

export default useGetHabits;
