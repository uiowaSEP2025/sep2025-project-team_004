import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import WelcomePage from '../app/(tabs)/home';
import { NavigationContext } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaymentProvider } from '@/app/context/PaymentContext';
import { Platform } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('WelcomePage', () => {
  const mockNavigate = jest.fn();
  const mockReset = jest.fn();

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.replaceProperty(Platform, "OS", "web");
    jest.clearAllMocks();
    // By default, return a dummy token so the auth check does nothing.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, last4: '1234', cardholder_name: 'John Doe', expiration_date: '12/24', card_type: 'visa', is_default: false },
        { id: 2, last4: '5678', cardholder_name: 'Jane Doe', expiration_date: '11/25', card_type: 'mastercard', is_default: true },
      ],
    });

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      key === 'authToken' ? Promise.resolve('dummyToken') : Promise.resolve(null)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const customNavigation = {
    navigate: mockNavigate,
    reset: mockReset,
    dispatch: jest.fn(),
    goBack: jest.fn(),
    isFocused: jest.fn(),
    canGoBack: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(),
    dangerouslyGetParent: jest.fn(),
    dangerouslyGetState: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    setParams: jest.fn(),
  };

  const setup = () => {
    return render(
      <PaymentProvider>
        <NavigationContext.Provider value={customNavigation as any}>
          <WelcomePage />
        </NavigationContext.Provider>
      </PaymentProvider>
    );
  };

  it('renders correctly', async () => {
    const { findByText } = setup();
    expect(await findByText('Welcome!')).toBeTruthy();
  });

  it('toggles menu visibility when profile icon is pressed', async () => {
    const { getByText, queryByText } = setup();

    // Initially, menu is not visible
    expect(queryByText('Profile')).toBeNull();

    // Show menu
    const profileIcon = getByText('P');
    await act(async () => {
      fireEvent.press(profileIcon);
      jest.runAllTimers(); // run pending timers to process any delayed UI updates
    });
    await waitFor(() => expect(getByText('Profile')).toBeTruthy(), { timeout: 7000 });
    
    // Hide menu
    await act(async () => {
      fireEvent.press(profileIcon);
      jest.runAllTimers();
    });
    await waitFor(() => expect(queryByText('Profile')).toBeNull(), { timeout: 7000 });
  }, 10000);

  it('navigates to Edit Profile screen when Edit Profile option is pressed', async () => {
    const { getByText } = setup();

    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);

    const editProfileOption = getByText('Edit Profile');
    fireEvent.press(editProfileOption);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('editProfile');
    });
  });

  it('handles option selection and hides menu', async () => {
    const { getByText, queryByText } = setup();

    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);

    const settingsOption = getByText('Settings');
    fireEvent.press(settingsOption);

    await waitFor(() => {
      expect(queryByText('Settings')).toBeNull();
    });
  });

  it('calls navigation.reset if auth token is missing on mount', async () => {
    // Simulate missing auth token
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    setup();
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "index" }] });
    });
  });

  it('shows logout modal when "Logout" is pressed and logs out when "Yes" is pressed', async () => {
    const { getByText, queryByText } = setup();
  
    // Open the menu
    fireEvent.press(getByText("P"));
  
    // Press "Logout"
    await act(async () => {
      fireEvent.press(getByText("Logout"));
      jest.runAllTimers();
    });
  
    // Wait for modal visibility state update
    await act(async () => {
      await waitFor(() => {
        expect(getByText("Are you sure you want to log out?")).toBeTruthy();
      });
    });  
    // Press "Yes" button inside the modal
    await act(async () => {
      fireEvent.press(getByText("Yes"));
      jest.runAllTimers();
    });
  
    // Ensure modal disappears after clicking "Yes"
    await act(async () => {
      await waitFor(() => {
        expect(queryByText("Are you sure you want to log out?")).toBeNull();
      });
    });
  
    // Ensure AsyncStorage tokens are removed
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("authToken");
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("userInfo");
  
    // Ensure navigation occurs
    expect(mockNavigate).toHaveBeenCalledWith("index");
  });
  
  it('hides logout modal when "Cancel" is pressed', async () => {
    const { getByText, queryByText } = setup();
    // Open menu
    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);
    // Press "Logout" option to display modal
    const logoutOption = getByText('Logout');
    fireEvent.press(logoutOption);
    await waitFor(() => {
      expect(getByText('Are you sure you want to log out?')).toBeTruthy();
    });
    // Press "Cancel" button
    fireEvent.press(getByText('Cancel'));
    await waitFor(() => {
      expect(queryByText('Are you sure you want to log out?')).toBeNull();
    });
  });
});
