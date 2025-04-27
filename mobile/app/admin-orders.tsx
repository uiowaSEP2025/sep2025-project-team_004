// AdminOrders.tsx
import React, { useState, useCallback } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import Constants from 'expo-constants'
import { useAdminOrders, OrderStatus, OrderDetail } from '../hooks/useAdminOrders'

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === 'true'
    ? `http://${Constants.expoConfig?.hostUri?.split(':').shift() || 'localhost'}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL!

export default function AdminOrders() {
  const router = useRouter()
  // pull in everything from your hook
  const { orders, loading, hasNext, fetchOrders, completeOrder } =
    useAdminOrders(API_BASE_URL)

  const [selectedTab, setSelectedTab] = useState<OrderStatus>('Out for Delivery')
  const [page, setPage] = useState(1)

  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')

  const [detailsOrder, setDetailsOrder] = useState<OrderDetail | null>(null)

  // 1) On focus: reset page, re-fetch
  useFocusEffect(
    useCallback(() => {
      setPage(1)
      fetchOrders(1)
    }, [fetchOrders])
  )

  // 2) infinite scroll handler
  const onScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
    if (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20 &&
      hasNext &&
      !loading
    ) {
      const next = page + 1
      setPage(next)
      fetchOrders(next)
    }
  }

  // 3) when you press “Complete”
  const handleComplete = async () => {
    if (currentOrderId != null) {
      await completeOrder(currentOrderId, trackingNumber)
    }
    setShowCompleteModal(false)
    setTrackingNumber('')
    setCurrentOrderId(null)
  }

  // UI math for the tab indicator
  const tabWidth = Dimensions.get('window').width / 3
  const tabs: OrderStatus[] = ['Out for Delivery', 'Processing', 'Canceled']
  const indicatorLeft = tabs.indexOf(selectedTab) * tabWidth + tabWidth * 0.5

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── HEADER & TABS ───────────────────── */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={router.back}>
            <ImageBackground
              source={require('@/assets/images/back-arrow.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Orders</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.orderTabs}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab)}>
              <Text style={selectedTab === tab ? styles.tabActive : styles.tabInactive}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.tabIndicator, { marginLeft: indicatorLeft }]} />
      </View>

      {/* ─── ORDERS LIST ─────────────────────── */}
      <ScrollView
        style={styles.scrollContainer}
        onScroll={onScroll}
        scrollEventThrottle={200}
      >
        {orders[selectedTab].map(o => (
          <View key={o.id} style={styles.orderCard}>
            <Text>Order #{o.id}</Text>
            <TouchableOpacity onPress={() => setDetailsOrder(o)}>
              <Text>Details</Text>
            </TouchableOpacity>
            {selectedTab === 'Processing' && (
              <TouchableOpacity
                onPress={() => {
                  setCurrentOrderId(o.id)
                  setShowCompleteModal(true)
                }}
              >
                <Text>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {loading && <Text>Loading more orders…</Text>}
      </ScrollView>

      {/* ─── COMPLETE ORDER MODAL ───────────── */}
      <Modal visible={showCompleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text>Enter Tracking Number</Text>
            <TextInput
              placeholder="Tracking Number"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              style={styles.modalInput}
            />
            <TouchableOpacity onPress={handleComplete}>
              <Text>Complete Order</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCompleteModal(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── DETAILS MODAL ──────────────────── */}
      {detailsOrder && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalBox}>
              <Text>Order #{detailsOrder.id}</Text>
              <Text>
                Customer: {detailsOrder.user.first_name} {detailsOrder.user.last_name}
              </Text>
              {/* …and any other details you like… */}
              <TouchableOpacity onPress={() => setDetailsOrder(null)}>
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  )
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