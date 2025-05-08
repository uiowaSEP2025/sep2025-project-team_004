// __tests__/add-sensors-test.tsx

process.env.EXPO_PUBLIC_DEV_FLAG = 'false';
process.env.EXPO_PUBLIC_BACKEND_URL = 'https://mock-backend-url.com';
process.env.EXPO_PUBLIC_GOOGLE_API_KEY = 'test-google-key';

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

import { NavigationContainer } from '@react-navigation/native';

jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: 'localhost:19000',
  },
}));

// ✅ Fix GooglePlacesAutocomplete ref issue with forwardRef
jest.mock('react-native-google-places-autocomplete', () => {
  const React = require('react');
  return {
    GooglePlacesAutocomplete: React.forwardRef(() => null),
  };
});

// ✅ Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AddRegisterSensor from '../app/AddSensors';

// ✅ Global alert mock
global.alert = jest.fn();

beforeEach(async () => {
  fetchMock.resetMocks();
  await AsyncStorage.setItem('authToken', 'mock-token');
  jest.clearAllMocks();
});

const renderWithNavigation = () => (
  <NavigationContainer>
    <AddRegisterSensor />
  </NavigationContainer>
);

describe('AddRegisterSensor Component', () => {
  it('renders initial view correctly with "add" mode', () => {
    const { getByText, getByPlaceholderText } = render(renderWithNavigation());

    expect(getByText('Add')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(getByPlaceholderText('Enter sensor ID')).toBeTruthy();
    expect(getByPlaceholderText('Optional nickname')).toBeTruthy();
    expect(getByText('Add Sensor')).toBeTruthy();
  });

  it('switches to "register" mode and shows additional fields', () => {
    const { getByText } = render(renderWithNavigation());

    fireEvent.press(getByText('Register'));

    expect(getByText('Air')).toBeTruthy();
    expect(getByText('Soil')).toBeTruthy();
    expect(getByText('Address')).toBeTruthy();
    expect(getByText('Register Sensor')).toBeTruthy();
  });

  it('submits form in "add" mode successfully', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Sensor added successfully' }),
      { status: 200 }
    );

    const { getByPlaceholderText, getByText } = render(renderWithNavigation());

    fireEvent.changeText(getByPlaceholderText('Enter sensor ID'), '12345');
    fireEvent.changeText(getByPlaceholderText('Optional nickname'), 'Test Sensor');
    fireEvent.press(getByText('Add Sensor'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'undefined/api/sensors/add/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Token mock-token' }),
        })
      );
      expect(global.alert).toHaveBeenCalledWith('Sensor added successfully');
    });
  });

  it('shows error on submission failure in "add" mode', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Invalid ID' }),
      { status: 400 }
    );

    const { getByPlaceholderText, getByText } = render(renderWithNavigation());

    fireEvent.changeText(getByPlaceholderText('Enter sensor ID'), 'bad-id');
    fireEvent.press(getByText('Add Sensor'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Invalid ID');
    });
  });

  it('submits form in "register" mode successfully', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Sensor registered' }),
      { status: 200 }
    );

    const { getByText, getByPlaceholderText } = render(renderWithNavigation());

    fireEvent.press(getByText('Register'));
    fireEvent.changeText(getByPlaceholderText('Enter sensor ID'), '67890');
    fireEvent.changeText(getByPlaceholderText('Optional nickname'), 'Reg Sensor');
    fireEvent.press(getByText('Soil'));
    fireEvent.press(getByText('Register Sensor'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'undefined/api/sensors/register/',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"sensor_id":"67890"'),
        })
      );
      expect(global.alert).toHaveBeenCalledWith('Sensor registered');
    });
  });
});
