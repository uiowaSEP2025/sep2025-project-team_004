import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "./types"; 

const API_URL = "http://127.0.0.1:8000/api/users/api-token-auth/";  

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Both fields are required!");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,  // Django expects "username" instead of "email"
          password: password,
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok && data.token) {
        await AsyncStorage.setItem("authToken", data.token); 
        
        const userResponse = await fetch("http://127.0.0.1:8000/api/users/me/", {
          method: "GET",
          headers: { "Authorization": `Token ${data.token}` },
        });
  
        const userData = await userResponse.json();
        if (userResponse.ok) {
          await AsyncStorage.setItem("userInfo", JSON.stringify(userData));
          navigation.reset({ index: 0, routes: [{ name: "(tabs)", params: { screen: "home" } }] });
        } else {
          console.error("Failed to fetch user details:", userData);
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again later.");
    }
  
    setPassword("");
  };

  return (
    <View style={styles.container}>
      <Text testID="login-title" style={styles.title}>Login</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          testID="login-button"
          style={styles.button} 
          onPress={handleLogin}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="register-button"
          style={styles.button}
          onPress={() => navigation.navigate("register")}
          accessibilityRole="button" 
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        testID="forgot-button"
        style={styles.registerButton}
        onPress={() => navigation.navigate("forgot")}
        accessibilityRole="button"
      >
        <Text style={styles.registerText}>Forgot Password?</Text>
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
    width: Dimensions.get("window").width * 0.305,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  button: {
    padding: 10,
    backgroundColor: '#007BFF',
    marginHorizontal: 5,
    borderRadius: 5,
    width: Dimensions.get("window").width * 0.15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 15,
  },
  registerText: {
    color: "blue",
    fontSize: 14,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
});


