import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, Alert } from 'react-native';
import Profile, { unstable_settings } from '../app/(tabs)/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Create mock functions for navigation
const mockReset = jest.fn();
const mockNavigate = jest.fn();

// Mock useNavigation and useFocusEffect from @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    reset: mockReset,
    navigate: mockNavigate,
  }),
  useFocusEffect: (callback: () => void) => callback(),
}));


// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
    // Set default mocks for SecureStore methods
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue();
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue();
  });

  test('redirects to index if authToken is missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve(null);
      return Promise.resolve(null);
    });

    render(<Profile />);
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'index' }] });
    });
  });

  test('renders user info when userInfo exists', async () => {
    const userInfo = { first_name: 'John', last_name: 'Doe', email: 'john@example.com' };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo') return Promise.resolve(JSON.stringify(userInfo));
      return Promise.resolve(null);
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
    });
  });

  test('renders default card info when default card is fetched', async () => {
    const defaultCardData = { is_default: true, card_type: 'MasterCard', last4: '5678' };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' }));
      return Promise.resolve(null);
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([defaultCardData]),
    });

    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText('MasterCard ending in 5678')).toBeTruthy();
    });
    global.fetch.mockRestore?.();
  });

  test('handles error when fetching default card (fetch rejected)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' }));
      return Promise.resolve(null);
    });
    const error = new Error("Test fetch error");
    global.fetch = jest.fn().mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Profile />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching default payment method:", error);
    });
    consoleErrorSpy.mockRestore();
  });

  test('handles non-ok response in fetchDefaultCard', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Test', last_name: 'User', email: 'test@example.com' }));
      return Promise.resolve(null);
    });
    const fetchResponse = {
      ok: false,
      json: () => Promise.resolve({}),
    };
    global.fetch = jest.fn().mockResolvedValue(fetchResponse);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Profile />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching default payment method:", expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
    global.fetch.mockRestore?.();
  });

  test('opens logout modal on web when logout is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }));
      return Promise.resolve(null);
    });

    const { getByText, queryByText } = render(<Profile />);
    expect(queryByText('Are you sure you want to log out?')).toBeNull();

    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(getByText('Are you sure you want to log out?')).toBeTruthy();
    });
  });

  test('calls Alert.alert on non-web logout', async () => {
    Platform.OS = 'ios';
    const alertSpy = jest.spyOn(Alert, 'alert');
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Dana', last_name: 'Scully', email: 'dana@example.com' }));
      return Promise.resolve(null);
    });
  
    const { getByText } = render(<Profile />);
    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Logout',
        'Are you sure you want to logout？',
        [
          { text: 'Yes', onPress: expect.any(Function) },
          { text: 'Cancel', style: 'cancel' }
        ],
        { cancelable: true }
      );
    });
    alertSpy.mockRestore();
  });
  
  test('navigates to editProfile when profile info is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Bob', last_name: 'Marley', email: 'bob@example.com' }));
      return Promise.resolve(null);
    });
  
    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText('Bob Marley')).toBeTruthy();
    });
    const profileName = getByText('Bob Marley');
    fireEvent.press(profileName);
    expect(mockNavigate).toHaveBeenCalledWith("editProfile");
  });
  
  test('navigates to payment-method when Payment Information is pressed', async () => {
    const defaultCardData = { is_default: true, card_type: 'Visa', last4: '9999' };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Charlie', last_name: 'Brown', email: 'charlie@example.com' }));
      return Promise.resolve(null);
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([defaultCardData]),
    });
  
    const { getByText } = render(<Profile />);
    await waitFor(() => {
      expect(getByText('Visa ending in 9999')).toBeTruthy();
    });
    const paymentInfoText = getByText('Payment Information');
    fireEvent.press(paymentInfoText);
    expect(mockNavigate).toHaveBeenCalledWith("payment-method");
  });
});

describe('Profile Additional Branch Coverage', () => {
  test('unstable_settings.tabBarIcon returns a valid element with provided color', () => {
    const iconElement = unstable_settings.tabBarIcon({ color: 'blue' });
    expect(iconElement).toBeTruthy();
    expect(iconElement.props.color).toBe('blue');
  });

  test('handles error in confirmLogout (clear failure)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }));
      return Promise.resolve(null);
    });
    (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error("Clear failed"));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
    Platform.OS = 'web';
    const { getByText } = render(<Profile />);
    fireEvent.press(getByText('Logout'));
    const yesButton = await waitFor(() => getByText('Yes'));
    fireEvent.press(yesButton);
  
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error logging out:", expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
  });
  
  test('closes modal when Cancel is pressed', async () => {
    Platform.OS = 'web';
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }));
      return Promise.resolve(null);
    });
  
    const { getByText, queryByText } = render(<Profile />);
    fireEvent.press(getByText('Logout'));
    await waitFor(() => {
      expect(getByText('Are you sure you want to log out?')).toBeTruthy();
    });
    fireEvent.press(getByText('Cancel'));
    await waitFor(() => {
      expect(queryByText('Are you sure you want to log out?')).toBeNull();
    });
  });
});
