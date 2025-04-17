import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const API_URL = `${API_BASE_URL}/api/friends/messages/`;

export const sendMessage = async (recipientId: number, content: string) => {
  const token = await AsyncStorage.getItem("authToken");
  if (!token) throw new Error("User not authenticated");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient: recipientId, content }),
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