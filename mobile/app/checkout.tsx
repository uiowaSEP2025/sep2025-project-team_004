import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { CartContext } from "./context/CartContext";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

interface PaymentMethod {
  id: number;
  card_type: string;
  last4: string;
  is_default: boolean;
}

const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

const cardLogos: { [key: string]: any } = {
  amex: require('@/assets/images/card-logo/amex.png'),
  discover: require('@/assets/images/card-logo/discover.png'),
  mastercard: require('@/assets/images/card-logo/mastercard.png'),
  visa: require('@/assets/images/card-logo/visa.png'),
  default: require('@/assets/images/card-logo/default-card.png'),
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) return;

      const response = await fetch(`http://${API_BASE_URL}:8000/api/payment/payment-methods/`, {
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCards(data);
        const defaultOne = data.find((card: any) => card.is_default);
        if (defaultOne) setSelectedCardId(defaultOne.id);
      }
    };

    fetchCards();
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) throw new Error("You must be logged in.");

      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        total_price: cart.reduce((total, item) => total + item.price * item.quantity, 0),
      };

      const response = await fetch(`http://${API_BASE_URL}:8000/api/orders/create/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Checkout failed.");
      clearCart();
      Toast.show({ type: "success", text1: "Order placed!" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#303030" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Payment Method */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity onPress={() => router.push("/payment-method?redirectTo=checkout")}>
              <MaterialIcons name="add" size={22} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {cards.map((card) => {
            const isSelected = selectedCardId === card.id;
            const type = card.card_type?.toLowerCase();
            const logoSource = cardLogos[type] || cardLogos.default;
            const label = type
              ? `${type.toUpperCase()} ending in ${card.last4}`
              : `Card ending in ${card.last4}`;

            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardOption, isSelected && styles.selectedCard]}
                onPress={() => setSelectedCardId(card.id)}
              >
                <Image source={logoSource} style={styles.cardLogo} resizeMode="contain" />
                <Text style={styles.cardLabel}>{label}</Text>
                {isSelected && (
                  <MaterialIcons name="check-circle" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCheckout}
          disabled={loading || !selectedCardId}
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
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#303030",
  },
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#909090",
    marginBottom: 8,
  },
  cardOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
  },
  selectedCard: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  cardLogo: {
    width: 40,
    height: 24,
    marginRight: 12,
  },
  cardLabel: {
    flex: 1,
    fontSize: 14,
    color: "#303030",
  },
  submitButton: {
    backgroundColor: "#232323",
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
});
