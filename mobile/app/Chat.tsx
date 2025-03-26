import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

type Message = {
  message: string;
  sender: number;
};

export default function ChatScreen() {
  const { friendId, friendName } = useLocalSearchParams<{ friendId: string; friendName: string }>();
  const numericFriendId = parseInt(friendId, 10);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const initWebSocket = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const ws = new WebSocket(`ws://${API_BASE_URL}:8000/ws/chat/${numericFriendId}/?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { message: data.message, sender: data.sender }]);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };

      setSocket(ws);
    };

    if (!isNaN(numericFriendId)) {
      initWebSocket();
    }

    return () => {
      socket?.close();
    };
  }, [numericFriendId]);

  const sendMessage = () => {
    if (socket && input.trim()) {
      socket.send(JSON.stringify({ message: input }));
      setInput('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.messageText}>
            {item.sender === numericFriendId ? 'Friend' : 'You'}: {item.message}
          </Text>
        )}
      />
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message..."
        style={styles.input}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  messageText: {
    paddingVertical: 5,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});