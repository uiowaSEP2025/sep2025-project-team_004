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
  InteractionManager,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMessagesWithUser, sendMessage, markMessagesAsRead } from "./api/messages";
import { useRouter } from "expo-router";

export default function ChatDetail() {
  const router = useRouter();
  const route = useRoute();
  const { userId, username, messages: passedMessages } = route.params as {
    userId: number;
    username: string;
    messages: string;
  };
  
  const [messages, setMessages] = useState<any[]>(
    JSON.parse(passedMessages)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .reverse()
  );
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [lastSentId, setLastSentId] = useState<string | number | null>(null);
  const [sendingStatus, setSendingStatus] = useState<"sending" | "sent" | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMessages = async (chattingWithId: number) => {
    try {
      const chat = await getMessagesWithUser(chattingWithId);
      const sorted = chat.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(sorted.reverse());
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || currentUserId === null) return;
  
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      sender: currentUserId,
      recipient: userId,
      content: input,
      timestamp: new Date().toISOString(),
    };
  
    setMessages((prev) => [newMessage, ...prev]);
    setLastSentId(tempId);
    setSendingStatus("sending");
    setInput("");
  
    try {
      const savedMessage = await sendMessage(userId, input);
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? savedMessage : msg
        )
      );
      setLastSentId(savedMessage.id);
      setSendingStatus("sent");
    } catch (err) {
      console.error("Failed to send message:", err);
      setSendingStatus(null);
    }
  };

  useEffect(() => {
    setLoading(false)
    const fetchData = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        const id = Number(user.id);
        setCurrentUserId(id);
  
        // Don't wait for these to finish before rendering
        loadMessages(userId);
        markMessagesAsRead(userId);
      }
    };
  
    fetchData(); // Fire immediately
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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{username}</Text>
        </View>

        <View style={styles.rightSpacer} />
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
          const isLastSent = item.id === lastSentId;
        
          return (
            <View style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
              <View style={isMe ? styles.myMessage : styles.theirMessage}>
                <Text style={[styles.messageText, isMe ? { color: "#fff" } : { color: "#000" }]}>
                  {item.content}
               </Text>
             </View>
             {isMe && isLastSent && sendingStatus && (
                <Text style={styles.statusText}>
                  {sendingStatus === "sending" ? "Sending..." : "Sent"}
                </Text>
              )}
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
          placeholderTextColor={"#667"}
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
    height: 130,
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginTop: 30,
  },
  rightSpacer: {
    width: 40,
    marginTop: 50,
  },
  statusText: {
    fontSize: 10,
    color: "#667",
    marginTop: 4,
    textAlign: "right",
  },
});
