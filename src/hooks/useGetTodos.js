import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const useGetTodos = () => {
  const [todoss, setTodoss] = useState([]); // State to store todos
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(null); // State to track errors

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("No user is logged in");
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const todosRef = collection(db, "todos");
    const q = query(todosRef, where("userId", "==", user.uid));

    // Set up Firestore listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userTodos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTodoss(userTodos); // Update state with real-time data
        setLoading(false); // Set loading to false after data is fetched
      },
      (err) => {
        console.error("Error fetching todos in real-time:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  return { todoss, loading, error };
};

export default useGetTodos;
