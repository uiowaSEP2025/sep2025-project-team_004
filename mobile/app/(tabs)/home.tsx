import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types"; 

const WelcomePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;

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

  // Handle Option Selection
  const handleOptionSelect = (option: string) => {
    console.log(`Selected: ${option}`);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header with Profile Icon */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={handleMenuToggle}>
          <Text style={styles.profileIconText}>P</Text>
        </TouchableOpacity>

        {/* Animated Menu */}
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
              },
            ]}
            pointerEvents={menuVisible ? 'auto' : 'none'}
          >
            <TouchableOpacity onPress={() => handleOptionSelect('Profile')}>
              <Text style={styles.menuItem}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                navigation.navigate("editProfile");
              }}
              accessibilityRole="button"
            >
              <Text style={styles.menuItem}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Settings')}>
              <Text style={styles.menuItem}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Logout')}>
              <Text style={styles.menuItem}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Add a background color to avoid black screen
  },
  header: {
    height: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    position: 'relative',
    zIndex: 2, // Ensures the header is above the content
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Add background to ensure consistent color
  },
  welcomeText: {
    fontSize: 24,
  },
});

export default WelcomePage;
