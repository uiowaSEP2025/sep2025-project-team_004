import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import showMessage from "../hooks/useAlert";
import { RootStackParamList } from "../types";
import Constants from "expo-constants";

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { useToast, useAlert } = showMessage();
  const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;
  

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      
      const response = await fetch(`${API_BASE_URL}/api/users/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username: username,
          email: email,
          password: password,
        }),
      });
      
      const data = await response.json();
      console.log("Backend response:", data);
      if (response.ok) {
        setFirstName("");
        setLastName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        useToast("Success", "Account created successfully!");
        navigation.navigate("index");
      } else {
        let errorMessage = "Failed to register.";
        if (data.errors) {
          errorMessage = Object.values(data.errors).flat().join("\n");
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.headerText} testID="register-title" numberOfLines={1}>
          WELCOME!
        </Text>

        <View style={styles.formContainer}>
          <Text style={styles.errorText}>
            {error || " "} 
          </Text>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.inputNameLabel}>First Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="First Name"
                placeholderTextColor="#909090"
                value={firstName}
                onChangeText={setFirstName}
              />
              <View style={styles.inputLineName} />
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.inputNameLabel}>Last Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Last Name"
                placeholderTextColor="#909090"
                value={lastName}
                onChangeText={setLastName}
              />
              <View style={styles.inputLineName} />
            </View>
          </View>

          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Username"
            placeholderTextColor="#909090"
            value={username}
            onChangeText={setUsername}
          />
          <View style={styles.inputLine} />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            placeholderTextColor="#909090"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.inputLine} />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#909090"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <ImageBackground
              style={styles.passwordIcon}
              source={{
                uri:
                  "https://static.codia.ai/custom_image/2025-03-29/014442/password-visibility-icon.svg",
              }}
              resizeMode="cover"
            />
          </View>
          <View style={styles.inputLine} />

          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Confirm Password"
              placeholderTextColor="#909090"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <ImageBackground
              style={styles.confirmPasswordIcon}
              source={{
                uri:
                  "https://static.codia.ai/custom_image/2025-03-29/014442/confirm-password-visibility-icon.svg",
              }}
              resizeMode="cover"
            />
          </View>
          <View style={styles.inputLine} />

          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <View style={styles.signupButton}>
              <Text style={styles.signupButtonText}>
                {loading ? "Registering..." : "SIGN UP"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}> 
              Already have account? SIGN IN
            </Text>
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
    height: 600,
    backgroundColor: "#ffffff",
    marginTop: 0,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "left",
    marginLeft: 30,
    marginTop: 30,
  },
  inputNameLabel: {
    height: 18,
    fontFamily: "Nunito Sans",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
    color: "#909090",
    marginTop: 0,
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
    height: 20,
    fontFamily: "Nunito Sans",
    fontSize: 14,
    color: "#303030",
    marginTop: 10,
    marginLeft: 30,
    width: 315,
  },
  inputLine: {
    width: 315,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginTop: 10,
    marginLeft: 30,
  },
  inputContainer: {
    position: "relative",
  },
  passwordIcon: {
    width: 20,
    height: 20,
    position: "absolute",
    top: 10,
    left: 300,
  },
  confirmPasswordIcon: {
    width: 20,
    height: 20,
    position: "absolute",
    top: 10,
    left: 300,
  },
  signupButton: {
    width: 285,
    height: 50,
    backgroundColor: "#232323",
    borderRadius: 8,
    marginTop: 50,
    marginLeft: 30,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  signupButtonText: {
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
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 30,
    marginRight: 30,
    marginTop: 20,
  },
  nameContainer: {
    flex: 1,
  },
  nameInput: {
    height: 40,
    fontFamily: "Nunito Sans",
    fontSize: 14,
    color: "#303030",
    marginTop: 10,
    marginRight: 5,
  },
  inputLineName: {
    height: 2,
    backgroundColor: "#e0e0e0",
    marginTop: 10,
  },
});
