import React, { useContext, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartContext } from "./context/CartContext";
import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        Alert.alert("Error", "You must be logged in to proceed.");
        return;
      }

      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        total_price: cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
      };

      const response = await fetch(`http://${API_BASE_URL}:8000/api/orders/create/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Failed to process checkout.");
      }

      Alert.alert("Success", "Order placed successfully!");
      clearCart();
      router.push("/payment-method");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <ImageBackground
              style={styles.backIcon}
              source={require("@/assets/images/back-arrow.png")}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check out</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <Text style={styles.infoText}>Bruno Fernandes</Text>
          <Text style={styles.infoText}>
            25 rue Robert Latouche, Nice, 06200, Côte D’azur, France
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.infoText}>**** **** **** 3947</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>
          <Text style={styles.infoText}>Fast (2-3 days)</Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>Order: $95.00</Text>
          <Text style={styles.summaryText}>Delivery: $5.00</Text>
          <Text style={styles.totalText}>Total: $100.00</Text>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Processing..." : "SUBMIT ORDER"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
    position: "absolute",
    left: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#303030",
  },
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#909090",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#808080",
    marginTop: 5,
  },
  summaryContainer: {
    padding: 16,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#808080",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#232323",
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: "#232323",
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
});
