import { getFirestore, doc, updateDoc } from "firebase/firestore";

const db = getFirestore();

export const useInactivity = async (userId) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    lastActiveAt: new Date().toISOString(),
  });
};
