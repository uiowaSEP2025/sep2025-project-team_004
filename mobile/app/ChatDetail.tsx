import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMessages, sendMessage } from "./api/messages";
import { useRouter } from "expo-router";


export default function ChatDetail() {
  const router = useRouter();
  const route = useRoute();
  const { userId, username } = route.params as { userId: number; username: string };
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMessages = async (currentId: number, chattingWithId: number) => {
    try {
      const allMessages = await getMessages();
  
      const chat = allMessages.filter((msg: any) => {
        const senderId = Number(msg.sender);
        const recipientId = Number(msg.recipient);
        const currentIdNum = Number(currentId);
        const chattingWithNum = Number(chattingWithId);
      
        const match =
          (senderId === chattingWithNum && recipientId === currentIdNum) ||
          (senderId === currentIdNum && recipientId === chattingWithNum);
      
        return match;
      });
  
      setMessages(chat.reverse());
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || currentUserId === null) return;
    await sendMessage(userId, input);
    setInput("");
    await loadMessages(currentUserId, userId);
  };

  useEffect(() => {
    const init = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
  
      if (userInfo) {
        const user = JSON.parse(userInfo);
        const id = Number(user.id);
        setCurrentUserId(id);
        await loadMessages(id, userId);
      }
  
      setLoading(false);
    };
    init();
  }, []);

  if (loading || currentUserId === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{username}</Text>
            <View style={{ width: 40 }} /> {/* Spacer to balance the back button */}
            </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No messages found.
          </Text>
        }
        renderItem={({ item }) => {
          const isMe = item.sender === currentUserId;
          return (
            <View style={isMe ? styles.myMessage : styles.theirMessage}>
              <Text style={[styles.messageText, isMe ? { color: "#fff" } : { color: "#000" }]}>
                {item.content}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 10 }}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Message ${username}`}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={{ color: "white" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    height: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
  },
  
  backButton: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginTop: 50,
  },
  
  backText: {
    fontSize: 24,
    color: "#007AFF",
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
    marginTop: 50,
  },  
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    marginLeft: 8,
    borderRadius: 20,
    justifyContent: "center",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e5ea",
    borderRadius: 16,
    marginVertical: 4,
    padding: 10,
    maxWidth: "75%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderRadius: 16,
    marginVertical: 4,
    padding: 10,
    maxWidth: "75%",
  },
  messageText: {
    fontSize: 16,
  },
});
