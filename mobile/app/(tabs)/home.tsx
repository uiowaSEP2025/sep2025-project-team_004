import React, { useState, useRef, useEffect, } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal } from "react-native";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { usePayment } from "../context/PaymentContext";

const WelcomePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const { clearCards } = usePayment();

  
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "index" }] });
      }
    };
    checkAuth();
  }, []);

  // Toggle Menu with Animation
  const handleMenuToggle = () => {
    if (menuVisible) {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (Platform.OS === "web") {
      setModalVisible(true);
    } else {
      Alert.alert(
            'Logout',
            'Are you sure you want to logout？',
            [
              { text: 'Yes', onPress: () => confirmLogout() },
              { text: 'Cancel', style: 'cancel' }
            ],
            { cancelable: true }
          );
    }
  };

  const confirmLogout = async () => {
    console.log("Confirm logout function triggered");
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userInfo");
      clearCards();
      navigation.navigate("index");
      setModalVisible(false); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <TouchableWithoutFeedback
    onPress={() => {
      if (menuVisible) setMenuVisible(false); 
      Keyboard.dismiss(); 
    }}
  >
    <View style={styles.container}>
      {/* Header with Profile Menu */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={handleMenuToggle}>
          <Text style={styles.profileIconText}>P</Text>
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {menuVisible && (
          <Animated.View
            style={[
              styles.menu,
              {
                opacity: menuAnimation,
                transform: [
                  {
                    scale: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
                pointerEvents: menuVisible ? "auto" : "none",
              },
            ]}
          >
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Text style={styles.menuItem}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("editProfile")}>
              <Text style={styles.menuItem}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {navigation.navigate("home");
              setMenuVisible(false);
            }}>
              <Text style={styles.menuItem}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.menuItem}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome!</Text>
      </View>

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
    </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: Platform.OS === "web" ? 70 : 120,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
    paddingTop: Platform.OS === "web" ? 0 : 70,
    position: "relative",
    zIndex: 2,
  },
  profileIcon: {
    marginTop: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileIconText: {
    color: "#fff",
    fontWeight: "bold",
  },
  menu: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 4,
    elevation: 4,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
    paddingVertical: 8,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 24,
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
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
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
  cancelButton: {
    backgroundColor: "#888",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default WelcomePage;
