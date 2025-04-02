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
import { Platform } from 'react-native';

// Use the AsyncStorage mock provided by the package.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated if needed.
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
    // Set Platform to web by directly assigning to Platform.OS.
    Platform.OS = 'web';
    jest.clearAllMocks();
    // Dummy fetch response for sensor data.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          points: [
            {
              time: new Date().toISOString(),
              temperature: "20",
              pressure: "1013",
              humidity: "50",
            },
          ],
        }),
      json: async () =>
        ({
          points: [
            {
              time: new Date().toISOString(),
              temperature: "20",
              pressure: "1013",
              humidity: "50",
            },
          ],
        }),
    });
    // Simulate that authToken is present.
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      key === 'authToken' ? Promise.resolve('dummyToken') : Promise.resolve(null)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
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

  // Test 1: Renders correctly (toggle buttons exist)
  it('renders correctly', async () => {
    const { findByText } = setup();
    expect(await findByText('Today')).toBeTruthy();
    expect(await findByText('Past Week')).toBeTruthy();
    expect(await findByText('Past 30 Days')).toBeTruthy();
  });

  // Test 2: Calls navigation.reset if auth token is missing on mount
  it('calls navigation.reset if auth token is missing on mount', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    setup();
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "index" }] });
    });
  });

  // Test 3: Shows activity indicator while loading
  it('shows activity indicator while loading', async () => {
    const { getByTestId } = setup();
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  // Test 4: Displays sensor charts when loading is false
  it('displays sensor charts when loading is false', async () => {
    const { findByText } = setup();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    // Expect one of the chart titles to be visible.
    expect(await findByText('Temperature (°C)')).toBeTruthy();
  });

  // Test 5: Changes selected range when toggle is pressed
  it('changes selected range when toggle is pressed', async () => {
    const { getByTestId } = setup();
    const weekToggle = getByTestId('toggle-week');
    act(() => {
      fireEvent.press(weekToggle);
    });
    // Verify that the toggle's style changes to indicate active selection.
    expect(weekToggle).toHaveStyle({ backgroundColor: "#007AFF" });
  });

  // Test 6: Handles error fetching sensor data (no chart displayed)
  it('handles error fetching sensor data', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Fetch failed"));
    const { queryByText } = setup();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    await waitFor(() => {
      expect(queryByText('Temperature (°C)')).toBeNull();
    });
  });

  // Test 7: Displays all sensor chart titles when data is available
  it('displays all sensor chart titles when data is available', async () => {
    const { findByText } = setup();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(await findByText('Temperature (°C)')).toBeTruthy();
    expect(await findByText('Pressure (hPa)')).toBeTruthy();
    expect(await findByText('Humidity (%)')).toBeTruthy();
  });
});
