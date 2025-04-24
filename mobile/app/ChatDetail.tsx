import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Image} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { firestore } from "../_utlis/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  startAfter,
  limit,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

type Message = {
    id: string;
    content: string;
    senderId: number;
    timestamp: { toMillis: () => number }; // Firestore Timestamp
    system?: boolean;
  };

export default function ChatDetail() {
  const { conversationId, username, profilePicture } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchUser = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
      const parsed = userInfo ? JSON.parse(userInfo) : null;
      setCurrentUserId(parsed?.id || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    loadInitialMessages();

    // Real-time listener for new messages
    const q = query(
      collection(firestore, `conversations/${conversationId}/messages`),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const latest = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Message[];
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
  }, [conversationId]);

  const loadInitialMessages = async () => {
    const ref = collection(firestore, `conversations/${conversationId}/messages`);
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

    const ref = collection(firestore, `conversations/${conversationId}/messages`);
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


  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const messageText = newMessage.trim();

    await addDoc(collection(firestore, `conversations/${conversationId}/messages`), {
    content: messageText,
    senderId: currentUserId,
    timestamp: serverTimestamp(),
    system: false,
    });

// 🔥 Update parent conversation doc
    await updateDoc(doc(firestore, "conversations", conversationId as string), {
    lastMessage: messageText,
    lastSenderId: Number(currentUserId),
    lastUpdated: serverTimestamp(),
    });

    setNewMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={80}
    >
        <View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
    <Text style={styles.backText}>←</Text>
  </TouchableOpacity>
  <Text style={styles.usernameText} numberOfLines={1}>
    {username}
  </Text>
  <Image
    source={profilePicture ? { uri: profilePicture } : require("../assets/images/avatar-placeholder.png")}
    style={styles.avatar}
  />
</View>
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
                  Loading more messages
                </Text>
              </View>
            ) : null
          }
        renderItem={({ item }) => {
        const isMe = item.senderId === currentUserId;
        return (
            <View style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
              <View style={[styles.message, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, { color: isMe ? "#fff" : "#000" }]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message"
          value={newMessage}
          onChangeText={setNewMessage}
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
    marginBottom:10,
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
  
  backButton: {
    padding: 4,
  },
  
  backText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#007AFF",
  },
  
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
  messageText: {
    fontSize: 16,
  }
});
