// app/HomeScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types"; 

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Both fields are required!");
      console.log("Error set:", "Both fields are required!");
      return;
    }
    setError("");
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
                    