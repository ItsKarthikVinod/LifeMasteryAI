import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function sendNotification(userId, text, type = "info") {
  await addDoc(collection(db, "notifications"), {
    userId,
    text,
    read: false,
    timestamp: serverTimestamp(),
    type,
  });
}
