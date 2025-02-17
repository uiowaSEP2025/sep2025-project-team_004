import React, {useState} from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions} from "react-native";
import {useNavigation} from "@react-navigation/native";
import { RootStackParamList } from "../types";

export default function ForgotScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  const handleForgot = () => {
    if (!email) {
      setError("Email is required!");
      return;
    }
    setError("");
    };
return (
    <View style={styles.container}>

        <Text testID='forgot-title' style={styles.title}>Forgot Password</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            />
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
      justifyContent: 'space-between', // or 'center', or any alignment you prefer
      alignItems: 'center',
    },
    button: {
      // Your button styles
      padding: 10,
      backgroundColor: '#007BFF',
      marginHorizontal: 5, // Add some horizontal margin between buttons
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
