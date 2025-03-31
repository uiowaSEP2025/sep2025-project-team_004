import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import showMessage from "../hooks/useAlert";
import Constants from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

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
      const response = await fetch(`${API_BASE_URL}/api/users/auth/request-password-reset/`, {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
      <Text style={styles.headerText} testID="forgot-title">Forgot Password</Text>
        <View style={styles.formContainer}>
        <Text style={styles.errorText} testID="error-message">{error || " "}</Text>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            placeholderTextColor="#909090"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.inputLine} />

          <TouchableOpacity onPress={handleForgot}>
            <View style={styles.resetButton}>
              <Text style={styles.resetButtonText}>
                Reset Password
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  innerContainer: {
    width: 375,
    height: 812,
    alignSelf: "center",
  },
  headerText: {
    height: 30,
    fontFamily: "Merriweather",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    color: "#303030",
    letterSpacing: 1.2,
    textAlign: "left",
    marginTop: 30,
    marginLeft: 30,
  },
  formContainer: {
    width: 345,
    height: 300,
    backgroundColor: "#ffffff",
    marginTop: 25,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
    marginLeft: 30,
  },
  inputLabel: {
    height: 18,
    fontFamily: "Nunito Sans",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
    color: "#909090",
    marginTop: 30,
    marginLeft: 30,
  },
  textInput: {
    height: 36,
    fontFamily: "Nunito Sans",
    fontSize: 14,
    color: "#303030",
    marginTop: 10,
    marginLeft: 30,
    width: 315,
    paddingVertical: 4,
  },
  inputLine: {
    width: 315,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginTop: 10,
    marginLeft: 30,
  },
  resetButton: {
    width: 285,
    height: 50,
    backgroundColor: "#232323",
    borderRadius: 8,
    marginTop: 50,
    marginLeft: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
    fontFamily: "Nunito Sans",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24.552,
    color: "#ffffff",
    textAlign: "center",
  },
  backText: {
    width: 199,
    height: 19,
    fontFamily: "Nunito Sans",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
    marginTop: 30,
    marginLeft: 73,
    color: "#303030",
  },
});

