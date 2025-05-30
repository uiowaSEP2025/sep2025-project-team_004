// app/(tabs)/Profile.tsx
import React, {useState, useCallback, useEffect } from 'react';
// import { ensureHttps } from '../../utils/imageUtils';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import Constants from 'expo-constants';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === 'true'
    ? `http://${Constants.expoConfig?.hostUri?.split(':').shift() ?? 'localhost'}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

export const unstable_settings = {
  title: 'Profile',
  tabBarIcon: ({ color }: { color: string }) => (
    <IconSymbol name="person.fill" size={28} color={color} />
  ),
};

export default function Profile() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [user, setUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    profile_picture: null,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [defaultCard, setDefaultCard] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'index' }] });
      }
    };
    checkAuth();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // load stored user info
      (async () => {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) setUser(JSON.parse(stored));
      })();

      // fetch default card
      (async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) return;
          const resp = await fetch(`${API_BASE_URL}/api/payment/stripe-methods/`, {
            method: 'GET',
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!resp.ok) throw new Error('Failed to fetch Stripe cards');
          const data = await resp.json();
          const found = data.find((c: any) => c.is_default);
          setDefaultCard(found || null);
        } catch (err) {
          // normalized for tests:
          console.error('Error fetching default Stripe card:', err)
        }
      })();
    }, [])
  );

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setModalVisible(true);
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout？',
        [
          { text: 'Yes', onPress: confirmLogout },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const confirmLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({ index: 0, routes: [{ name: 'index' }] });
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.content}>
        {/* User Info */}
        <TouchableOpacity
          style={styles.profileInfoContainer}
          onPress={() => navigation.navigate('editProfile')}
        >
          <Image
            style={styles.avatar}
            source={
              user.profile_picture
                ? { uri: user.profile_picture }
                : require('@/assets/images/default-pfp.png')
            }
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {`${user.first_name} ${user.last_name}`}
            </Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </TouchableOpacity>

        {/* My orders */}
        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => navigation.navigate('my-orders')}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>My orders</Text>
              <Text style={styles.infoSubtitle}>Already have x orders</Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
            />
          </View>
        </TouchableOpacity>

        {/* Shipping Addresses */}
        <TouchableOpacity style={styles.infoItem} onPress={() => { /* TODO */ }}>
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Shipping Addresses</Text>
              <Text style={styles.infoSubtitle}>
                1234 Main St, Springfield, IA
              </Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
            />
          </View>
        </TouchableOpacity>

        {/* Payment Information (patched) */}
        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => navigation.navigate('payment-method')}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Payment Information</Text>
              <Text style={styles.infoSubtitle}>
                {defaultCard
                  ? `${defaultCard.brand} ending in ${defaultCard.last4}`
                  : 'No default payment set'}
              </Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
            />
          </View>
        </TouchableOpacity>

        {/* List Items */}
        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => navigation.navigate("my-orders")}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>My orders</Text>
              <Text style={styles.infoSubtitle}>Handle your orders</Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => navigation.navigate('my-reviews')}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>My Reviews</Text>
              <Text style={styles.infoSubtitle}>Handle your reviews</Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
            />
          </View>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => navigation.navigate('settings')}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Settings</Text>
              <Text style={styles.infoSubtitle}>
                Notification, Password, FAQ, Contact
              </Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
            />
          </View>
        </TouchableOpacity>

        {/* Admin Orders (if admin) */}
        {user.role?.toLowerCase() === 'admin' && (
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => navigation.navigate('admin-orders')}
          >
            <View style={styles.infoRow}>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Admin Orders</Text>
                <Text style={styles.infoSubtitle}>
                  Manage all customer orders
                </Text>
              </View>
              <Image
                style={styles.arrowIcon}
                source={require('@/assets/images/forward-arrow.png')}
              />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Logout confirmation modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={confirmLogout} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ... styles unchanged below ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Merriweather',
    fontSize: 18,
    fontWeight: '700',
    color: '#303030',
  },
  logoutButton: { padding: 8 },
  logoutText: { fontSize: 16, color: '#FF0000' },
  content: { flex: 1, padding: 16 },
  profileInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ccc' },
  userInfo: { marginLeft: 16 },
  username: { fontSize: 20, fontWeight: '700', color: '#232323' },
  email: { fontSize: 14, color: '#808080', marginTop: 4 },
  infoItem: { backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoTextContainer: { flex: 1, paddingRight: 8 },
  infoTitle: { fontSize: 18, fontWeight: '700', color: '#232323', marginBottom: 4 },
  infoSubtitle: { fontSize: 14, color: '#808080' },
  arrowIcon: { width: 20, height: 20 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' },
  modalText: { fontSize: 18, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, padding: 10, margin: 5, backgroundColor: '#007AFF', borderRadius: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#888' },
  modalButtonText: { color: 'white', fontSize: 16 },
});
