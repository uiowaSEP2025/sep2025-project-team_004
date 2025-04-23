import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { getAllFriends } from "../app/api/friends";
import { createGroupChat } from "../app/api/groups";
import { getMessagesByConversation } from "../app/api/messages";

const defaultPfp = require("../assets/images/avatar-placeholder.png");

export default function ComposeChatScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [groupName, setGroupName] = useState("");
  const router = useRouter();

  useEffect(() => {
    getAllFriends().then(setFriends).catch(console.error);
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleStart = async () => {
    const selectedIds = [...selected];
    if (selectedIds.length === 0) {
      return alert("Please select at least one friend.");
    }

    if (selectedIds.length === 1) {
      const friend = friends.find((f) => f.id === selectedIds[0]);
      const { results } = await getMessagesByConversation(friend.conversation_id, 1);
      return router.push({
        pathname: "/ChatDetail",
        params: {
          userId: friend.id,
          username: friend.username,
          conversationId: friend.conversation_id,
          messages: JSON.stringify(results),
        },
      });
    }

    if (!groupName.trim()) {
      return alert("Please enter a group name.");
    }

    try {
      const res = await createGroupChat(groupName, selectedIds);
      return router.push({
        pathname: "/GroupChatDetail",
        params: {
          groupId: res.id,
          groupName: res.name,
          groupImage: res.image || null,
          messages: JSON.stringify([]),
        },
      });
    } catch (err) {
      console.error("Failed to create group:", err);
      alert("Failed to create group chat.");
    }
  };

  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={60} // adjust if header gets pushed
  >
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Select who you'd like to chat with</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity
              style={[styles.friendRow, isSelected && styles.selected]}
              onPress={() => toggleSelect(item.id)}
            >
              <Image source={defaultPfp} style={styles.avatar} />
              <Text style={styles.username}>{item.username}</Text>
            </TouchableOpacity>
          );
        }}
      />
      {selected.size > 1 && (
        <TextInput
          style={styles.input}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name"
          placeholderTextColor="#7a7a7a"
        />
      )}
      <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
        <Text style={styles.btnText}>Start</Text>
      </TouchableOpacity>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfcfc", padding: 10 },
  header: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    marginTop: 30,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ecebeb",
  },
  selected: {
    backgroundColor: "#e6f0ff",
    borderColor: "#007AFF",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  startBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});