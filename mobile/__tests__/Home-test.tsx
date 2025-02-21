import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WelcomePage from '../app/(tabs)/home';
import { NavigationContainer } from '@react-navigation/native';


jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // Mocking the `call` method specifically
  Reanimated.default.call = () => {};
  return Reanimated;
});


// Mocking useNavigation from React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: jest.fn(),
  };
});

describe('WelcomePage', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setup = () => {
    return render(
      <NavigationContainer>
        <WelcomePage />
      </NavigationContainer>
    );
  };

  it('renders correctly', () => {
    const { getByText } = setup();
    expect(getByText('Welcome!')).toBeTruthy();
  });

  it('toggles menu visibility when profile icon is pressed', async () => {
    const { getByText, queryByText } = setup();

    // Initially, menu is not visible
    expect(queryByText('Profile')).toBeNull();

    // Press the profile icon to show menu
    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);

    // Menu should now be visible
    await waitFor(() => {
      expect(getByText('Profile')).toBeTruthy();
    });

    // Press the profile icon again to hide menu
    fireEvent.press(profileIcon);

    // Menu should now be hidden
    await waitFor(() => {
      expect(queryByText('Profile')).toBeNull();
    });
  });

  it('navigates to Edit Profile screen when Edit Profile option is pressed', async () => {
    const { getByText } = setup();

    // Show the menu
    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);

    // Press on "Edit Profile"
    const editProfileOption = getByText('Edit Profile');
    fireEvent.press(editProfileOption);

    // Navigation should be triggered
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('editProfile');
    });
  });

  it('handles option selection and hides menu', async () => {
    const { getByText, queryByText } = setup();

    // Show the menu
    const profileIcon = getByText('P');
    fireEvent.press(profileIcon);

    // Select "Settings" option
    const settingsOption = getByText('Settings');
    fireEvent.press(settingsOption);

    // Menu should be hidden
    await waitFor(() => {
      expect(queryByText('Settings')).toBeNull();
    });
  });
});
