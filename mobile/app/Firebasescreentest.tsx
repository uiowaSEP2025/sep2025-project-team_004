// Replace with your actual component file
import { useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "../_utlis/firebaseConfig";

export default function FirestoreTest() {
  useEffect(() => {
    const q = query(
      collection(firestore, "conversations"),
      where("members", "array-contains", 55)
    );

    const unsub = onSnapshot(q, (snap) => {
      console.log("🔥 Snapshot size:", snap.size);
      snap.docs.forEach((doc) => console.log("📄", doc.id, doc.data()));
    });

    return () => unsub();
  }, []);

  return null;
}