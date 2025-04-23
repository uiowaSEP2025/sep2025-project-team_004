import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { firestore } from "../_utlis/firebaseConfig";
import { useEffect, useState } from "react";

type InboxItem = {
  id: string;
  type: "dm" | "group";
  name: string;
  profilePicture: string;
  lastMessage: string;
  lastUpdated: string;
};

export const useInbox = (currentUserId: number | null) => {
  const [inbox, setInbox] = useState<InboxItem[]>([]);

  useEffect(() => {
    if (!currentUserId) return;
    const numericId = Number(currentUserId);

    const dmQuery = query(
      collection(firestore, "conversations"),
      where("members", "array-contains", numericId)
    );

    const groupQuery = query(
      collection(firestore, "groupChats"),
      where("members", "array-contains", numericId)
    );

    const unsubscribeDMs = onSnapshot(dmQuery, async (snapshot) => {
      const enrichedDMs = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const otherId = data.members.find((id: number) => id !== numericId);

        const userDoc = await getDoc(doc(firestore, "users", otherId.toString()));
        console.log("📦 Fetching user doc from Firestore for ID:", otherId.toString());
        const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown", profilePicture: "" };


            return {
          id: docSnap.id,
          type: "dm" as const,
          name: userData.username,
          profilePicture: userData.profilePicture,
          lastMessage: data.lastMessage,
          lastUpdated: data.lastUpdated?.toDate().toISOString() || new Date().toISOString(),
        };
      }));

      setInbox((prev) =>
        mergeAndSort([...prev.filter(i => i.type !== "dm"), ...enrichedDMs])
      );
    });

    const unsubscribeGroups = onSnapshot(groupQuery, (snapshot) => {
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: "group" as const,
        name: doc.data().name,
        profilePicture: "", // Add group profile picture support if needed
        lastMessage: doc.data().lastMessage,
        lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || new Date().toISOString(),
      }));
      setInbox((prev) =>
        mergeAndSort([...prev.filter(i => i.type !== "group"), ...groups])
      );
    });

    return () => {
      unsubscribeDMs();
      unsubscribeGroups();
    };
  }, [currentUserId]);

  return inbox;
};

function mergeAndSort(items: InboxItem[]): InboxItem[] {
  return items.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
}
