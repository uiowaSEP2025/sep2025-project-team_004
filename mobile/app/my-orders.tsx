import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Order() {
  // Order Status type definition
  type OrderStatus = 'Delivered' | 'Processing' | 'Canceled';
  
  // State for selected tab
  const [selectedTab, setSelectedTab] = useState<OrderStatus>('Delivered');
  const tabs: OrderStatus[] = ['Delivered', 'Processing', 'Canceled'];
  const router = useRouter();

  // Replace dummy order data with state that will hold fetched orders grouped by status.
  const [ordersData, setOrdersData] = useState({
    Delivered: [] as any[],
    Processing: [] as any[],
    Canceled: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  // Review Modal related states
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<any>(null);

  // Use Expo Constants to build API base URL.
  const API_BASE_URL =
    Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

  // Fetch orders when the component mounts.
  useEffect(() => {
    async function fetchOrders() {
      try {
        // For example, fetching orders for the current logged-in user
        const response = await fetch(`http://${API_BASE_URL}:8000/api/store/orders/my/`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Group orders by status
        const groupedOrders = {
          Delivered: [] as any[],
          Processing: [] as any[],
          Canceled: [] as any[],
        };
        data.forEach((order: any) => {
          if (order.status === 'Delivered') {
            groupedOrders.Delivered.push(order);
          } else if (order.status === 'Processing') {
            groupedOrders.Processing.push(order);
          } else if (order.status === 'Canceled') {
            groupedOrders.Canceled.push(order);
          }
        });
        
        setOrdersData(groupedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        Alert.alert('Error', 'Failed to fetch orders.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [API_BASE_URL]);

  // Calculate tab widths and indicator position.
  const tabContainerWidth = Dimensions.get('window').width;
  const tabWidth = tabContainerWidth / tabs.length;
  const indicatorLeft = tabs.indexOf(selectedTab) * tabWidth + (tabWidth * 0.33);

  // ----------------- Review Functionality ----------------- //
  const handleReview = (order: any) => {
    setSelectedReviewOrder(order);
    setRating(0);
    setReviewText('');
    setReviewModalVisible(true);
  };

  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <MaterialIcons
            name={i <= rating ? 'star' : 'star-border'}
            size={32}
            color="gold"
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

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
  // ----------------- End Review Functionality ----------------- //

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-button" onPress={() => router.back()}>
            <ImageBackground
              style={styles.backIcon}
              source={require('@/assets/images/back-arrow.png')}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            My order
          </Text>
          <ImageBackground
            style={styles.searchIcon}
            source={{ uri: 'https://static.codia.ai/custom_image/2025-03-28/231016/search-icon.svg' }}
            resizeMode="cover"
          />
        </View>

        <View style={styles.orderTabs}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab)}>
              <Text
                style={selectedTab === tab ? styles.tabActive : styles.tabInactive}
                numberOfLines={1}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.tabIndicator, { marginLeft: indicatorLeft }]} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#232323" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={styles.scrollContainer} contentInsetAdjustmentBehavior="automatic">
          <View style={styles.contentContainer}>
            {ordersData[selectedTab].length > 0 ? (
              ordersData[selectedTab].map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <Text style={styles.orderNo} numberOfLines={1}>
                      {order.orderNo}
                    </Text>
                    <Text style={styles.orderDate} numberOfLines={1}>
                      {order.orderDate}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.orderCardDetail}>
                    <Text style={styles.totalAmount}>
                      <Text style={styles.detailLabel}>Quantity:</Text>
                      <Text style={styles.detailValue}> {order.quantity}</Text>
                    </Text>
                    <Text style={styles.orderTotal}>
                      <Text style={styles.detailLabel}>Total Amount: </Text>
                      <Text style={styles.totalAmount}>{order.totalAmount}</Text>
                    </Text>
                  </View>
                  <View style={styles.orderCardFooter}>
                    <View style={styles.buttonGroup}>
                      <TouchableOpacity style={styles.detailButton}>
                        <Text style={styles.detailButtonText} numberOfLines={1}>
                          Detail
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.reviewButton} onPress={() => handleReview(order)}>
                        <Text style={styles.detailButtonText} numberOfLines={1}>
                          Review
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text
                      style={[
                        styles.orderStatus,
                        {
                          color:
                            order.status === 'Delivered'
                              ? '#27ae60'
                              : order.status === 'Processing'
                              ? '#F79E1B'
                              : order.status === 'Canceled'
                              ? '#EB001B'
                              : '#27ae60',
                        },
                      ]}
                      numberOfLines={1}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>
                No orders found in this category.
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Review Product</Text>
            {renderStarRating()}
            <TextInput
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  fixedHeader: {
    width: 375,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },
  backIconContainer: {
    width: 20,
    height: 20,
    zIndex: 5,
  },
  backIcon: {
    width: 20,
    height: 20,
    marginTop: 3.5,
    marginLeft: 6.75,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Merriweather',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    color: '#303030',
    textAlign: 'center',
    zIndex: 7,
  },
  searchIcon: {
    width: 20,
    height: 20,
    zIndex: 8,
  },
  orderTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 335,
    height: 25,
    marginTop: 12,
    marginLeft: 27,
  },
  tabActive: {
    fontFamily: 'Nunito Sans',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24.552,
    color: '#232323',
    textAlign: 'left',
  },
  tabInactive: {
    fontFamily: 'Nunito Sans',
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 24.552,
    color: '#999999',
    textAlign: 'center',
  },
  tabIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#232323',
    borderRadius: 4,
    marginTop: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  orderCard: {
    width: 335,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 32,
    alignSelf: 'center',
    paddingBottom: 16,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 21,
    height: 22,
  },
  orderNo: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21.824,
    color: '#232323',
    textAlign: 'left',
  },
  orderDate: {
    fontFamily: 'Nunito Sans',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    color: '#808080',
    textAlign: 'right',
  },
  divider: {
    width: 335,
    height: 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginTop: 10,
  },
  orderCardDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 21,
    height: 22,
  },
  detailLabel: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21.824,
    color: '#808080',
  },
  detailValue: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21.824,
    color: '#232323',
  },
  orderTotal: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21.824,
    color: '#232323',
    textAlign: 'left',
  },
  totalAmount: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21.824,
    color: '#232323',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 21,
    height: 36,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailButton: {
    width: 100,
    height: 36,
    backgroundColor: '#232323',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewButton: {
    width: 100,
    height: 36,
    backgroundColor: '#232323',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  detailButtonText: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21.824,
    color: '#ffffff',
    textAlign: 'center',
  },
  orderStatus: {
    fontFamily: 'Nunito Sans',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21.824,
    textAlign: 'right',
  },
  // ----------------- Review Modal Styles ----------------- //
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  textInput: {
    width: '100%',
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  submitButton: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
