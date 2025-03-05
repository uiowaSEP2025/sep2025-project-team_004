import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { CartContext } from "../context/CartContext";
import { RootStackParamList } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";


// Define the Product Type
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export default function StoreScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  
  const router = useRouter();
  const cartContext = useContext(CartContext);
  if (!cartContext) {
    throw new Error("CartContext must be used within a CartProvider");
  }
  const { cart, addToCart } = cartContext;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  useEffect(() => {
    fetch("http://localhost:8000/api/store/products/")
      .then((response) => response.json())
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />;
  }

  const openModal = (product: Product) => {
    setSelectedProduct({ ...product, price: Number(product.price) });  
    setQuantity(1);
    setModalVisible(true);
  };
  

  const handleAddToCart = () => {
    if (selectedProduct) {
      const cartItem = {
        ...selectedProduct, 
        quantity, 
      };
      addToCart(cartItem, quantity);
      setModalVisible(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Feather name="search" size={24} color="black" />
        <Text style={styles.title}>Make your community BETTER</Text>
        <TouchableOpacity testID="top-cart-button" 
          onPress={() => router.push("/cart")}>
          <Feather name="shopping-cart" size={24} color="black" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Image source={item.image ? { uri: item.image } : require("../../assets/images/react-logo.png")} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
            <TouchableOpacity
              testID={`cart-button-${item.id}`}
              style={styles.cartButton}
              onPress={() => openModal(item)}
            >
              <MaterialIcons name="shopping-cart" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        )}
      />
      
      {/* Add to Cart Modal */}
      <Modal testID="product-modal" visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <Image source={selectedProduct.image ? { uri: selectedProduct.image } : require("../../assets/images/react-logo.png")} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text style={styles.modalPrice}>
                  ${(Number(selectedProduct.price) * quantity).toFixed(2)}
                </Text>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Feather name="minus-circle" size={24} color="black" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity testID="plus-button" onPress={() => setQuantity(quantity + 1)}>
                    <Feather name="plus-circle" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButton} onPress={handleAddToCart}>
                    <Text style={styles.modalButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  categoryScroll: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 60,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: "center", 
  },
  activeCategory: {
    backgroundColor: "black",
  },
  categoryText: {
    marginLeft: 5,
    fontSize: 14,
    color: "black",
  },
  activeText: {
    color: "white",
  },
  grid: {
    paddingHorizontal: 10,
  },
  productCard: {
    flex: 1,
    alignItems: "center",
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    padding: 10,
  },
  productImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  cartButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 6,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 8,
  },
  fixedHeader: {
    position: "absolute",
    top: 40, 
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 10,
    zIndex: 10, 
    elevation: 5, 
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", 
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalPrice: {
    fontSize: 16,
    color: "gray",
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: "black",
    borderRadius: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "gray",
  },
  
});
