import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PaymentCancelScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Payment was canceled.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, color: "#FF3B30" },
});