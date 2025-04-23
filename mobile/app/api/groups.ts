import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

export async function createGroupChat(name: string, memberIds: number[]) {
    const token = await AsyncStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("name", name);
    memberIds.forEach((id) => formData.append("members[]", id.toString()));
  
    const res = await fetch(`${API_BASE_URL}/api/friends/groupchats/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });
  
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }
  
    return res.json();
  }

  export const markGroupMessagesAsRead = async (groupId: string) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("User not authenticated");
  
    const response = await fetch(`${API_BASE_URL}/api/friends/groupchats/${groupId}/mark_as_read/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to mark group messages as read:", error);
      throw new Error("Failed to mark group messages as read");
    }
  
    return await response.json();
  };
  