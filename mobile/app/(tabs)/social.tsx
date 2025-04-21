import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const MESSAGES_URL = `${API_BASE_URL}/api/friends/messages/`;

export default function SocialScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  scrollY.addListener(({ value }) => {
    setIsExpanded(value < 10);
  });

  const loadChats = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userInfo = await AsyncStorage.getItem("userInfo");

      if (!token || !userInfo) return;

      const currentUser = JSON.parse(userInfo);
      const currentUserId = currentUser.id;

      const res = await fetch(MESSAGES_URL, {
        headers: { Authorization: `Token ${token}` },
      });

      const messages = await res.json();

      const chatMap: { [key: string]: any } = {};

      messages.forEach((msg: any) => {
        const isSentByMe = msg.sender === currentUserId;
        const partnerId = isSentByMe ? msg.recipient : msg.sender;
        const partnerUsername = isSentByMe ? msg.recipient_username ?? "Unknown" : msg.sender_username;
      
        if (
          !chatMap[partnerId] ||
          new Date(msg.timestamp) > new Date(chatMap[partnerId].timestamp)
        ) {
          chatMap[partnerId] = {
            userId: partnerId,
            username: partnerUsername,
            lastMessage: msg.content,
            unread: 0, // Start from 0, we'll add later
            timestamp: msg.timestamp,
          };
        }
      
        // ✅ Count as unread only if:
        // - message was received (not sent)
        // - and message is not marked as read
        if (!isSentByMe && !msg.read) {
          chatMap[partnerId].unread += 1;
        }
      });

      const sortedChats = Object.values(chatMap).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setChats(sortedChats);
    } catch (err) {
      console.error("❌ Failed to load chats", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/avatar-placeholder.png")}
          style={styles.profileIcon}
        />
        <Text style={styles.headerText}>Chat</Text>
        <TouchableOpacity
          style={styles.addFriendIconContainer}
          onPress={() => router.push("../friends")}
        >
          <MaterialIcons name="person-add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#7a7a7a"
        />
        <Icon name="search" size={18} color="#7a7a7a" style={styles.searchIcon} />
      </View>

      {/* Chat List */}
      <Animated.ScrollView
        contentContainerStyle={styles.chatList}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.userId}
            style={styles.chatItem}
            onPress={() => router.push({
              pathname: "/ChatDetail",
              params: { userId: chat.userId, username: chat.username },
            })}
          >
            <Image
              source={require("../../assets/images/avatar-placeholder.png")}
              style={styles.avatar}
            />
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{chat.username}</Text>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
            </View>
            {chat.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{chat.unread}</Text>
              </View>
            )}
            <Text style={styles.chatTime}>
              {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>

      {/* Floating Compose Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <MaterialIcons name="edit" size={24} color="white" />
        {isExpanded && <Text style={styles.fabText}>Compose</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfcfc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
  },
  profileIcon: { width: 40, height: 40, borderRadius: 20 },
  headerText: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  addFriendIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ecebeb",
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  searchIcon: { marginLeft: 8 },
  chatList: { paddingVertical: 10 },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
    backgroundColor: "#ffffff",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: "700" },
  chatMessage: { fontSize: 14, color: "#7a7a7a" },
  unreadBadge: {
    width: 18,
    height: 18,
    backgroundColor: "#ff3742",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  unreadText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  chatTime: { fontSize: 12, color: "#7a7a7a" },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 70,
  },
  fabText: { color: "white", fontSize: 16, fontWeight: "600", marginLeft: 8},
});
