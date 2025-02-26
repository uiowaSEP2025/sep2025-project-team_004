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

  beforeEach(() => {
    // By default, return a dummy token so the auth check does nothing.
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dummyToken");
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
      <NavigationContext.Provider value={customNavigation as any}>
        <WelcomePage />
      </NavigationContext.Provider>
    );
  };

  it('renders correctly', async () => {
    const { getByText } = setup();
    await waitFor(() => {
      expect(getByText('Welcome!')).toBeTruthy();
    });
  });

  it('toggles menu visibility when profile icon is pressed', async () => {
    const { getByText, queryByText } = setup();

    // Initially, menu is not visible
    expect(queryByText('Profile')).toBeNull();

    // Show menu
    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);
    await waitFor(() => {
      expect(getByText('Profile')).toBeTruthy();
    });

    // Hide menu
    fireEvent.press(profileIcon);
    await waitFor(() => {
      expect(queryByText('Profile')).toBeNull();
    });
  });

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

  // ---- New tests for uncovered branches ----

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
    // Open menu
    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);
    // Press "Logout" option to display modal
    const logoutOption = getByText('Logout');
    fireEvent.press(logoutOption);
    await waitFor(() => {
      expect(getByText('Are you sure you want to log out?')).toBeTruthy();
    });
    // Spy on AsyncStorage.removeItem
    const removeSpy = jest.spyOn(AsyncStorage, 'removeItem');
    // Press "Yes" to confirm logout
    fireEvent.press(getByText('Yes'));
    await waitFor(() => {
      // Modal should be hidden
      expect(queryByText('Are you sure you want to log out?')).toBeNull();
    });
    // Verify logout actions: removal of tokens and navigation to "index"
    expect(removeSpy).toHaveBeenCalledWith("authToken");
    expect(removeSpy).toHaveBeenCalledWith("userInfo");
    expect(mockNavigate).toHaveBeenCalledWith("index");
    removeSpy.mockRestore();
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
