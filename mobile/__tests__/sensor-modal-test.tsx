// __tests__/sensor-modal-test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SensorSettingsModal from '../app/SensorSettingsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import fetchMock from 'jest-fetch-mock';

// 🎯 Enable the fetch mock before any code under test runs
fetchMock.enableMocks();

// ── Env setup ──────────────────────────────────────────────────────────────────
process.env.EXPO_PUBLIC_DEV_FLAG = 'true';
process.env.EXPO_PUBLIC_BACKEND_URL = 'http://localhost:8000';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      hostUri: 'localhost:19000',
    },
  },
}));

jest.mock('react-native-google-places-autocomplete', () => ({
  GooglePlacesAutocomplete: ({ textInputProps }: any) => (
    <input
      testID="places-input"
      value={textInputProps?.value}
      onChange={(e) => textInputProps?.onChangeText?.(e.target.value)}
    />
  ),
}));

describe('SensorSettingsModal', () => {
  const mockReset = jest.fn();

  beforeEach(() => {
    fetchMock.resetMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (useNavigation as jest.Mock).mockReturnValue({ reset: mockReset });
    window.alert = jest.fn();
  });

  const sensorMock = {
    sensor_id: '123',
    nickname: 'Test Sensor',
    address: '123 Main St',
    is_default: false,
    belongs_to: 1,
  };

  const setup = (props = {}) =>
    render(
      <SensorSettingsModal
        visible={true}
        onClose={jest.fn()}
        sensor={sensorMock}
        currentUserId={1}
        onUpdate={jest.fn()}
        {...props}
      />
    );

  it('renders correctly and shows initial values', () => {
    const { getByDisplayValue, getByText } = setup();
    expect(getByDisplayValue('Test Sensor')).toBeTruthy();
    expect(getByText('123')).toBeTruthy();
  });

  it('toggles switch correctly', () => {
    const { getByRole } = setup();
    const switchComponent = getByRole('switch');
    fireEvent(switchComponent, 'valueChange', true);
    expect(switchComponent.props.value).toBe(true);
  });

  it('handles address input when belongsToUser is true', () => {
    const { getByTestId } = setup();
    const input = getByTestId('places-input');
    fireEvent.changeText(input, 'New Address');
    expect(input).toBeTruthy();
  });

  it('calls fetch on save with correct payloads', async () => {
    const onUpdate = jest.fn();
    const onClose = jest.fn();

    fetchMock.mockResponses(
      [JSON.stringify({}), { status: 200 }],
      [JSON.stringify({}), { status: 200 }]
    );

    const { getByText } = setup({ onUpdate, onClose });
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const [firstCall, secondCall] = fetchMock.mock.calls;
      expect(firstCall[0]).toContain('/update-favorite/');
      expect(secondCall[0]).toContain('/update-belongs/');

      expect(onUpdate).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "(tabs)", params: { screen: "home" } }],
      });
    });
  });

  it('shows alert on fetch failure', async () => {
    fetchMock.mockRejectOnce(new Error('Only absolute URLs are supported'));

    const { getByText } = setup();
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Only absolute URLs are supported');
    });
  });
});
