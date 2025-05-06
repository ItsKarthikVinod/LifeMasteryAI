import { useEffect, useState } from "react";
import {
  doc,
  setDoc,
  getDoc,
 
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";

function useGetGame() {
  // Function to calculate the user's level based on XP
  const calculateLevel = (xp) => Math.floor((xp - 100) / 150); 

  // Function to calculate the XP required for the next level
  const xpToNextLevel = (level) => 100 + level * 150;

  // Function to award XP to a user
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
          xpToNextLevel: xpToNextLevel(1),
          userId: userId,
        });
      }

      const gamificationData = (await getDoc(gamificationRef)).data();
      const newXP = gamificationData.totalXP + points;
      const newLevel = calculateLevel(newXP);

      const remainingXP =
        newLevel === 1
          ? xpToNextLevel(newLevel) - newXP
          : xpToNextLevel(newLevel) - (newXP - xpToNextLevel(newLevel - 1));

      // Update the gamification document with the new XP and level
      await setDoc(gamificationRef, {
        totalXP: newXP,
        level: newLevel,
        xpToNextLevel: remainingXP,
        userId: userId,
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
            xpToNextLevel: xpToNextLevel(1),
            userId: user.uid,
          });
          }
          setLoading(false);
        },
        (error) => {
          console.error(
            "Error fetching gamification data in real-time:",
            error
          );
          setLoading(false);
        }
      );

      // Cleanup listener on component unmount
      return () => unsubscribe();
    }, []);

  return { calculateLevel, xpToNextLevel, awardXP, gamificationData, loading };
}

export default useGetGame;
