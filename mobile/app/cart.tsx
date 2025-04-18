import React, { useContext } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { CartContext } from "./context/CartContext";
import Toast from "react-native-toast-message";

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeFromCart, updateCartQuantity } = useContext(CartContext);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity testID="back-button" style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Shopping Cart</Text>

      {cart.length === 0 ? (
        <Text style={styles.emptyCart}>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Image
                source={item.image ? { uri: item.image } : require("../assets/images/react-logo.png")}
                style={styles.image}
              />
              <View style={styles.details}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}>
                    <Text style={styles.button}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateCartQuantity(item.id, item.quantity + 1)}>
                    <Text style={styles.button}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.totalText}>Total: ${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  removeFromCart(item.id);
                  Toast.show({
                    type: "info",
                    text1: "Item Removed",
                    text2: `${item.name} has been removed from your cart.`,
                    position: "top",
                    topOffset: 70,
                  });
                }}
              >
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Checkout Button */}
      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={() => {
          if (cart.length === 0) {
            Toast.show({
              type: "error",
              text1: "Cart is empty",
              text2: "Add items before proceeding to checkout.",
              position: "top",
              topOffset: 70,
            });
            return;
          }
          router.push("/checkout");
        }}
      >
        <Text style={styles.checkoutText}>
          Checkout (${cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white", marginTop: 50 },
  backButton: { position: "absolute", top: 20, left: 20, zIndex: 10 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  emptyCart: { fontSize: 16, textAlign: "center", marginTop: 20 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  image: { width: 60, height: 60, marginRight: 10, borderRadius: 5 },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold" },
  price: { fontSize: 14, color: "gray" },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  button: { fontSize: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#ddd", borderRadius: 5 },
  quantity: { fontSize: 16, marginHorizontal: 10 },
  totalText: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
  remove: { color: "red", fontSize: 14 },
  checkoutButton: { marginTop: 20, backgroundColor: "black", padding: 15, borderRadius: 5, alignItems: "center" },
  checkoutText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
