import React from 'react';
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ChatDetail() {
  const { conversationId } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Chat Detail for: {conversationId}</Text>
    </View>
  );
}
