import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Animated,
  KeyboardAvoidingView, Platform, StyleSheet, Image, Dimensions
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { firestore } from "../_utlis/firebaseConfig";
import {
  collection, query, orderBy, onSnapshot, arrayRemove, deleteDoc,
  addDoc, serverTimestamp, updateDoc, doc, getDocs, setDoc, arrayUnion, limit, startAfter
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Message = {
  id: string;
  content: string;
  senderId: number;
  timestamp: { toMillis: () => number }; // Firestore Timestamp
  system?: boolean;
};

export default function GroupChatDetail() {
  const { groupId, groupName, groupImage, friends } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false); 
  const [members, setMembers] = useState<any[]>([]); 
  const [groupAdminId, setGroupAdminId] = useState<number | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addableFriends, setAddableFriends] = useState<any[]>([]);
  const sidebarAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const flatListRef = useRef<FlatList>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const PAGE_SIZE = 20;
  const router = useRouter();
  

  useEffect(() => {
    const fetchUser = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
      const parsed = userInfo ? JSON.parse(userInfo) : null;
      setCurrentUserId(parsed?.id || null);
      setUserName(parsed?.username || null)
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!groupId || !currentUserId) return;
  
    const q = collection(firestore, `groupChats/${groupId}/typingStatus`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const othersTyping = snapshot.docs
          .filter(
          (doc) =>
            String(doc.id) !== String(currentUserId) &&
            doc.data()?.typing &&
            doc.data()?.username
  )
  .map((doc) => doc.data().username);
  
      setTypingUsers(othersTyping);
    });
  
    return () => unsubscribe();
  }, [groupId, currentUserId]);

  useEffect(() => {
    if (!groupId) return;
    loadInitialMessages();
  
    // Real-time listener for new messages
    const q = query(
      collection(firestore, `groupChats/${groupId}/messages`),
      orderBy("timestamp", "desc"),
      limit(1)
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const latest = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
    
      if (latest.length && latest[0].timestamp?.toMillis()) {
        setMessages((prev) => {
          if (!prev.length || prev[0].id !== latest[0].id) {
            return [latest[0], ...prev];
          }
          return prev;
        });
      }
    });
  
    return () => unsubscribe();
  }, [groupId]);

  const fetchMembers = async () => {
    const snapshot = await getDocs(collection(firestore, `groupChats/${groupId}/members`));
    const membersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), })); setMembers(membersList);
    const groupDoc = await (await getDocs(query(collection(firestore, "groupChats")))).docs.find(doc => doc.id === groupId);
    setGroupAdminId(groupDoc?.data()?.adminId ?? null);
    };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const loadInitialMessages = async () => {
    const ref = collection(firestore, `groupChats/${groupId}/messages`);
    const q = query(ref, orderBy("timestamp", "desc"), limit(PAGE_SIZE));
    const snap = await getDocs(q);
    const fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
    setMessages(fetched);
    setLastVisible(snap.docs[snap.docs.length - 1]);
    setHasMore(snap.docs.length === PAGE_SIZE);
  };
  
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !lastVisible) return;
    setLoadingMore(true);
  
    const ref = collection(firestore, `groupChats/${groupId}/messages`);
    const q = query(
      ref,
      orderBy("timestamp", "desc"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );
  
    const snap = await getDocs(q);
    const older = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
    setMessages((prev) => [...prev, ...older]);
    setLastVisible(snap.docs[snap.docs.length - 1]);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const toggleSidebar = () => { setSidebarVisible((prev) => !prev); Animated.timing(sidebarAnim, { toValue: sidebarVisible ? SCREEN_WIDTH : SCREEN_WIDTH * 0.3, duration: 250, useNativeDriver: false, }).start(); };


  const handleKickMember = async (memberId: number) => {
    if (Number(currentUserId) !== groupAdminId || Number(currentUserId) === Number(memberId)) return;
  
    const groupRef = doc(firestore, "groupChats", groupId as string);
    const memberRef = doc(firestore, `groupChats/${groupId}/members/${memberId}`);
  
    // Get kicked user's username (from state)
    const kickedUser = members.find((m) => m.id === String(memberId));
    const kickerUser = members.find((m) => m.id === String(currentUserId));
    const kickedUsername = kickedUser?.username || `User ${memberId}`;
    const kickerUsername = kickerUser?.username || `User ${currentUserId}`;
  
    // 1. Delete from members subcollection
    await deleteDoc(memberRef);
  
    // 2. Remove from members array
    await updateDoc(groupRef, {
      members: arrayRemove(Number(memberId)),
    });
  
    // 3. Send system message
    await addDoc(collection(firestore, `groupChats/${groupId}/messages`), {
      content: `${kickerUsername} has kicked ${kickedUsername} out of the group`,
      senderId: Number(currentUserId),
      system: true,
      timestamp: serverTimestamp(),
    });
  
    // 4. Refresh members
    await fetchMembers();
  };

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

const handleTyping = (text: string) => {
  setNewMessage(text);

  if (!currentUserId || !groupId) return;

  const typingRef = doc(firestore, `groupChats/${groupId}/typingStatus/${currentUserId}`);

  // Set typing to true
  setDoc(typingRef, {
    username: userName, // you may store this in state already
    typing: true,
    timestamp: serverTimestamp(),
  });

  // Clear typing after 3s of inactivity
  if (typingTimeout.current) clearTimeout(typingTimeout.current);
  typingTimeout.current = setTimeout(() => {
    setDoc(typingRef, { typing: false }, { merge: true });
  }, 3000);
};

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const trimmed = newMessage.trim();

    await addDoc(collection(firestore, `groupChats/${groupId}/messages`), {
      content: trimmed,
      senderId: Number(currentUserId),
      timestamp: serverTimestamp(),
      system: false,
    });

    await updateDoc(doc(firestore, "groupChats", groupId as string), {
      lastMessage: trimmed,
      lastUpdated: serverTimestamp(),
    });

    setNewMessage("");
  };

  const handleAddMember = async (friend: any) => {
    await setDoc(
      doc(firestore, `groupChats/${groupId}/members/${friend.id}`),
      { username: friend.username }
    );

    const groupRef = doc(firestore, "groupChats", groupId as string);
    await updateDoc(groupRef, {
    membersArray: arrayUnion(friend.id),
  });

    const adderUsername = members.find((m) => m.id === String(currentUserId))?.username || `User ${currentUserId}`;
    const addedUsername = friend.username || `User ${friend.id}`;
    await addDoc(collection(firestore, `groupChats/${groupId}/messages`), {
        content: `${adderUsername} added ${addedUsername} to the group`,
        senderId: Number(currentUserId),
        system: true,
        timestamp: serverTimestamp(),
    });
    setShowAddMembers(false);
    await fetchMembers();
  };

  const isFriend = (userId: number) => { 
    try { const friendIds = JSON.parse(friends as string)?.map((f: any) => f.id); 
        return friendIds.includes(userId); 
    } 
    catch { return false; } };

    useEffect(() => {
        try {
          const friendList = JSON.parse(friends as string);
          const filtered = friendList.filter((friend: any) =>
            !members.some((m) => m.id === String(friend.id))
          );          
          setAddableFriends(filtered);
        } catch (e) {
          console.error("❌ Error parsing friends:", e);
          setAddableFriends([]);
        }
      }, [friends, members]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.usernameText} numberOfLines={1}>
          {groupName}
        </Text>
        <TouchableOpacity onPress={toggleSidebar}>
            <Image
                source={groupImage ? { uri: groupImage } : require("../assets/images/avatar-placeholder.png")}
                style={styles.avatar}
            />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        inverted
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ marginVertical: 10 }}>
              <Text style={{ textAlign: "center", color: "#888" }}>
                Loading more messages...
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
            const isSystem = item.system;
            const isMe = item.senderId === Number(currentUserId);
          
            if (isSystem) {
              return (
                <View style={styles.systemMessageContainer}>
                  <Text style={styles.systemMessageText}>{item.content}</Text>
                </View>
              );
            }
          
            const sender = members.find((m) => m.id === String(item.senderId));
            const senderName = sender?.username || `User ${item.senderId}`;
          
            return (
              <View style={{ alignSelf: isMe ? "flex-end" : "flex-start", marginBottom: 6 }}>
                {!isMe && (
                  <Text style={styles.senderName}>{senderName}</Text>
                )}
                <View style={[styles.message, isMe ? styles.myMessage : styles.theirMessage]}>
                  <Text style={[styles.messageText, { color: isMe ? "#fff" : "#000" }]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
      />

<Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
  <Image
    source={groupImage ? { uri: groupImage } : require("../assets/images/avatar-placeholder.png")}
    style={styles.sidebarAvatar}
  />
  <Text style={styles.sidebarTitle}>{groupName}</Text>

  <Text style={styles.sectionTitle}>Members</Text>
  {members.map((member) => (
    <View key={member.id} style={styles.memberRow}>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: "400" }}>{member.username || `User ${member.id}`}</Text>
      {!isFriend(Number(member.id)) && Number(member.id) !== Number(currentUserId) &&  (
        <TouchableOpacity style={styles.addFriendBtn}>
          <Text style={{ color: "#007AFF" }}>Add Friend</Text>
          
        </TouchableOpacity>
      )}
      <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 4 }} />
      {Number(currentUserId) === groupAdminId && Number(currentUserId) !== Number(member.id) && (
        <TouchableOpacity style={styles.kickBtn} onPress={() => handleKickMember(member.id)}>
          <Text style={{ color: "red" }}>Kick</Text>
        </TouchableOpacity>
        
      )}
    </View>
  ))}
    <TouchableOpacity onPress={() => setShowAddMembers((prev) => !prev)}>
  <Text style={{ fontWeight: "bold", marginVertical: 10 }}>+ Add Members</Text>
</TouchableOpacity>
<View style={{ height: 1, backgroundColor: "#eee", marginVertical: 4 }} />

{showAddMembers && addableFriends.map((friend: any) => (
  <TouchableOpacity
    key={friend.id}
    style={{ marginVertical: 10 }}
    onPress={() => handleAddMember(friend)}
  >
    <Text style={{ fontSize: 16, fontWeight: "400" }}>{friend.username}</Text>
    <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 4 }} />
  </TouchableOpacity>
))}
  <TouchableOpacity style={styles.leaveGroupBtn}>
    <Text style={{ color: "#007AFF", fontWeight: "bold" }}>Leave Group</Text>
  </TouchableOpacity>
</Animated.View>

{sidebarVisible && (
  <TouchableOpacity
    style={styles.overlay}
    activeOpacity={1}
    onPress={toggleSidebar}
  />
)}

{typingUsers.length > 0 && (
  <Text style={{ color: "#888", marginLeft: 16, marginBottom: 4 }}>
    {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
  </Text>
)}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message"
          value={newMessage}
          onChangeText={handleTyping}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  message: {
    borderRadius: 16,
    marginVertical: 4,
    padding: 10,
    maxWidth: "75%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e5ea",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
    marginTop: 70,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 18, fontWeight: "500", color: "#007AFF" },
  usernameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ccc",
  },
  messageText: { fontSize: 16 },

  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderColor: "#ccc",
    padding: 16,
    zIndex: 1001,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  sidebarAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 16,
    marginTop: 70,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  addFriendBtn: {
    marginLeft: 8,
  },
  kickBtn: {
    marginLeft: 8,
  },
  leaveGroupBtn: {
    marginTop: 20,
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1000,
  },
  systemMessageContainer: {
    alignSelf: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  systemMessageText: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
  senderName: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
    marginLeft: 4,
    fontWeight: "500",
  },
});
