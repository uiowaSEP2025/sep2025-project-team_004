import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  sendFriendRequest,
  getPendingRequests,
  getAllFriends,
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/app/api/friends";

import { useRouter } from 'expo-router';
import { getMessagesWithUser } from "@/app/api/messages";

const defaultPfp = require("@/assets/images/avatar-placeholder.png");

// For friend requests
interface FriendRequest {
  id: number;
  from_user: number;
  from_user_username: string;
  to_user: number;
  created_at: string;
}

// For actual friends (returned by getAllFriends)
interface FriendUser {
  id: number;
  username: string;
}

export default function FriendRequestsScreen() {
  const router = useRouter();
  const route = useRoute();
  const initialTab = (route.params as any)?.initialTab;

  const [activeTab, setActiveTab] = useState(initialTab || "pending");
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pending = await getPendingRequests();
        setPendingRequests(pending);

        const allFriends = await getAllFriends();
        setFriends(allFriends);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchData();
  }, []);

  const handleSendRequest = async () => {
    if (!searchTerm.trim()) return;

    try {
      await sendFriendRequest(searchTerm.trim());
      setModalMessage("Friend request sent!");
      setModalVisible(true);
      setSearchTerm(""); 
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sending friend request:", error.message);
        throw error;
      } else {
        console.error("Unexpected error:", error);
        throw new Error("An unknown error occurred.");
      }
    }
  };
  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
  
      // Immediately update the pending requests without a refetch
      setPendingRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
  
      const updatedFriends = await getAllFriends();
      setFriends(updatedFriends);
  
      setModalMessage("Friend request accepted!");
      setModalVisible(true);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setModalMessage("Failed to accept request.");
      setModalVisible(true);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
  
      // Immediately remove the rejected request from the pending list
      setPendingRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
  
      setModalMessage("Friend request rejected!");
      setModalVisible(true);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setModalMessage("Failed to reject friend request.");
      setModalVisible(true);
    }
  };
  
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button on the Left */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        {/* Centered Title */}
        <Text style={styles.headerText}>Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["Pending", "All", "Add Friend"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab.toLowerCase())}
            style={[styles.tabButton, activeTab === tab.toLowerCase() && styles.activeTab]}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
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

        {activeTab === "pending" && (
          <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.id.toString()} // Ensure ID is a string
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              {/* Profile Picture */}
              <View style={styles.avatarContainer}>
                <Image source={defaultPfp} style={styles.avatar} />
              </View>

              {/* User Info */}
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.from_user_username || "Unknown"}</Text>
              </View>

              {/* Accept / Reject Buttons */}
              <View style={styles.friendActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(item.id)}
                
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(item.id)} 
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
              </View>
            </View>
          )}
        />

        )}

        {activeTab === "all" && (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <Text style={styles.friendName}>{item.username}</Text>
                <TouchableOpacity
                  disabled={loadingId === item.id}
                  onPress={async () => {
                  setLoadingId(item.id);
                  try {
                    const messages = await getMessagesWithUser(item.id);
                    router.push({
                    pathname: "/ChatDetail",
                    params: {
                    userId: item.id,
                    username: item.username,
                    messages: JSON.stringify(messages),
                  },
                });
                } catch (error) {
                  console.error("Failed to fetch messages:", error);
                } finally {
                  setLoadingId(null);
                }
              }}
            style={{
                backgroundColor: loadingId === item.id ? "#999" : "#007AFF",
                padding: 8,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
               minWidth: 90,
             }}
            >
              {loadingId === item.id ? (
               <ActivityIndicator color="#fff" size="small" />
              ) : (
               <Text style={{ color: "white" }}>Message</Text>
             )}
           </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal for Feedback Messages */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfcfc", },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
    paddingHorizontal: 16,
    marginTop: 50,
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  headerText: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
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
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecebeb",
  },
  friendName: { fontSize: 16 },
  friendStatus: { fontSize: 14, color: "gray" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: { fontSize: 18, marginBottom: 10 },
  modalButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
  },
  modalButtonText: { color: "white", fontSize: 16 },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendInfo: {
    flex: 1,
    justifyContent: "center",
  },
  friendActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "green",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  rejectButton: {
    backgroundColor: "red",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  
});