// app/(tabs)/Profile.tsx
import React, {useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ImageBackground,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../app/types"; 


export const unstable_settings = {
  title: 'Profile',
  tabBarIcon: ({ color }: { color: string }) => (
    <IconSymbol name="person.fill" size={28} color={color} />
  ),
};

export default function Profile() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [user, setUser] = useState({ first_name: "", last_name: "", email: "" });
  const [modalVisible, setModalVisible] = useState(false);
  const [defaultCard, setDefaultCard] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "index" }] });
      }
    };
    checkAuth();
  }, []);


  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        const storedUserInfo = await AsyncStorage.getItem("userInfo");
        if (storedUserInfo) {
          setUser(JSON.parse(storedUserInfo));
        }
      };

      const fetchDefaultCard = async () => {
        try {
          const authToken = await AsyncStorage.getItem("authToken");
          if (!authToken) {
            return;
          }
  
          const response = await fetch("http://127.0.0.1:8000/api/payment/payment-methods/", {
            method: "GET",
            headers: {
              "Authorization": `Token ${authToken}`,
              "Content-Type": "application/json",
            },
          });
  
          if (!response.ok) {
            throw new Error("Failed to fetch payment methods.");
          }
  
          const data = await response.json();
          const defaultCard = data.find((card: any) => card.is_default);
  
          setDefaultCard(defaultCard || null);
        } catch (error) {
          console.error("Error fetching default payment method:", error);
        }
      };

      fetchUserInfo();
      fetchDefaultCard();
    }, [])
  );

  const handleLogout = () => {
    setModalVisible(true);
  };

  const confirmLogout = async () => {
    console.log("Confirm logout function triggered");
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userInfo"); // Remove user details too
      navigation.reset({ index: 0, routes: [{ name: "index" }] });
      setModalVisible(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        {/* Back Button (Align Left) */}
        <TouchableOpacity
                  testID="back-button"
                  onPress={() => navigation.reset({ index: 0, routes: [{ name: "(tabs)", params: { screen: "home" } }]})}
                  style={styles.headerIcon}
                >
                  <ImageBackground
                    style={styles.backIcon}
                    source={require("@/assets/images/back-arrow.png")}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

        {/* Centered Title */}
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Logout Button (Align Right) */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>


      {/* Content */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.content}
      >
        {/* Personal Info */}
        <View style={styles.profileInfoContainer}>
          <Image
            style={styles.avatar}
            source={require('@/assets/images/avatar-placeholder.png')}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
              </Text>
            <Text style={styles.email}>{user ? user.email : "Loading..."}</Text>
          </View>
        </View>

        {/* List Items */}
        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => {
            /* TODO:  My orders page */
          }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>My orders</Text>
              <Text style={styles.infoSubtitle}>Already have x orders</Text>
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
          onPress={() => {
            /* TODO: Shipping Addresses page */
          }}
        >
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
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoItem}
          onPress={() => navigation.navigate("payment-method")}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Payment Information</Text>
              <Text style={styles.infoSubtitle}>
                {defaultCard
                  ? `${defaultCard.card_type} ending in ${defaultCard.last4}`
                  : "No default payment set"}
              </Text>
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
          onPress={() => {
            /* TODO:  My Reviews page */
          }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>My Reviews</Text>
              <Text style={styles.infoSubtitle}>Review for x items</Text>
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
          onPress={() => {
            /* TODO: Setting page */
          }}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Setting</Text>
              <Text style={styles.infoSubtitle}>
                Notification, Password, FAQ, Contact
              </Text>
            </View>
            <Image
              style={styles.arrowIcon}
              source={require('@/assets/images/forward-arrow.png')}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={confirmLogout} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.modalButtonText}>Cancel</Text>
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
  // Header
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
  logoutButton: {
    padding: 8, 
  },
  headerIcon: { width: 20, height: 20 },
  backIcon: { width: 24, height: 24 },
  logoutText: {
    fontSize: 16,
    color: '#FF0000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  userInfo: {
    marginLeft: 16,
  },
  username: {
    fontFamily: 'NunitoSansBold', 
    fontWeight: '700',
    fontSize: 20,
    color: '#232323',
  },
  email: {
    fontSize: 14,
    color: '#808080',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: { fontSize: 18, marginBottom: 10 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#888" },
  modalButtonText: { color: "white", fontSize: 16
  },
  infoItem: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  infoTitle: {
    fontFamily: 'NunitoSansBold', 
    fontWeight: '700',
    fontSize: 16,
    color: '#232323',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontFamily: 'NunitoSans', 
    fontWeight: '700',
    fontSize: 14,
    color: '#808080',
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
});

