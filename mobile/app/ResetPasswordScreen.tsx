import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import showMessage from "../hooks/useAlert";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";

const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, "ResetPasswordScreen">;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { useToast } = showMessage();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const token = params.token as string;
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email || !token) {
      Alert.alert("Invalid link", "This reset link is invalid or expired.");
      router.replace("/");
    }
  }, [email, token]);

  const validatePassword = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/\d/.test(password)) return "Password must contain at least one number.";
    if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
    return null;
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match!");
      return;
    }
  
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
  
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, new_password: newPassword }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to reset password. Try again.");
  
      useToast("Success", "Your password has been reset.");
      router.replace("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      {error ? <Text testID="error-message" style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor='#888'
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        placeholderTextColor='#888'
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
        secureTextEntry
      />

      <TouchableOpacity testID="reset-button" style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "white", },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "80%", padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  button: { padding: 10, backgroundColor: "#007BFF", borderRadius: 5, marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16 },
  error: { color: "red", marginBottom: 10 },
});
