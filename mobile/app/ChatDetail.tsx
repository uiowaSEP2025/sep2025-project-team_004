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
import { getMessagesByConversation, sendMessage, markMessagesAsRead } from "./api/messages";
import { useRouter } from "expo-router";

export default function ChatDetail() {
  const router = useRouter();
  const route = useRoute();
  const { userId, username, conversationId, messages: passedMessages } = route.params as {
    userId: number;
    username: string;
    conversationId: string;
    messages: string;
  };
  
  const [messages, setMessages] = useState<any[]>(
    JSON.parse(passedMessages)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .reverse()
  );
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [lastSentId, setLastSentId] = useState<string | number | null>(null);
  const [sendingStatus, setSendingStatus] = useState<"sending" | "sent" | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMessages = async (pageNum = 1, reset = false) => {
    if (isFetching || (!hasNextPage && !reset)) return;
    setIsFetching(true);

    console.log(`📡 Loading page ${pageNum}, reset=${reset}`);
  
    try {
      const data = await getMessagesByConversation(conversationId, pageNum);
      console.log("🧾 New messages (raw):", data.results.map((m: any) => m.timestamp));
      const newMessages = data.results.sort(
        (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  
      if (reset) {
        console.log("🔁 Resetting messages");
        setMessages(newMessages.reverse());
        setPage(2);
      } else {
        console.log("📥 Appending messages at top");
        setMessages((prev) => {
          const combined = reset ? newMessages.reverse() : [...prev, ...newMessages.reverse()];
        
          // Deduplicate by ID
          const uniqueMap = new Map();
          for (const msg of combined) {
            uniqueMap.set(msg.id, msg);
          }
        
          return Array.from(uniqueMap.values());
        });
        if (data.next) setPage((prev) => prev + 1);
      }
  
      setHasNextPage(!!data.next);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setIsFetching(false);
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
      const savedMessage = await sendMessage(userId, input, conversationId);
  
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
    console.log("📨 conversationId passed to ChatDetail:", conversationId);
    const fetchData = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        const id = Number(user.id);
        setCurrentUserId(id);
  
        if (conversationId && conversationId !== "undefined") {
          await loadMessages(1, true); 
          await loadMessages(2, false); 
        }
        await markMessagesAsRead(userId, conversationId);
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
        inverted
        keyExtractor={(item) => item.id?.toString() ?? `temp-${item.timestamp}`}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No messages found.
          </Text>
        }
        onScroll={({ nativeEvent }) => {
          const { contentOffset } = nativeEvent;
          const scrollY = contentOffset.y;
        
          if (scrollY < 100 && hasNextPage && !isFetching) {
            console.log("📡 Manually triggered loadMessages at top | page =", page);
            loadMessages(page);
          }
        }}
        scrollEventThrottle={100}
        renderItem={({ item, index }) => {
          const isMe = item.sender === currentUserId;
          const isLastSent = item.id === lastSentId;
          const timestamp = new Date(item.timestamp).toISOString();
          console.log(`🧷 Render item ${index}: ${timestamp}`);
        
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
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 1,
        }}
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
