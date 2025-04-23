import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { CartContext } from "./context/CartContext";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";
import { GooglePlacesAutocomplete, PlaceType, GooglePlacesAutocompleteRef } from "react-native-google-places-autocomplete";
import { useFocusEffect } from "@react-navigation/native";


interface PaymentMethod {
  id: string; // Stripe uses string IDs like "pm_xxx"
  brand: string;
  last4: string;
  is_default: boolean;
  cardholder_name: string;
  exp_month: number;
  exp_year: number;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

const cardLogos: { [key: string]: any } = {
  amex: require('@/assets/images/card-logo/amex.png'),
  discover: require('@/assets/images/card-logo/discover.png'),
  mastercard: require('@/assets/images/card-logo/mastercard.png'),
  visa: require('@/assets/images/card-logo/visa.png'),
  default: require('@/assets/images/card-brand.png'),
};

export default function CheckoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const { cart, clearCart } = useContext(CartContext);
  const googleRef = useRef<GooglePlacesAutocompleteRef>(null);


  useFocusEffect(
    useCallback(() => {
      fetchCardsAndAddress();
    }, [])
  );
  

  const fetchCardsAndAddress = async () => {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) return;
  
    try {
      // Get Stripe cards
      const cardRes = await fetch(`${API_BASE_URL}/api/payment/stripe-methods/`, {
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
      });
  
      if (cardRes.ok) {
        const cardData = await cardRes.json();
        setCards(cardData);
        const defaultOne = cardData.find((card: any) => card.is_default);
        if (defaultOne) setSelectedCardId(defaultOne.id);
      }
  
      // Get user info (unchanged)
      const storedUser = await AsyncStorage.getItem("userInfo");
      if (storedUser) {
        const profile = JSON.parse(storedUser);
        const fullAddress = [profile.address, profile.city, profile.state, profile.zip_code]
          .filter(Boolean)
          .join(', ');
  
        setShippingAddress(fullAddress);
        setCity(profile.city || '');
        setState(profile.state || '');
        setZipCode(profile.zip_code || '');
  
        setTimeout(() => {
          googleRef.current?.setAddressText(fullAddress);
        }, 100);
      }
    } catch (err) {
      console.error("Error loading Stripe cards or address:", err);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) throw new Error("You must be logged in.");

      // Validate address with Smarty
      const validationRes = await fetch(`${API_BASE_URL}/api/users/validate-address/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: shippingAddress,
          city,
          state,
          zip_code: zipCode,
        }),
      });

      const validationData = await validationRes.json();
      if (!validationRes.ok || !validationData.valid) {
        Toast.show({
          type: "error",
          text1: "Invalid Address",
          text2: validationData.message || "Check your address.",
        });
        return;
      }

      // Use standardized address
      const std = validationData.standardized;
      setShippingAddress(std.address);
      setCity(std.city);
      setState(std.state);
      setZipCode(std.zip_code);

      // Place the order
      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        total_price: cart.reduce((total, item) => total + item.price * item.quantity, 0),
        shipping_address: std.address,
        city: std.city,
        state: std.state,
        zip_code: std.zip_code,
        stripe_payment_method_id: selectedCardId,
      };

      const response = await fetch(`${API_BASE_URL}/api/store/orders/create/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Checkout failed.");

      await clearCart();
      Toast.show({ type: "success", text1: "Order placed!" });
      router.push("/store");
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
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
            const brand = card.brand?.toLowerCase();
            const logoSource = cardLogos[brand] || cardLogos.default;
            const label = `${card.brand.toUpperCase()} ending in ${card.last4} * ${card.exp_month}/${card.exp_year}`;

            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardOption, isSelected && styles.selectedCard]}
                onPress={() => setSelectedCardId(card.id)}
              >
                <Image source={logoSource} style={styles.cardLogo} resizeMode="contain" />
                <Text style={styles.cardLabel}>{label}</Text>
                {isSelected && <MaterialIcons name="check-circle" size={20} color="#007AFF" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Shipping Address Autocomplete */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <GooglePlacesAutocomplete
            ref={googleRef}
            placeholder="Enter your shipping address"
            fetchDetails
            onPress={(data, details = null) => {
              if (details) {
                const components = details.address_components;

                const getComponent = (type: string) =>
                  components.find((c) => c.types.includes(type as PlaceType))?.long_name || '';

                const streetNumber = getComponent("street_number");
                const route = getComponent("route");
                const cityVal = getComponent("locality") || getComponent("sublocality") || getComponent("postal_town");
                const stateVal = getComponent("administrative_area_level_1");
                const zipVal = getComponent("postal_code");

                const fullAddress = `${streetNumber} ${route}`.trim();

                setShippingAddress(fullAddress);
                setCity(cityVal);
                setState(stateVal);
                setZipCode(zipVal);
              }
            }}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
              language: "en",
              components: "country:us",
            }}
            styles={{
              textInput: styles.input,
              container: { flex: 0, marginBottom: 10 },
            }}
            textInputProps={{
              onChangeText: (text) => {
                setShippingAddress(text);
              },
            }}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCheckout}
          disabled={loading || !selectedCardId || !shippingAddress.trim()}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Processing..." : "SUBMIT ORDER"}
          </Text>
        </TouchableOpacity>
      </View>
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
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
