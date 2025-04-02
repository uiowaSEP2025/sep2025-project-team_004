import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Platform, 
  Modal,
  TextInput,
  Alert
} from "react-native";
import Constants from "expo-constants";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Define the Order (or Product) type.
interface Order {
  id: number;
  name: string;
  description: string;
  price: number | string;
  image?: string;
  orderDate?: string;
}

const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state.
  const [searchQuery, setSearchQuery] = useState("");

  // States for review modal.
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");

  // Use Expo Router's useRouter hook.
  const router = useRouter();

  // Fetch products from the backend.
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://${API_BASE_URL}:8000/api/store/products/`);
        const data: Order[] = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter orders based on search query.
  const filteredOrders = orders.filter(order => 
    order.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handler for the Return button.
  const handleReturn = (order: Order) => {
    console.log("Return product with id", order.id);
    router.push("/orders"); // Navigate to the orders screen.
  };

  // Handler for the Review button.
  const handleReview = (order: Order) => {
    console.log("Review product with id", order.id);
    setSelectedReviewOrder(order);
    setRating(0);
    setReviewText("");
    setReviewModalVisible(true);
  };

  // Submit the review via an API POST call.
  const submitReview = async () => {
    if (!selectedReviewOrder) return;

    if (rating < 1 || rating > 5) {
      Alert.alert("Please select a rating between 1 and 5.");
      return;
    }

    const reviewData = {
      product: selectedReviewOrder.id,
      rating,
      comment: reviewText,
    };

    console.log("Submitting review payload:", reviewData);

    try {
      const response = await fetch(`http://${API_BASE_URL}:8000/api/store/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to submit review", response.statusText, errorData);
        Alert.alert("Error", "Failed to submit review. Please try again later.");
        return;
      }

      console.log("Review submitted successfully.");
      Alert.alert("Success", "Your review has been submitted.");
      setReviewModalVisible(false);
      router.push("/orders");
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "An error occurred while submitting your review.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator testID="loading-indicator" size="large" color="blue" />
      </View>
    );
  }

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <Image 
        testID={`order-image-${item.id}`}
        source={ item.image ? { uri: item.image } : { uri: "https://via.placeholder.com/150" } }
        style={styles.orderImage} 
      />
      <View style={styles.orderDetails}>
        <Text style={styles.orderName}>{item.name}</Text>
        <Text style={styles.orderDate}>Ordered on: {item.orderDate || "N/A"}</Text>
        <Text style={styles.orderPrice}>${Number(item.price).toFixed(2)}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.returnButton} onPress={() => handleReturn(item)}>
            <Text style={styles.buttonText}>Return</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reviewButton} onPress={() => handleReview(item)}>
            <Text style={styles.buttonText}>Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} testID={`star-${i}`} onPress={() => setRating(i)}>
          <MaterialIcons 
            name={i <= rating ? "star" : "star-border"} 
            size={32} 
            color="gold" 
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order History</Text>
      {/* Search Input */}
      <TextInput
        testID="search-input"
        style={styles.searchInput}
        placeholder="Search for products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
      />
      
      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View testID="product-modal" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Review Product</Text>
            {renderStarRating()}
            <TextInput
              testID="review-text-input"
              style={styles.textInput}
              placeholder="Write your review (max 255 characters)"
              maxLength={255}
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={submitReview}>
                <Text style={styles.buttonText}>Submit Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReviewModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "web" ? 10 : 70,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginVertical: 8,
    padding: 10,
    elevation: 2,
  },
  orderImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    resizeMode: "contain",
  },
  orderDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  orderName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  orderDate: {
    fontSize: 14,
    color: "gray",
    marginVertical: 5,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  returnButton: {
    backgroundColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10,
  },
  reviewButton: {
    backgroundColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  textInput: {
    width: "100%",
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  submitButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: "gray",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
});
