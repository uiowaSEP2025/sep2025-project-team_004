import React, { useState, useRef } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const chats = [
  { id: 1, name: "Daniel Atkins", lastMessage: "The weather will be perfect!", unread: 1 },
  { id: 2, name: "Erin, Ursula, Matthew", lastMessage: "You: The store only has 2% milk!", unread: 2 },
  { id: 3, name: "Photographers", lastMessage: "@Philippe: Hmm, are you sure?", unread: 10 },
  { id: 4, name: "Regina Jones", lastMessage: "The class has open enrollment...", unread: 0 },
  { id: 5, name: "Baker Hayfield", lastMessage: "Is Cleveland nice in October?", unread: 0 },
  { id: 6, name: "Alex Johnson", lastMessage: "Just finished the project!", unread: 3 },
  { id: 7, name: "Sarah Williams", lastMessage: "Dinner plans for tomorrow?", unread: 5 },
  { id: 8, name: "Tech Gurus", lastMessage: "New AI breakthrough announced!", unread: 7 },
  { id: 9, name: "Fitness Group", lastMessage: "Let's go for a morning run!", unread: 0 },
  { id: 10, name: "Movie Club", lastMessage: "Next movie night: Inception!", unread: 4 },
  { id: 11, name: "Gaming Squad", lastMessage: "Who's online tonight?", unread: 1 },
  { id: 12, name: "Work Chat", lastMessage: "Meeting rescheduled to 2 PM.", unread: 0 },
  { id: 13, name: "Michael Scott", lastMessage: "That's what she said!", unread: 6 },
  { id: 14, name: "Coding Ninjas", lastMessage: "React Native vs Flutter?", unread: 9 },
  { id: 15, name: "Crypto News", lastMessage: "Bitcoin just hit 50k!", unread: 0 },
  { id: 16, name: "Anna Kendrick", lastMessage: "Loved the new album!", unread: 2 },
  { id: 17, name: "The Boys", lastMessage: "Game night at my place!", unread: 0 },
  { id: 18, name: "Design Team", lastMessage: "Check out the new UI update!", unread: 1 },
  { id: 19, name: "Startup Hub", lastMessage: "Looking for co-founders!", unread: 0 },
  { id: 20, name: "Travel Buddies", lastMessage: "Flights to Tokyo booked!", unread: 3 },
  { id: 21, name: "Family Group", lastMessage: "Grandma's birthday is next week!", unread: 8 },
  { id: 22, name: "The Office Fans", lastMessage: "Best episode ever?", unread: 5 },
  { id: 23, name: "Debbie Thompson", lastMessage: "Lunch this weekend?", unread: 0 },
  { id: 24, name: "Book Club", lastMessage: "New book suggestion: The Alchemist!", unread: 2 },
];


export default function SocialScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Detect Scroll Direction (Up or Down)
  scrollY.addListener(({ value }) => {
    setIsExpanded(value < 10); // Expand when near the top
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../../assets/images/avatar-placeholder.png")} style={styles.profileIcon} />
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
        <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor="#7a7a7a" />
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
          <TouchableOpacity key={chat.id} style={styles.chatItem} onPress={() => navigation.navigate("ChatDetail", { userId: chat.id })}>
            <Image source={require("../../assets/images/avatar-placeholder.png")} style={styles.avatar} />
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{chat.name}</Text>
              <Text style={styles.chatMessage} numberOfLines={1}>{chat.lastMessage}</Text>
            </View>
            {/* Unread Message Count */}
            {chat.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{chat.unread}</Text>
              </View>
            )}
            <Text style={styles.chatTime}>2:14 PM</Text>
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
    bottom: 30,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    elevation: 5, // Shadow for Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
