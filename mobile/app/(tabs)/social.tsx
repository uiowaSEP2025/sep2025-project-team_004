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
import { formatChatTimestamp } from "../api/messages";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const MESSAGES_URL = `${API_BASE_URL}/api/friends/messages/unified_conversations/`;

export default function SocialScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  scrollY.addListener(({ value }) => {
    setIsExpanded(value < 10);
  });

  const loadChats = async (reset = false) => {
    if (isFetching || (!hasNextPage && !reset)) return;
    setIsFetching(true);
  
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userInfo = await AsyncStorage.getItem("userInfo");
  
      if (!token || !userInfo) return;
  
      const currentUser = JSON.parse(userInfo);
      setCurrentUserId(currentUser.id);
  
      const currentPage = reset ? 1 : page;
      const res = await fetch(`${MESSAGES_URL}?page=${currentPage}`, {
        headers: { Authorization: `Token ${token}` },
      });
  
      const data = await res.json();
      const conversations = reset ? data.results : [...chats, ...data.results];
  
      setChats(conversations);
      setHasNextPage(!!data.next);
      if (!reset && data.next) setPage((prev) => prev + 1);
      else if (reset) setPage(2);
  
    } catch (err) {
      console.error("❌ Failed to load unified chats", err);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };
  
  useFocusEffect(
    useCallback(() => {

        loadChats(true);

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
      <ScrollView
        style={styles.chatList}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

          if (isCloseToBottom && hasNextPage && !isFetching) {
            loadChats();
            }
          }}
          scrollEventThrottle={400}
        >
        {chats.map((chat, index) => {
  const isDM = chat.type === "dm";
  const unreadCount = isDM
    ? chat.messages?.filter(
        (msg: any) => !msg.read && msg.sender !== currentUserId
      ).length
    : chat.messages?.filter(
        (msg: any) => !msg.read_by?.some((u: any) => u.id === currentUserId)
      ).length;


  return (
    <TouchableOpacity
      key={index}
      style={styles.chatItem}
      onPress={() => {
        if (isDM) {
          router.push({
            pathname: "/ChatDetail",
            params: {
              userId: chat.partner_id,
              username: chat.partner_username,
              conversationId: chat.conversation_id,
              messages: JSON.stringify(chat.messages),
            },
          });
        } else {
          router.push({
            pathname: "/GroupChatDetail",
            params: {
              groupId: chat.group_id,
              groupName: chat.group_name,
              groupImage: chat.group_image,
              messages: JSON.stringify(chat.messages),
            },
          });
        }
      }}
    >
      <Image
        source={
          chat.type === "group" && chat.group_image
            ? { uri: chat.group_image }
            : require("../../assets/images/avatar-placeholder.png")
        }
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>
          {chat.type === "dm" ? chat.partner_username : chat.group_name}
        </Text>
        <Text style={styles.chatMessage} numberOfLines={1}>
          {chat.messages?.[0]?.content || "No messages"}
        </Text>
      </View>
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unreadCount}</Text>
        </View>
      )}
      <Text style={styles.chatTime}>
        {formatChatTimestamp(chat.timestamp)}
      </Text>
    </TouchableOpacity>
  );
})}
        {isFetching && (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <Text style={{ color: "#888" }}>Loading more conversations...</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Compose Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push("/Compose")}>
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
