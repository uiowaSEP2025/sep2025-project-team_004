import React from "react";
import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import  Constants  from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams();

  useEffect(() => {
    if (!session_id) return;

    const confirmSession = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/payment/confirm-checkout-session/?session_id=${session_id}`
        );
        const data = await res.json();

        if (res.ok) {
          // Success – maybe show a message or navigate
          console.log("Payment confirmed!", data);
          router.replace("/payment-method"); // Or wherever
        } else {
          console.error("Stripe session confirmation failed:", data);
        }
      } catch (err) {
        console.error("Error confirming session:", err);
      }
    };

    confirmSession();
  }, [session_id]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Verifying payment...</Text>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, marginBottom: 16 },
});