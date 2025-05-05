import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { firestore } from "../../_utlis/firebaseConfig";
import { collection, addDoc, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import Icon from "react-native-vector-icons/Feather";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useInbox } from "../../hooks/useInbox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import SocialSkeletonLoader from "@/components/skeletons/SocialSkeletonLoader";
import { useRouter } from "expo-router";
import { getOrCreateDM } from "../api/getorCreateDM";
import Constants  from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;


type FriendUser = {
  id: number;
  username: string;
  profilePicture?: string;
};




export default function SocialScreen() {
  const navigation = useNavigation();
  const { push } = require("expo-router").useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [composeVisible, setComposeVisible] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FriendUser | null>(null);

  // Detect Scroll Direction (Up or Down)
  scrollY.addListener(({ value }) => {
    setIsExpanded(value < 10); // Expand when near the top
  });

  useEffect(() => {
    const fetchUser = async () => {
      const userInfo = await AsyncStorage.getItem("userInfo");
      const parsed = userInfo ? JSON.parse(userInfo) : null;
      setCurrentUserId(parsed?.id || null);
      if (parsed?.id && parsed?.username) {
        setCurrentUser({
          id: parsed.id,
          username: parsed.username,
          profilePicture: parsed.profilePicture || "",
        });
      }
    };
    const fetchFriends = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_BASE_URL}/api/friends/friends/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const data = await res.json();
      setFriends(data);
    };
    fetchUser();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (currentUserId !== null && friends.length > 0) {
      setLoading(false);
    }
  }, [currentUserId, friends]);

  const inbox = useInbox(currentUserId);

  const handleStartConversation = async () => {
    if (selectedFriends.length === 1) {
      const selected = friends.find(f => f.id === selectedFriends[0]);
      if (!selected || currentUserId === null) return;
  
      const conversationId = await getOrCreateDM(currentUserId, selected.id);
      router.push({
        pathname: "/ChatDetail",
        params: {
          conversationId,
          username: selected.username,
          profilePicture: selected.profilePicture || "",
        },
      });
    } else if (selectedFriends.length > 1 && currentUserId !== null) {
      Alert.prompt("Group Name", "Enter a name for the group chat:", async (groupName) => {
        if (!groupName) return;
  
        // 1. Create groupChat doc
        const newGroupRef = await addDoc(collection(firestore, "groupChats"), {
          name: groupName,
          image: "", // optional
          adminId: currentUserId,
          membersArray: [...selectedFriends, currentUserId],
          lastMessage: "",
          lastUpdated: serverTimestamp(),
          readCount: { [currentUserId]: 0 }
        });
  
        // 2. Add members to subcollection
        const allMembers: FriendUser[] = [
          ...(selectedFriends.map(id => friends.find(f => f.id === id)).filter(Boolean) as FriendUser[]),
          ...(currentUser ? [currentUser] : [])
        ];
        
        await Promise.all(allMembers.map(member =>
          setDoc(doc(firestore, `groupChats/${newGroupRef.id}/members/${member.id}`), {
            username: member.username
          })
        ));
  
        // 3. Navigate
        router.push({
          pathname: "/GroupChatDetail",
          params: {
            groupId: newGroupRef.id,
            groupName,
            groupImage: "",
            friends: JSON.stringify(friends),
          },
        });
      });
    }
  
    setComposeVisible(false);
    setSelectedFriends([]);
  };

  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return "";
  
    const date = new Date(timestamp);
    const now = new Date();
  
    const isToday = date.toDateString() === now.toDateString();
  
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
  
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
  };


  if (loading) {
    return <SocialSkeletonLoader />;
  }
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../../assets/images/avatar-placeholder.png")} style={styles.profileIcon} />
        <Text style={styles.headerText}>Chat</Text>
        <TouchableOpacity
          style={styles.addFriendIconContainer}
          onPress={() => push("../friends")}
        >
          <MaterialIcons name="person-add" size={28} color="#000" />
        </TouchableOpacity>


      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor="#7a7a7a" />
        <Icon name="search" size={18} color="#7a7a7a" style={styles.searchIcon} />
      </View>

      {/* Chat List */}
      <Animated.ScrollView testID="chat-scrollview"
        contentContainerStyle={styles.chatList}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {inbox.map((chat) => {

  return (
    <TouchableOpacity
      key={chat.id}
      style={styles.chatItem}
      onPress={() => {
        if (chat.type === "groupChat") {
          router.push({
            pathname: "/GroupChatDetail",
            params: {
              groupId: chat.id,
              groupName: chat.name,
              groupImage: chat.profilePicture,
              friends: JSON.stringify(friends),
            },
          });
        } else {
          router.push({
            pathname: "/ChatDetail",
            params: {
              conversationId: chat.id,
              username: chat.name,
              profilePicture: chat.profilePicture,
            },
          });
        }
      }}
    >
      <Image source={require("../../assets/images/avatar-placeholder.png")} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{chat.name}</Text>
        <Text style={styles.chatMessage} numberOfLines={1}>{chat.lastMessage}</Text>
      </View>

      {currentUserId !== null && chat.readCount && chat.readCount[currentUserId] > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{chat.readCount[currentUserId]}</Text>
        </View>
      ) : (
        <Text style={styles.chatTime}>{formatTime(chat.lastUpdated)}</Text>
      )}
      </TouchableOpacity>
    );
  })}
      </Animated.ScrollView>

      {composeVisible && (
  <View style={styles.overlay}>
    <View style={styles.popup}>
      <Text style={styles.popupTitle}>Select friends to chat with</Text>
      <ScrollView style={{ maxHeight: 400, marginTop: 20 }}>
        {friends.map(friend => (
          <TouchableOpacity
            key={friend.id}
            style={[
              styles.friendOption,
              selectedFriends.includes(friend.id) && styles.friendSelected
            ]}
            onPress={() =>
              setSelectedFriends(prev =>
                prev.includes(friend.id)
                  ? prev.filter(id => id !== friend.id)
                  : [...prev, friend.id]
              )
            }
          >
            <Text style={{ fontSize: 16 }}>{friend.username}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView >
      <View style={styles.popupActions}>
        <TouchableOpacity onPress={() => setComposeVisible(false)}>
          <Text style={{ color: "#000" }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleStartConversation()}>
          <Text style={{ color: "#007AFF", fontWeight: "bold" }}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}

      {/* Floating Compose Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setComposeVisible(true)}>
        <MaterialIcons name="edit" size={24} color="white" />
        {isExpanded && <Text style={styles.fabText}>Compose</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
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
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
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
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  searchIcon: {
    marginLeft: 8,
  },
  chatList: {
    paddingVertical: 10,
  },
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
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
  },
  chatMessage: {
    fontSize: 14,
    color: "#7a7a7a",
  },
  unreadBadge: {
    width: 18,
    height: 18,
    backgroundColor: "#ff3742",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  chatTime: {
    fontSize: 12,
    color: "#7a7a7a",
  },

  /* Floating Action Button (FAB) */
  fab: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    right: 20,
    bottom: 10,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    elevation: 5, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 100,
  },
  fabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  popup: {
    backgroundColor: "#fff",
    padding: 24, 
    borderRadius: 16, 
    width: "85%",     
    height: 400,
    maxHeight: "90%", 
  },
  popupTitle: {
    fontSize: 20,      
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  friendOption: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  friendSelected: {
    backgroundColor: "#e0f0ff",
  },
  popupActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
});