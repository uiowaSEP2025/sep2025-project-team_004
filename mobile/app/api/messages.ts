import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const API_URL = `${API_BASE_URL}/api/friends/messages/`;

export const sendMessage = async (recipientId: number, content: string, conversationId: string) => {
  const token = await AsyncStorage.getItem("authToken");
  if (!token) throw new Error("User not authenticated");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient: recipientId, content, conversation_id: conversationId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to send message:", errorText);
    throw new Error("Failed to send message");
  }
  return await response.json();
};

export const getMessages = async () => {
  const token = await AsyncStorage.getItem("authToken");
  if (!token) throw new Error("User not authenticated");

  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to fetch messages");
  return await response.json();
};

export const markMessagesAsRead = async (senderId: number, conversationId: string) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("User not authenticated");
  
    const response = await fetch(`${API_URL}mark_as_read/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sender_id: senderId, conversation_id: conversationId }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to mark messages as read:", errorText);
      throw new Error("Failed to mark messages as read");
    }
  };

  export const getMessagesWithUser = async (userId: number) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("User not authenticated");
  
    const response = await fetch(`${API_URL}with_user/?user_id=${userId}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
  
    if (!response.ok) throw new Error("Failed to fetch messages");
    return await response.json();
  };

  export const getMessagesByConversation = async (conversationId: string, page: number = 1) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("User not authenticated");
  
    const response = await fetch(`${API_URL}conversation/?conversation_id=${conversationId}&page=${page}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
  
    if (!response.ok) throw new Error("Failed to fetch paginated conversation messages");
    return await response.json();
  };

  export const formatChatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
  
    const isToday = date.toDateString() === now.toDateString();
  
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
  
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}/${String(
        date.getFullYear()
      ).slice(-2)}`;
    }
  };