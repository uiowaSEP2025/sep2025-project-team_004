import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === 'true'
    ? `http://${Constants.expoConfig?.hostUri?.split(':').shift() ?? 'localhost'}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminOrders() {
  type OrderStatus = 'Out for Delivery' | 'Processing' | 'Canceled';

  type OrderDetail = {
    id: number;
    stripe_payment_method_id: string | null;
    shipping_address: string;
    city: string;
    state: string;
    zip_code: string;
    total_price: string;
    status: string;
    tracking_number: string | null;
    created_at: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
    items: {
      product_name: string;
      product_price: string;
      quantity: number;
    }[];
  };
  const [selectedTab, setSelectedTab] = useState<OrderStatus>('Out for Delivery');
  const [ordersData, setOrdersData] = useState<{ [key in OrderStatus]: any[] }>({
    'Out for Delivery': [],
    Processing: [],
    Canceled: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  const router = useRouter();
  const tabContainerWidth = Dimensions.get('window').width;
  const tabWidth = tabContainerWidth / 3;
  const tabs: OrderStatus[] = ['Out for Delivery', 'Processing', 'Canceled'];
  const indicatorLeft = tabs.indexOf(selectedTab) * tabWidth + (tabWidth * 0.5);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      fetchOrders(1);
    }, [])
  );
  
  const fetchOrders = async (pageNum = 1) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;
  
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/api/store/orders/admin/?page=${pageNum}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
  
    const data = await res.json();
    setLoading(false);
  
    const newOrdersByStatus: Record<OrderStatus, OrderDetail[]> = {
      'Out for Delivery': [],
      Processing: [],
      Canceled: [],
    };
  
    for (const order of data.results || []) {
      const status = (
        order.status === 'out_for_delivery'
          ? 'Out for Delivery'
          : order.status === 'cancelled'
          ? 'Canceled'
          : 'Processing' ) as OrderStatus;
      newOrdersByStatus[status].push(order);
    }
  
    if (pageNum === 1) {
      setOrdersData(newOrdersByStatus);
    } else {
      setOrdersData(prev => {
        const updated = { ...prev };
        for (const status of Object.keys(newOrdersByStatus) as OrderStatus[]) {
          updated[status] = [...prev[status], ...newOrdersByStatus[status]];
        }
        return updated;
      });
    }
    setHasNext(!!data.next);
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrderId) return;
    const token = await AsyncStorage.getItem('authToken');

    try {
      const res = await fetch(`${API_BASE_URL}/api/store/orders/update/${selectedOrderId}/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "out_for_delivery",
          tracking_number: trackingNumber,
        }),
      });

      if (!res.ok) throw new Error("Failed to update order");
      setShowModal(false);
      setTrackingNumber('');
      setSelectedOrderId(null);
      const refreshedOrder = await res.json();
      setOrdersData(prev => {
        const updated = { ...prev };
      
        if (!updated['Out for Delivery']) updated['Out for Delivery'] = [];
        if (!updated['Processing']) updated['Processing'] = [];

        const cleanedOrder = { ...refreshedOrder, status: 'out_for_delivery' };
      
        updated['Out for Delivery'].push(cleanedOrder);
        updated['Processing'] = updated['Processing'].filter(o => o.id !== refreshedOrder.id);
      
        return updated;
      });
    } catch (error) {
      console.error("Error completing order:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ImageBackground
              style={styles.backIcon}
              source={require('@/assets/images/back-arrow.png')}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Orders</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.orderTabs}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab)}>
              <Text style={selectedTab === tab ? styles.tabActive : styles.tabInactive}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.tabIndicator, { marginLeft: indicatorLeft }]} />
      </View>

      <ScrollView style={styles.scrollContainer} 
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        if (isCloseToBottom && hasNext && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchOrders(nextPage);
        }
      }}
      scrollEventThrottle={400}
      >
        <View style={styles.contentContainer}>
          {(ordersData[selectedTab] || []).map(order => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderNo}>{`Order #${order.id}`}</Text>
                <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.orderCardDetail}>
                <Text style={styles.totalAmount}>
                </Text>
                <Text style={styles.orderTotal}>
                  <Text style={styles.detailLabel}>Total Amount: </Text>
                  <Text style={styles.totalAmount}>${Number(order.total_price).toFixed(2)}</Text>
                </Text>
              </View>
              <View style={styles.orderCardFooter}>
                <TouchableOpacity style={styles.detailButton} onPress={() => setSelectedOrderDetails(order)}>
                    <Text style={styles.detailButtonText}>Details</Text>
                  </TouchableOpacity>

                  {selectedTab === 'Processing' ? (
                    <TouchableOpacity
                      style={[styles.detailButton]}
                      onPress={() => {
                       setSelectedOrderId(order.id);
                        setShowModal(true);
                     }}
                   >
                      <Text style={styles.detailButtonText}>Complete</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.orderStatus,
                          {
                            color:
                             order.status === 'out_for_delivery'
                                ? '#27ae60'
                                : order.status === 'processing'
                               ? '#F79E1B'
                                : '#EB001B',
                         },
                       ]}
                     >
                       {selectedTab}
                     </Text>
                     {order.tracking_number && (
                       <Text style={styles.trackingNumber}>
                         Tracking No. {order.tracking_number}
                       </Text>
                     )}
                   </View>
                  )}
                </View>
            </View>
          ))}
          {loading && (
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <Text style={{ color: '#888' }}>Loading more orders...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter Tracking Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Tracking Number"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleCompleteOrder}>
              <Text style={styles.modalButtonText}>Complete Order</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {selectedOrderDetails && (
        <Modal
            transparent
            animationType="slide"
         visible={!!selectedOrderDetails}
         onRequestClose={() => setSelectedOrderDetails(null)}
         >
            <View style={styles.modalOverlay}>
             <View style={styles.detailsModalBox}>
              <Text style={styles.modalTitle}>Order #{selectedOrderDetails.id}</Text>

              <Text style={styles.modalText}>
               <Text style={styles.modalLabel}>Customer: </Text>
               {selectedOrderDetails.user.first_name} {selectedOrderDetails.user.last_name}
             </Text>

             <Text style={styles.modalText}>
               <Text style={styles.modalLabel}>Email: </Text>
               {selectedOrderDetails.user.email}
             </Text>

             <Text style={styles.modalText}>
               <Text style={styles.modalLabel}>Shipping Address:{"\n"}</Text>
               {selectedOrderDetails.shipping_address}{"\n"}
               {selectedOrderDetails.city}, {selectedOrderDetails.state} {selectedOrderDetails.zip_code}
             </Text>

             <Text style={styles.modalText}>
               <Text style={styles.modalLabel}>Products:</Text>
              </Text>
              {selectedOrderDetails.items.map((item, idx) => (
                <Text key={idx} style={styles.modalText}>
                  - {item.quantity}x {item.product_name} @ ${item.product_price}
                </Text>
              ))}

             <Text style={styles.modalText}>
               <Text style={styles.modalLabel}>Total: </Text>${Number(selectedOrderDetails.total_price).toFixed(2)}
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Status: </Text>{selectedOrderDetails.status}
               </Text>

             <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Order Date: </Text>
                {new Date(selectedOrderDetails.created_at).toLocaleDateString()}
               </Text>

             <TouchableOpacity onPress={() => setSelectedOrderDetails(null)} style={styles.modalButton}>
               <Text style={styles.modalButtonText}>Close</Text>
             </TouchableOpacity>
            </View>
         </View>
         </Modal>
        )}
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
      detailButton: {
        width: 100,
        height: 36,
        backgroundColor: '#232323',
        borderRadius: 4,
        justifyContent: 'center',
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
        color: '#27ae60',
        textAlign: 'right',
      },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
      },
      modalButton: {
        backgroundColor: '#27ae60',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginBottom: 8,
      },
      modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
      },
      modalCancel: {
        color: '#007AFF',
        fontSize: 16,
      },
      detailsModalBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        width: '85%',
        alignSelf: 'center',
        marginTop: '30%',
        elevation: 10,
      },      
      modalText: {
        fontSize: 14,
        marginVertical: 4,
        fontFamily: 'Nunito Sans',
        color: '#232323',
      },
      modalLabel: {
        fontWeight: '700',
        color: '#303030',
      },
      trackingNumber: {
        fontFamily: 'Nunito Sans',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        color: '#232323',
        marginLeft: 8,
      },
});