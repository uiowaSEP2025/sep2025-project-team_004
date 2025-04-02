// __tests__/profile.test.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform, Alert } from 'react-native';
import Profile, { unstable_settings } from '../app/Profile';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set a dummy backend URL for fetch calls
process.env.EXPO_PUBLIC_BACKEND_URL = 'http://dummy-backend.com';

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

// Mock the usePayment hook from the correct path
const mockClearCards = jest.fn();
jest.mock('../app/context/PaymentContext', () => ({
  usePayment: () => ({
    clearCards: mockClearCards,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
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

  test('handles back button press by resetting navigation', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Test', last_name: 'User', email: 'test@example.com' }));
      return Promise.resolve(null);
    });

    // Assuming your Profile component renders a back button with testID "back-button"
    const { getByTestId } = render(<Profile />);
    const backButton = await waitFor(() => getByTestId('back-button'));
    fireEvent.press(backButton);
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: '(tabs)', params: { screen: 'home' } }],
    });
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

    fireEvent.press(getByText('Logout'));
    await waitFor(() => {
      expect(getByText('Are you sure you want to log out?')).toBeTruthy();
    });
  });

 
  test('navigates to "orders" when My orders is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Order', last_name: 'Tester', email: 'order@test.com' }));
      return Promise.resolve(null);
    });

    const { getByText } = render(<Profile />);
    fireEvent.press(getByText('My orders'));
    expect(mockNavigate).toHaveBeenCalledWith('orders');
  });

  test('navigates to "payment-method" when Payment Information is pressed', async () => {
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
    fireEvent.press(getByText('Payment Information'));
    expect(mockNavigate).toHaveBeenCalledWith('payment-method');
  });

  test('unstable_settings.tabBarIcon returns a valid element with provided color', () => {
    const iconElement = unstable_settings.tabBarIcon({ color: 'blue' });
    expect(iconElement).toBeTruthy();
    expect(iconElement.props.color).toBe('blue');
  });
});

describe('Additional Branches in Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
  });

  test('handles non-ok response when fetching default card', async () => {
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
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching default payment method:",
        expect.any(Error)
      );
    });
    consoleErrorSpy.mockRestore();
    global.fetch.mockRestore?.();
  });

  test('handles error in confirmLogout (AsyncStorage.removeItem failure)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo')
        return Promise.resolve(JSON.stringify({ first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }));
      return Promise.resolve(null);
    });
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error("Removal failed"));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
