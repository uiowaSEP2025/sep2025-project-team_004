import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Profile from '../app/(tabs)/profile';

// ✅ Fix for NativeAnimatedHelper issues
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);


// ✅ Navigation mock
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      reset: jest.fn(),
    }),
    useFocusEffect: jest.fn((cb) => cb()),
  };
});

// ✅ Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.getItem = jest.fn().mockImplementation((key) => {
    if (key === 'userInfo') {
      return Promise.resolve(JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        role: 'admin',
        profile_picture: null,
      }));
    }
    if (key === 'authToken') return Promise.resolve('dummy-token');
    return Promise.resolve(null);
  });
});

describe('Profile Component', () => {
  it('renders user data from AsyncStorage', async () => {
    const { getByText } = render(<Profile />);

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  it('shows logout modal on web platform', async () => {
    jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'web' }));
    const { getByText } = render(<Profile />);

    fireEvent.press(getByText('Logout'));

    await waitFor(() => {
      expect(getByText('Are you sure you want to log out?')).toBeTruthy();
    });
  });

  it('resets navigation if no token is present', async () => {
    const resetMock = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({ reset: resetMock });
    AsyncStorage.getItem = jest.fn().mockResolvedValue(null);

    render(<Profile />);
    await waitFor(() => {
      expect(resetMock).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'index' }] });
    });
  });

  it('clears storage and resets on logout', async () => {
    const resetMock = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({ reset: resetMock });

    const { getByText } = render(<Profile />);
    fireEvent.press(getByText('Logout'));
    fireEvent.press(getByText('Yes'));

    await waitFor(() => {
      expect(AsyncStorage.clear).toHaveBeenCalled();
      expect(resetMock).toHaveBeenCalled();
    });
  });
});
