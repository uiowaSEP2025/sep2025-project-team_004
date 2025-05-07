// __tests__/FirstLook.test.tsx

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FirstLook from '../app/first-look';

// Mock the useRouter hook from expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

// Mock the global fetch function
global.fetch = jest.fn();

describe('FirstLook Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input and search button correctly', () => {
    const { getByPlaceholderText, getByText } = render(<FirstLook />);
    expect(getByPlaceholderText('sensor_id, e.g. usda-air-w06')).toBeTruthy();
    expect(getByText('Search')).toBeTruthy();
  });

  it('fetches and displays data on valid sensor ID', async () => {
    const mockData = {
      status: 200,
      message: 'Success',
      sensorID: 'usda-air-w06',
      points: [
        {
          esmcTime: '2025-05-04T10:00:00Z',
          temperature: '25.5',
          humidity: '60',
          pressure: '101.3',
          soilMoisture20: '30',
          soilMoisture5: '35',
          soilTemperature: '20',
          vcc: '3.3',
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<FirstLook />);

    fireEvent.changeText(getByPlaceholderText('sensor_id, e.g. usda-air-w06'), 'usda-air-w06');

    await act(async () => {
      fireEvent.press(getByText('Search'));
    });

    await waitFor(() => {
      expect(queryByText('Temp(°C)')).toBeTruthy();
      expect(queryByText('25.5')).toBeTruthy();
    });
  });

  it('displays error message on fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        status: 500,
        message: 'Internal Server Error',
        sensorID: 'usda-air-w06',
        points: [],
      }),
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<FirstLook />);

    fireEvent.changeText(getByPlaceholderText('sensor_id, e.g. usda-air-w06'), 'usda-air-w06');

    await act(async () => {
      fireEvent.press(getByText('Search'));
    });

    await waitFor(() => {
      expect(queryByText('Internal Server Error')).toBeTruthy();
    });
  });

  it('displays error message on network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    const { getByPlaceholderText, getByText, queryByText } = render(<FirstLook />);

    fireEvent.changeText(getByPlaceholderText('sensor_id, e.g. usda-air-w06'), 'usda-air-w06');

    await act(async () => {
      fireEvent.press(getByText('Search'));
    });

    await waitFor(() => {
      expect(queryByText('Network Error')).toBeTruthy();
    });
  });

  it('displays error message when no data points are returned', async () => {
    const mockData = {
      status: 200,
      message: 'Success',
      sensorID: 'usda-air-w06',
      points: [],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockData,
    });

    const { getByPlaceholderText, getByText, findByText } = render(<FirstLook />);

    fireEvent.changeText(getByPlaceholderText('sensor_id, e.g. usda-air-w06'), 'usda-air-w06');

    await act(async () => {
      fireEvent.press(getByText('Search'));
    });

    const errorMessage = await findByText('No real-time data points returned');
    expect(errorMessage).toBeTruthy();
  });
});
