import React from 'react';
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import showMessage from "../hooks/useAlert";

import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

export default function ForgotScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { useToast } = showMessage();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleForgot = async () => {
    setError("");
    if (!email) {
      setError("Email is required!");
      return;
    }
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/auth/request-password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      if (!response.ok) {
        throw new Error("Error sending reset email. Please try again.");
      }
  
      useToast("Success", "A reset link has been sent to your email.");
      setEmail("");
      navigation.navigate("index");
    } catch (error) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <View style={styles.container}>
      <Text testID="forgot-title" style={styles.title}>
        Forgot Password
      </Text>
      {error ? <Text testID="error-message" style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleForgot}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
  },
  input: {
    width: Dimensions.get("window").width * 0.4,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  button: {
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    marginTop: 10,
    width: Dimensions.get("window").width * 0.4,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "gray",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});
