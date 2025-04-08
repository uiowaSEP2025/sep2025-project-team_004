import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import Constants from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Both fields are required!");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/api-token-auth/`, {
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
      if (response.ok && data.token) {
        await AsyncStorage.setItem("authToken", data.token); 
        
        const userResponse = await fetch(`${API_BASE_URL}/api/users/me/`, {
          method: "GET",
          headers: { "Authorization": `Token ${data.token}` },
        });
  
        const userData = await userResponse.json();
        if (userResponse.ok) {
          await AsyncStorage.setItem("userInfo", JSON.stringify(userData));
          navigation.reset({
            index: 0,
            routes: [{ name: "(tabs)", params: { screen: "home" } }],
          });
        } else {
          setError("Failed to fetch user details. Please try again.");
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    }
    setLoading(false);
    setPassword("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.logoSection}>
          <View style={styles.line} />
          <ImageBackground
            style={styles.logoImage}
            source={require("../assets/images/login_pic.jpg")}
          />
          <View style={styles.line} />
        </View>
        <Text style={styles.welcomeText}>
          <Text style={styles.helloText}>Hello!{"\n"}</Text>
          <Text testID = "login-title" style={styles.welcomeBackText}>WELCOME BACK</Text>
        </Text>
        <View style={styles.formContainer}>
          <Text style={styles.errorText}>
            {error || " "} 
          </Text>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            testID="email-input"
            style={styles.textInput}
            placeholder=" "
            placeholderTextColor="#909090"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.inputLine} />
          <Text style={[styles.inputLabel, { marginTop: 35 }]}>Password</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              testID="password-input"
              style={styles.textInput}
              placeholder=" "
              placeholderTextColor="#909090"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            
          </View>
          <View style={styles.inputLine} />
          <TouchableOpacity onPress={() => navigation.navigate("forgot")}>
            <Text style={styles.forgotPassword}>Forgot Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <View style={styles.loginButton}>
              <Text testID="login-button" style={styles.loginButtonText}>
                {loading ? "Loading..." : "Log in"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("register")}>
            <Text testID="register-button" style={styles.signUp}>SIGN UP</Text>
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
  logoSection: {
    display: "flex",
    width: 315,
    height: 63.96,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 33.871,
    marginLeft: 30,
  },
  line: {
    width: 105,
    height: 1,
    backgroundColor: "#bdbdbd",
  },
  logoImage: {
    width: 63.963,
    height: 63.96,
  },
  welcomeText: {
    width: 216,
    height: 93,
    fontFamily: "Merriweather",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 45,
    marginTop: 30.169,
    marginLeft: 30,
    textAlign: "left",
  },
  helloText: {
    fontFamily: "Merriweather",
    fontSize: 30,
    fontWeight: "400",
    lineHeight: 45,
    color: "#909090",
  },
  welcomeBackText: {
    fontFamily: "Merriweather",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 45,
    color: "#303030",
    letterSpacing: 1.2,
  },
  formContainer: {
    width: 345,
    height: 437,
    backgroundColor: "#ffffff",
    marginTop: 25,
    paddingLeft: 30,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  inputLabel: {
    height: 19,
    fontFamily: "Nunito Sans",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
    color: "#909090",
    marginTop: 15,
  },
  textInput: {
    height: 40,
    fontSize: 16,
    color: "#303030",
    padding: 0,
    marginTop: 10,
  },
  inputLine: {
    width: 315,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginTop: 10,
  },
  passwordIcon: {
    width: 20,
    height: 20,
    position: "absolute",
    right: 0,
    top: 10,
  },
  forgotPassword: {
    width: 140,
    height: 25,
    fontFamily: "Nunito Sans",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24.552,
    color: "#303030",
    textAlign: "center",
    marginTop: 35,
    alignSelf: "center",
  },
  loginButton: {
    width: 285,
    height: 50,
    backgroundColor: "#232323",
    borderRadius: 8,
    marginTop: 40,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",       
  },
  loginButtonText: {
    fontFamily: "Nunito Sans",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24.552,
    color: "#ffffff",
    textAlign: "center",
  },
  
  signUp: {
    width: 73,
    height: 25,
    fontFamily: "Nunito Sans",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24.552,
    color: "#303030",
    textAlign: "center",
    marginTop: 30,
    alignSelf: "center",
  },
});
