import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, TextInput, Platform } from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { CartContext } from "../context/CartContext";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

// Base URL configuration
const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

// Define the Product Type
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
}

// Define a Review Type (adjust fields as per your backend)
interface Review {
  id: number;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function StoreScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
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

  // Fetch products
  useEffect(() => {
    fetch(`http://${API_BASE_URL}:8000/api/store/products/`)
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

  // Fetch reviews with error checking for the response format
  useEffect(() => {
    fetch(`http://${API_BASE_URL}:8000/api/store/reviews/`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Reviews API response:", data);
        // If the response is an array, use it directly.
        if (Array.isArray(data)) {
          setReviews(data);
        } 
        // If the response is an object with a 'reviews' property that is an array.
        else if (data && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        } else {
          console.error("Unexpected reviews response format:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
      });
  }, []);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="blue"
        style={{ marginTop: Platform.OS === "web" ? 20 : 70 }}
      />
    );
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
        <TouchableOpacity
          testID="top-cart-button"
          onPress={() => router.push("/cart")}
        >
          <Feather name="shopping-cart" size={24} color="black" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.fixedHeader}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Feather name="x-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          // Filter reviews related to the current product
          const productReviews = reviews.filter(
            (review) => review.productId === item.id
          );
          const avgRating = productReviews.length
            ? (
                productReviews.reduce((sum, review) => sum + review.rating, 0) /
                productReviews.length
              ).toFixed(1)
            : null;
          return (
            <View style={styles.productCard}>
              <Image
                source={
                  item.image
                    ? { uri: item.image }
                    : require("../../assets/images/react-logo.png")
                }
                style={styles.productImage}
              />
              <Text style={styles.productName}>{item.name}</Text>
              {/* Display product description */}
              <Text style={styles.productDescription}>{item.description}</Text>
              <Text style={styles.productPrice}>
                ${Number(item.price).toFixed(2)}
              </Text>
              {avgRating && (
                <Text style={styles.reviewRating}>
                  {avgRating} ⭐ ({productReviews.length})
                </Text>
              )}
              <TouchableOpacity
                testID={`cart-button-${item.id}`}
                style={styles.cartButton}
                onPress={() => openModal(item)}
              >
                <MaterialIcons name="shopping-cart" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
      
      {/* Add to Cart Modal */}
      <Modal testID="product-modal" visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <Image
                  source={
                    selectedProduct.image
                      ? { uri: selectedProduct.image }
                      : require("../../assets/images/react-logo.png")
                  }
                  style={styles.modalImage}
                />
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
                
                {reviews.filter((review) => review.productId === selectedProduct.id).length > 0 && (
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewSectionTitle}>Reviews:</Text>
                    {reviews
                      .filter((review) => review.productId === selectedProduct.id)
                      .map((review) => (
                        <View key={review.id} style={styles.reviewItem}>
                          <Text style={styles.reviewRatingText}>{review.rating} ⭐</Text>
                          <Text style={styles.reviewComment}>{review.comment}</Text>
                        </View>
                      ))}
                  </View>
                )}
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
    paddingTop: Platform.OS === "web" ? 10 : 70,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    marginTop: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
  productDescription: {
    fontSize: 12,
    color: "gray",
    marginVertical: 4,
    textAlign: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  reviewRating: {
    marginTop: 4,
    fontSize: 12,
    color: "gray",
  },
  cartButton: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 10 : -5,
    right: Platform.OS === "web" ? 340 : 10,
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
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingTop: 10,
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
  reviewSection: {
    marginTop: 15,
    width: "100%",
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 5,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  reviewComment: {
    fontSize: 14,
    color: "gray",
  },
});
