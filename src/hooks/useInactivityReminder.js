import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/authContext";

export function useInactivityReminder() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    let lastActive = Date.now();

    const updateActivity = async () => {
      lastActive = Date.now();
      if (currentUser && window.OneSignal) {
        const playerId = await window.OneSignal.getUserId();
        if (playerId) {
          await setDoc(
            doc(db, "userActivity", currentUser.uid),
            {
              playerId,
              lastActive: Date.now(),
              pomodoroStatus:
                localStorage.getItem("pomodoroStatus") || "stopped",
              email: currentUser.email,
            },
            { merge: true }
          );
        }
      }
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("touchstart", updateActivity);

    // ...rest of your inactivity logic...

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
    };
  }, [currentUser]);
}
