import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const useGetGoals = () => {
  const [goalss, setGoals] = useState([]); // State to store goals
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
    const goalsRef = collection(db, "goals");
    const q = query(goalsRef, where("userId", "==", user.uid));

    // Set up Firestore listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const goalsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGoals(goalsData); // Update state with real-time data
        setLoading(false); // Set loading to false after data is fetched
      },
      (err) => {
        console.error("Error fetching goals in real-time:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  return { goalss, loading, error };
};

export default useGetGoals;
