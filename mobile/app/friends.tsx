import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { sendFriendRequest, getPendingRequests, getAllFriends } from "./api/friends";

type FriendRequest = {
  id: number;
  sender_name: string;
};

type Friend = {
  id: number;
  name: string;
};


export default function FriendRequestsScreen() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const pending = await getPendingRequests();
        setPendingRequests(pending || []); // Ensure empty array if undefined

        const allFriends = await getAllFriends();
        setFriends(allFriends || []);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchData();
  }, []);

  const handleSendRequest = async () => {
    if (!searchTerm.trim()) {
      alert("Please enter a username.");
      return;
    }
  
    try {
      const response = await sendFriendRequest(searchTerm.trim());
      alert("Friend request sent!");
      setSearchTerm("");
    } catch (error) {
      alert("Error sending request: " + (error as Error).message);
    }
  };
  

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["Pending", "All", "Add Friend"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab.toLowerCase())}
            style={[
              styles.tabButton,
              activeTab === tab.toLowerCase() && styles.activeTab,
            ]}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Add Friend Tab */}
        {activeTab === "add friend" && (
          <View style={styles.addFriendContainer}>
            <TextInput
              style={styles.input}
              placeholder="Search for a friend..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <TouchableOpacity style={styles.addFriendButton} onPress={handleSendRequest}>
              <MaterialIcons name="person-add" size={24} color="white" />
              <Text style={styles.addFriendText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Friend Requests Tab */}
        {activeTab === "pending" && (
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <Text style={styles.friendName}>{item.sender_name}</Text>
                <Text style={styles.friendStatus}>Pending</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No pending requests</Text>}
          />
        )}

        {/* All Friends Tab */}
        {activeTab === "all" && (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <Text style={styles.friendName}>{item.name}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No friends yet</Text>}
          />
        )}
      </View>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfcfc" },
  header: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
  },
  headerText: { fontSize: 18, fontWeight: "700" },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
  },
  tabButton: { paddingVertical: 6, paddingHorizontal: 15 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#000" },
  tabText: { fontSize: 16, fontWeight: "500" },
  content: { flex: 1, padding: 16 },
  addFriendContainer: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  addFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addFriendText: { color: "#fff", marginLeft: 5 },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
  },
  friendName: { fontSize: 16 },
  friendStatus: { fontSize: 14, color: "#888" },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});

