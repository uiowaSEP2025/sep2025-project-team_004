import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Order from '../app/my-orders';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-font to avoid loadedNativeFonts issue
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  isLoaded: () => true,
  loadAsync: jest.fn(),
}));

// Mock vector icons: any import returns a simple View
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: () => (props) => React.createElement('View', props),
    }
  );
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Stub useFocusEffect → run cb inside a real useEffect
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => {
        cb();
      }, []);
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Global fetch stub
(global.fetch as jest.Mock) = jest.fn();

describe('Order Component', () => {
  const mockBack = jest.fn();
  const dummyOrdersResponse = {
    results: [
      {
        id: 1,
        status: 'out_for_delivery',
        created_at: '2022-11-03T12:00:00Z',
        total_price: '10.00',
        tracking_number: 'ABC',
        items: [
          { product_id: 101, product_name: 'Product A', product_price: '10.00', quantity: 1 },
        ],
        user: { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' },
      },
      { id: 2, status: 'processing', created_at: '2022-11-02T12:00:00Z', total_price: '20.00', tracking_number: null, items: [], user: {} },
      { id: 3, status: 'processing', created_at: '2022-11-01T12:00:00Z', total_price: '30.00', tracking_number: null, items: [], user: {} },
      { id: 4, status: 'cancelled', created_at: '2021-02-13T12:00:00Z', total_price: '40.00', tracking_number: null, items: [], user: {} },
    ],
    next: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dummyToken');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => dummyOrdersResponse });
  });

  it('renders header and tabs correctly', async () => {
    const { getByText, getByTestId, findByText, findAllByText } = render(<Order />);
    expect(getByText('My orders')).toBeTruthy();
    expect(getByTestId('back-button')).toBeTruthy();
    expect(await findByText('Out for Delivery')).toBeTruthy();
    expect(getByText('Processing')).toBeTruthy();
    expect(getByText('Canceled')).toBeTruthy();
    expect((await findAllByText('Details')).length).toBe(1);
  });

  it('calls router.back when back button is pressed', () => {
    const { getByTestId } = render(<Order />);
    fireEvent.press(getByTestId('back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('displays Out for Delivery orders by default', async () => {
    const { findAllByText } = render(<Order />);
    expect((await findAllByText('Details')).length).toBe(1);
  });

  it('switches to Processing tab and displays Processing orders', async () => {
    const { getByText, findAllByText } = render(<Order />);
    fireEvent.press(getByText('Processing'));
    expect((await findAllByText('Details')).length).toBe(2);
    expect(getByText('11/2/2022')).toBeTruthy();
  });

  it('switches to Canceled tab and displays Canceled orders', async () => {
    const { getByText, findAllByText } = render(<Order />);
    fireEvent.press(getByText('Canceled'));
    expect((await findAllByText('Details')).length).toBe(1);
    expect(getByText('2/13/2021')).toBeTruthy();
  });

  it('opens review modal when Review button is pressed', async () => {
    const { findByText } = render(<Order />);
    const reviewButton = await findByText('Review');
    act(() => fireEvent.press(reviewButton));
    expect(await findByText('Review Product')).toBeTruthy();
  });

  it('opens order details modal when Details button is pressed', async () => {
    const { findByText, getByText } = render(<Order />);
    const detailsButton = await findByText('Details');
    act(() => fireEvent.press(detailsButton));
    expect(getByText('Shipping Address:')).toBeTruthy();
  });

  it('loads more orders on scroll if hasNext is true', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => dummyOrdersResponse })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 5,
              status: 'out_for_delivery',
              created_at: '2022-11-04T12:00:00Z',
              total_price: '50.00',
              tracking_number: 'DEF',
              items: [],
              user: {},
            },
          ],
          next: null,
        }),
      });

    const { getByTestId, findAllByText } = render(<Order />);
    const scrollView = getByTestId('order-scroll-view');

    await act(async () => {
      fireEvent.scroll(scrollView, {
        nativeEvent: {
          layoutMeasurement: { height: 500 },
          contentOffset: { y: 1000 },
          contentSize: { height: 1500 },
        },
      });
    });

    expect((await findAllByText('Details')).length).toBeGreaterThan(1);
  });
});
