import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartContext } from "./context/CartContext";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import { MaterialIcons } from '@expo/vector-icons';


interface PaymentMethod {
  id: number;
  payment_type: string;
  card_number: string;
  expiration_date: string;
  cardholder_name: string;
  billing_address: string;
  is_default: boolean;
  created_at: string;
  user_id: number;
  card_type: string;
  last4: string;
}


const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [defaultCard, setDefaultCard] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    const fetchDefaultCard = async () => {
      try {
        const authToken = await AsyncStorage.getItem("authToken");
        if (!authToken) return;

        const response = await fetch(`http://${API_BASE_URL}:8000/api/payment/payment-methods/`, {
          method: "GET",
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch payment methods");
          return;
        }

        const data = await response.json();
        const defaultOne = data.find((card: any) => card.is_default);
        if (defaultOne) {
          setDefaultCard(defaultOne);
        }
      } catch (error) {
        console.error("Error fetching default payment method:", error);
      }
    };

    fetchDefaultCard();
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "You must be logged in to proceed.",
          position: "top",
          topOffset: 70,
        });
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

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Order placed successfully!",
        position: "top",
        topOffset: 70,
      });
      clearCart();
      router.push("/payment-method");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
        position: "top",
        topOffset: 70,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()}>
           <MaterialIcons name="edit" size={20} color="#303030" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check out</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <Text style={styles.infoText}>Bruno Fernandes</Text>
          <Text style={styles.infoText}>
            25 rue Robert Latouche, Nice, 06200, Côte D’azur, France
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <TouchableOpacity onPress={() => router.push("/payment-method")}> 
              <Image
                source={require("@/assets/images/add-icon.png")}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoText}>
            {defaultCard ? `${defaultCard.card_type?.toUpperCase()} ending in ${defaultCard.last4}` : "No default card saved."}
          </Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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