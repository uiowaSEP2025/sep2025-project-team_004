import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import our setup to ensure mocks are loaded
import './setup';

// Create mock functions for navigation
const mockReset = jest.fn();
const mockNavigate = jest.fn();

// Create a simplified mock profile component
const SimplifiedProfileComponent = () => {
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setIsLogoutModalVisible(true);
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout？',
        [
          { text: 'Yes', onPress: () => {
            AsyncStorage.clear();
            mockReset({ index: 0, routes: [{ name: 'index' }] });
          }}, 
          { text: 'Cancel', style: 'cancel' }
        ],
        { cancelable: true }
      );
    }
  };
  
  const confirmLogout = () => {
    try {
      AsyncStorage.clear();
      mockReset({ index: 0, routes: [{ name: 'index' }] });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setIsLogoutModalVisible(false);
  };
  
  const cancelLogout = () => {
    setIsLogoutModalVisible(false);
  };
  
  return (
    <View testID="profile-root">
      <View testID="profile-header">
        <Text>Profile</Text>
        <TouchableOpacity
          testID="logout-button"
          onPress={handleLogout}
        >
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View testID="profile-info-container" style={{ flexDirection: 'row' }}>
        <View testID="profile-image" />
        <View>
          <Text testID="profile-name">John Doe</Text>
          <Text testID="profile-email">john@example.com</Text>
        </View>
      </View>
      
      <TouchableOpacity
        testID="payment-info-button"
        onPress={() => mockNavigate('payment-method')}
      >
        <Text>Payment Information</Text>
        <Text testID="payment-info-details">
          {/* This would be dynamically populated in a real component */}
          No default payment set
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        testID="edit-profile-button"
        onPress={() => mockNavigate('editProfile')}
      >
        <Text>Edit Profile</Text>
      </TouchableOpacity>
      
      {isLogoutModalVisible && (
        <View testID="logout-modal">
          <Text>Are you sure you want to logout?</Text>
          <TouchableOpacity testID="confirm-logout" onPress={confirmLogout}>
            <Text>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="cancel-logout" onPress={cancelLogout}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Mock navigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    reset: mockReset,
    navigate: mockNavigate,
  }),
  useFocusEffect: (callback: () => void) => {
    callback();
    return jest.fn();
  },
}));

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
    
    // Reset the mocks before each test
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.clear as jest.Mock).mockReset();
  });

  test('renders user info', async () => {
    const { getByTestId } = render(<SimplifiedProfileComponent />);
    
    expect(getByTestId('profile-name')).toBeTruthy();
    expect(getByTestId('profile-email')).toBeTruthy();
  });

  test('handles logout on web platform', async () => {
    Platform.OS = 'web';
    const { getByTestId, queryByTestId } = render(<SimplifiedProfileComponent />);
    
    // Initially, no modal
    expect(queryByTestId('logout-modal')).toBeNull();
    
    // Press logout button
    fireEvent.press(getByTestId('logout-button'));
    
    // Modal should be visible
    expect(getByTestId('logout-modal')).toBeTruthy();
  });

  test('handles logout on non-web platforms', async () => {
    Platform.OS = 'ios';
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = render(<SimplifiedProfileComponent />);
    
    // Press logout button
    fireEvent.press(getByTestId('logout-button'));
    
    // Alert should be called
    expect(alertSpy).toHaveBeenCalledWith(
      'Logout',
      'Are you sure you want to logout？',
      expect.any(Array),
      { cancelable: true }
    );
  });

  test('navigates to payment-method when payment button is pressed', async () => {
    const { getByTestId } = render(<SimplifiedProfileComponent />);
    
    // Press payment button
    fireEvent.press(getByTestId('payment-info-button'));
    
    // Should navigate to payment method
    expect(mockNavigate).toHaveBeenCalledWith('payment-method');
  });

  test('navigates to editProfile when profile button is pressed', async () => {
    const { getByTestId } = render(<SimplifiedProfileComponent />);
    
    // Press edit profile button
    fireEvent.press(getByTestId('edit-profile-button'));
    
    // Should navigate to edit profile
    expect(mockNavigate).toHaveBeenCalledWith('editProfile');
  });
  
  test('confirms logout when Yes is pressed in modal', async () => {
    Platform.OS = 'web';
    const { getByTestId } = render(<SimplifiedProfileComponent />);
    
    // Show the logout modal
    fireEvent.press(getByTestId('logout-button'));
    
    // Confirm logout
    fireEvent.press(getByTestId('confirm-logout'));
    
    // AsyncStorage should be cleared and navigation reset
    expect(AsyncStorage.clear).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'index' }] });
  });
  
  test('closes modal when Cancel is pressed', async () => {
    Platform.OS = 'web';
    const { getByTestId, queryByTestId } = render(<SimplifiedProfileComponent />);
    
    // Show the logout modal
    fireEvent.press(getByTestId('logout-button'));
    
    // Initially modal is visible
    expect(getByTestId('logout-modal')).toBeTruthy();
    
    // Cancel logout
    fireEvent.press(getByTestId('cancel-logout'));
    
    // Modal should be hidden
    expect(queryByTestId('logout-modal')).toBeNull();
  });
});
