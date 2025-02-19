import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const WelcomePage = () => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
  };

  const handleOptionSelect = (option: string) => {
    console.log(`Selected: ${option}`);
    // TODO: Implement navigation or action for each option here
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header with Profile Icon */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileIcon} onPress={handleMenuToggle}>
          {/* Placeholder for profile icon. Replace with an Image or Icon component as needed */}
          <Text style={styles.profileIconText}>P</Text>
        </TouchableOpacity>

        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity onPress={() => handleOptionSelect('Profile')}>
              <Text style={styles.menuItem}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Edit Profile')}>
              <Text style={styles.menuItem}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Settings')}>
              <Text style={styles.menuItem}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Logout')}>
              <Text style={styles.menuItem}>Logout</Text>
            </TouchableOpacity>
          </View>
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
  },
  header: {
    height: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    position: 'relative', 
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
  },
  welcomeText: {
    fontSize: 24,
  },
});

export default WelcomePage;
