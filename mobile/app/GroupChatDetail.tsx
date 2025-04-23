import React, { useEffect, useState, useRef } from "react";
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
  Animated,
  Pressable,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { markGroupMessagesAsRead } from "./api/groups";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const SCREEN_WIDTH = Dimensions.get("window").width;

type GroupMessage = {
    id: string | number;
    sender: number | { id: number; username?: string };
    content: string;
    timestamp: string;
    is_system?: boolean;
  };

export default function GroupChatDetail() {
  const router = useRouter();
  const route = useRoute();
  const { groupId, groupName, groupImage, messages: initialMessages } = route.params as {
    groupId: string;
    groupName: string;
    groupImage: string | null;
    messages: string;
  };

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(
    JSON.parse(initialMessages)
      .sort((a: GroupMessage, b: GroupMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .reverse()
  );  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [groupAdminId, setGroupAdminId] = useState<number | null>(null);
  const [friends, setFriends] = useState<{ id: number; username: string }[]>([]);
  const [showFriendList, setShowFriendList] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastSentId, setLastSentId] = useState<string | number | null>(null);
  const [sendingStatus, setSendingStatus] = useState<"sending" | "sent" | null>(null);
  const isFocused = useIsFocused();

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH * 0.2,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const loadLatestMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/messages/?page=1`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      const newMessages = data.results.sort(
        (a: GroupMessage, b: GroupMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  
      setMessages((prev: any) => {
        const combined = [...newMessages.reverse(), ...prev];
        const uniqueMap = new Map();
        for (const msg of combined) {
          uniqueMap.set(msg.id, msg);
        }
        return Array.from(uniqueMap.values());
      });
    } catch (err) {
      console.error("🔁 Group chat polling failed:", err);
    }
  };

  const fetchMembers = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/members/`, {
      headers: { Authorization: `Token ${token}` },
    });
    const data = await res.json();
  
    const adminRes = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/`, {
      headers: { Authorization: `Token ${token}` },
    });
    const group = await adminRes.json();
    console.log(group)
    setMembers(data);
    setGroupAdminId(group.admin_id);
  };

  const fetchFriends = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/friends/friends/`, {
      headers: { Authorization: `Token ${token}` },
    });
    const data = await res.json(); // [{ id: 55, username: 'bob' }, ...]
    setFriends(data);
  };

  const handleKick = async (userIdToKick: number) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) return;
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/remove_member/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userIdToKick }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to kick member:", errorText);
        return;
      }
  
      console.log("✅ Member kicked");
      fetchMembers(); // Refresh member list
    } catch (err) {
      console.error("❌ Kick error:", err);
    }
  };

  const handleAddMember = async (userIdToAdd: number) => {
    const token = await AsyncStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/add_member/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userIdToAdd }),
      });
  
      if (!res.ok) {
        const err = await res.text();
        console.error("Failed to add member:", err);
        return;
      }
  
      await fetchMembers(); // Refresh group members
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const loadMoreMessages = async () => {
    if (isFetching || !hasNextPage) return;
    setIsFetching(true);
  
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(
        `${API_BASE_URL}/api/friends/groupchats/${groupId}/messages/?page=${page}`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      const data = await res.json();
  
      const olderMessages = data.results.sort(
        (a: GroupMessage, b: GroupMessage) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  
      setMessages((prev: GroupMessage[]) => {
        const combined = [...prev, ...olderMessages.reverse()];
        const uniqueMap = new Map();
        for (const msg of combined) {
          uniqueMap.set(msg.id, msg);
        }
        return Array.from(uniqueMap.values());
      });
  
      if (data.next) setPage((prev) => prev + 1);
      else setHasNextPage(false);
    } catch (err) {
      console.error("📄 Pagination error:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSend = async () => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token || !input.trim()) return;
  
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      sender: currentUserId,
      content: input,
      timestamp: new Date().toISOString(),
    };
  
    setMessages((prev: GroupMessage[]) => [newMessage, ...prev]);
    setLastSentId(tempId);
    setSendingStatus("sending");
    setInput("");
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/send_message/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json", // ✅ must be JSON
        },
        body: JSON.stringify({ content: input }), // ✅ match what the backend expects
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to send group message:", errorText);
        setSendingStatus(null);
        return;
      }
  
      const savedMsg = await res.json();
  
      setMessages((prev: GroupMessage[]) =>
        prev.map((msg: GroupMessage) => (msg.id === tempId ? savedMsg : msg))
      );
      setLastSentId(savedMsg.id);
      setSendingStatus("sent");
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setSendingStatus(null);
    }
  };

  useEffect(() => {
    if (!isFocused) return;
  
    const interval = setInterval(() => {
      loadLatestMessages();
      markGroupMessagesAsRead(groupId);
    }, 8000);
  
    return () => clearInterval(interval);
  }, [isFocused]);

  useEffect(() => {
    AsyncStorage.getItem("userInfo").then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        setCurrentUserId(parsed.id);

        markGroupMessagesAsRead(groupId);
      }
    });
    fetchFriends();
  }, []);

  useEffect(() => {
    if (sidebarVisible) fetchMembers();
  }, [sidebarVisible]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
        <TouchableOpacity onPress={toggleSidebar}>
          <Image
            source={groupImage ? { uri: groupImage } : require("../assets/images/avatar-placeholder.png")}
            style={styles.groupImage}
          />
        </TouchableOpacity>
      </View>

      {/* Message List */}
      <FlatList
        inverted
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        onScroll={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y < 100 && hasNextPage && !isFetching) {
              loadMoreMessages();
            }
          }}
        scrollEventThrottle={100}
        renderItem={({ item: message }) => {
            if (message.is_system) {
              return (
                <View style={styles.systemMessageContainer}>
                  <Text style={styles.systemMessageText}>{message.content}</Text>
                </View>
              );
            }
          
            const senderId = typeof message.sender === "object" ? message.sender.id : message.sender;
            const isMe = senderId === currentUserId;
            const isLastSent = message.id === lastSentId;
          
            return (
                <View style={{ alignSelf: isMe ? "flex-end" : "flex-start", marginBottom: 4 }}>
                  {!isMe && typeof message.sender === "object" && message.sender.username && (
                    <Text style={styles.senderName}>{message.sender.username}</Text>
                  )}
                  <View style={isMe ? styles.myMessage : styles.theirMessage}>
                    <Text style={[styles.messageText, isMe ? { color: "#fff" } : { color: "#000" }]}>
                      {message.content}
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
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message"
          placeholderTextColor={'#667'}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={{ color: "white" }}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <Pressable style={styles.overlay} onPress={toggleSidebar}>
          <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
            <Image
              source={groupImage ? { uri: groupImage } : require("../assets/images/avatar-placeholder.png")}
              style={styles.sidebarImage}
            />
            <Text style={styles.sidebarTitle}>{groupName}</Text>
            <Text style={styles.membersLabel}>Members</Text>
            {members.map((member: any) => {
  const user = member.user;
  if (!user || !user.id) return null;

  const isCurrentUser = user.id === currentUserId;
  const isAlreadyFriend = friends.some((f: any) => f.id === user.id);
  const isAdmin = currentUserId === groupAdminId;

  return (
    <View key={`member-${user.id}`} style={styles.memberRow}>
      <Text>{user.username}</Text>
      <View style={{ flexDirection: "row" }}>
        {isAdmin && !isCurrentUser && (
          <TouchableOpacity style={styles.kickBtn} onPress={() => handleKick(user.id)}>
            <Text style={styles.memberBtnText}>Kick</Text>
          </TouchableOpacity>
        )}
        {!isAlreadyFriend && !isCurrentUser && (
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.memberBtnText}>Add friend</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
})}
            <TouchableOpacity
  style={styles.addMemberButton}
  onPress={() => setShowFriendList((prev) => !prev)}
>
  <Text>{showFriendList ? "Hide Friends" : "Add member"}</Text>
</TouchableOpacity>

{showFriendList &&
  friends
    .filter((f) => !members.some((m) => m.user?.id === f.id))
    .map((friend) => (
      <View key={`friend-${friend.id}`} style={styles.memberRow}>
        <Text>{friend.username}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleAddMember(friend.id)}
        >
          <Text style={styles.memberBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    ))}
    {currentUserId === groupAdminId && (
  <TouchableOpacity
    style={[styles.addMemberButton, { backgroundColor: "#f55" }]}
    onPress={() => {
      Alert.alert(
        "Delete Group Chat",
        "Are you sure you want to delete this group chat? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await AsyncStorage.getItem("authToken");
                const res = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/delete_group/`, {
                  method: "DELETE",
                  headers: { Authorization: `Token ${token}` },
                });
                router.back();
                if (res.ok) {
                  Alert.alert("Success", "Group chat deleted.");
                } else {
                  const error = await res.text();
                  console.error("❌ Delete error:", error);
                  Alert.alert("Error", "Failed to delete group chat.");
                }
              } catch (err) {
                console.error("❌ Exception deleting group:", err);
                Alert.alert("Error", "Something went wrong.");
              }
            },
          },
        ],
        { cancelable: true }
      );
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete Group</Text>
  </TouchableOpacity>
)}
          </Animated.View>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f8f8f8",
  },
  backArrow: { fontSize: 22, color: "#007AFF" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  groupImage: { width: 40, height: 40, borderRadius: 20 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
    marginBottom: 25,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    height: 40,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    marginLeft: 8,
    borderRadius: 20,
    justifyContent: "center",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 10,
    marginVertical: 4,
    maxWidth: "75%",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e5ea",
    borderRadius: 16,
    padding: 10,
    marginVertical: 4,
    maxWidth: "75%",
  },
  messageText: { color: "#000" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: "#fff",
    padding: 20,
    zIndex: 1000,
  },
  sidebarImage: { width: 60, height: 60, borderRadius: 30, alignSelf: "center", marginTop:50 },
  sidebarTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  membersLabel: { marginTop: 20, fontWeight: "bold", marginBottom: 8 },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  kickBtn: {
    backgroundColor: "#f55",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 4,
  },
  addBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  memberBtnText: { color: "#fff", fontSize: 12 },
  addMemberButton: {
    marginTop: 12,
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  
  systemMessageText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
  },
  senderName: {
    marginLeft: 5,
    fontSize: 13,
    marginBottom: 1,
    fontWeight: "500",
    color: "#555",
  },
  statusText: {
    fontSize: 10,
    color: "#667",
    marginTop: 2,
    textAlign: "right",
  },
});