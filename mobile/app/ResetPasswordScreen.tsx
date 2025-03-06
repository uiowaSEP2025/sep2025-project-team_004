import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../app/types";

type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, "ResetPasswordScreen">;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ResetPasswordScreenRouteProp>();

  const { email, token } = route.params || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email || !token) {
      Alert.alert("Invalid link", "This reset link is invalid or expired.");
      navigation.navigate("index");
    }
  }, [email, token]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/auth/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, new_password: newPassword }),
      });

      if (!response.ok) throw new Error("Failed to reset password. Try again.");

      Alert.alert("Success", "Password has been reset successfully!", [
        { text: "OK", onPress: () => navigation.navigate("index") },
      ]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "80%", padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  button: { padding: 10, backgroundColor: "#007BFF", borderRadius: 5, marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16 },
  error: { color: "red", marginBottom: 10 },
});
