import { firestore } from "../../_utlis/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export const getOrCreateDM = async (currentUserId: number, friendId: number) => {
  const sortedIds = [currentUserId, friendId].sort(); // ensure consistent order
  const conversationsRef = collection(firestore, "conversations");

  // 1. Query for existing DM with both members
  const q = query(conversationsRef, where("members", "==", sortedIds));
  const existing = await getDocs(q);

  if (!existing.empty) {
    return existing.docs[0].id; // ✅ Found existing DM
  }

  // 2. No existing DM found, create one
  const newDoc = await addDoc(conversationsRef, {
    members: sortedIds,
    lastMessage: "",
    lastUpdated: serverTimestamp(),
    lastSenderId: null,
  });

  return newDoc.id;
};