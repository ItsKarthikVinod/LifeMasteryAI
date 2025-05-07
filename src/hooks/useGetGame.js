import { useEffect, useState } from "react";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";

function useGetGame() {
  // Function to calculate the XP required for the next level
  const xpToNextLevel = (level) => level * 100;

  const awardXP = async (userId, points) => {
    try {
      // Reference the user's gamification document
      const gamificationRef = doc(db, "gamification", userId);
      const gamificationDoc = await getDoc(gamificationRef);

      if (!gamificationDoc.exists()) {
        console.error("Gamification data not found for user:", userId);
        // Create a new gamification document for the user
        await setDoc(gamificationRef, {
          totalXP: 0,
          level: 1,
          remainingXP: 100, // XP required for level 2
          userId: userId,
        });
      }

      const gamificationData = (await getDoc(gamificationRef)).data();
      let { totalXP, level, remainingXP } = gamificationData;

      // Add the awarded XP
      totalXP += points;
      remainingXP -= points;

      console.log(
        `Current XP: ${totalXP}, Level: ${level}, Remaining XP: ${remainingXP}`
      );

      // Check if the user levels up
      while (remainingXP <= 0) {
        level += 1; // Level up
        remainingXP += xpToNextLevel(level); // Add XP required for the next level
      }

      // Handle leveling down
      while (remainingXP > xpToNextLevel(level)) {
        remainingXP -= xpToNextLevel(level); // Subtract XP for the current level
        level -= 1; // Level down
      }

      // Update the gamification document
      await setDoc(gamificationRef, {
        totalXP,
        level,
        remainingXP,
        userId,
      });

      console.log(`Awarded ${points} XP to user: ${userId}`);
    } catch (error) {
      console.error("Error awarding XP:", error);
    }
  };

  // State to store gamification data
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("User not logged in. Please log in to access gamification data.");
      setLoading(false);
      return;
    }

    const gamificationRef = doc(db, "gamification", user.uid);

    // Set up Firestore listener for real-time updates
    const unsubscribe = onSnapshot(
      gamificationRef,
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          setGamificationData(docSnapshot.data());
        } else {
          console.log(
            "Gamification data not found. Creating a new document..."
          );
          await setDoc(gamificationRef, {
            totalXP: 0,
            level: 1,
            remainingXP: 100,
            userId: user.uid,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching gamification data in real-time:", error);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  return { xpToNextLevel, awardXP, gamificationData, loading };
}

export default useGetGame;
