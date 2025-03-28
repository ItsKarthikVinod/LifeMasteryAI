import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const useGetHabits = () => {
  const [goalss, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGoals = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not logged in");
      }

      const db = getFirestore();
      const goalsRef = collection(db, "goals");
      const q = query(goalsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const goalsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setGoals(goalsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return { goalss, loading, error, fetchGoals };
};

export default useGetHabits;
