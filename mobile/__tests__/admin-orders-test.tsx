import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminOrders from '../app/admin-orders';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

global.fetch = jest.fn();

const mockOrder = {
  id: 1,
  shipping_address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip_code: '12345',
  total_price: '20.00',
  status: 'processing',
  tracking_number: null,
  created_at: '2025-05-01T10:00:00Z',
  user: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
  items: [{ product_name: 'Widget', product_price: '10.00', quantity: 2 }],
};

// 🔁 Utility: Simulate sequential fetch responses
function mockFetchSequence(responses: Array<() => Promise<any>>) {
  let call = 0;
  (global.fetch as jest.Mock).mockImplementation(() => {
    const responseFn = responses[call++];
    return responseFn
      ? responseFn()
      : Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [], next: null }) });
  });
}

describe('AdminOrders', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
    (useFocusEffect as jest.Mock).mockImplementation(() => {}); // ❗ Prevent infinite loop
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('fake-token');
  });

  afterEach(() => jest.clearAllMocks());

  it('renders header and tabs', async () => {
    mockFetchSequence([
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [], next: null }),
        }),
    ]);

    const { getByText } = render(<AdminOrders />);
    await waitFor(() => getByText('Admin Orders'));

    ['Out for Delivery', 'Processing', 'Canceled'].forEach(tab =>
      expect(getByText(tab)).toBeTruthy()
    );
  });

  it('loads and displays processing orders when tab pressed', async () => {
    mockFetchSequence([
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [mockOrder], next: null }),
        }),
    ]);

    const { getByText } = render(<AdminOrders />);
    fireEvent.press(getByText('Processing'));

    await waitFor(() => {
      expect(getByText('Order #1')).toBeTruthy();
      expect(getByText('$20.00')).toBeTruthy();
    });
  });

  it('opens and closes the details modal', async () => {
    mockFetchSequence([
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [mockOrder], next: null }),
        }),
    ]);

    const { getByText, queryByText } = render(<AdminOrders />);
    fireEvent.press(getByText('Processing'));

    await waitFor(() => getByText('Order #1'));

    fireEvent.press(getByText('Details'));
    expect(getByText('Customer: John Doe')).toBeTruthy();

    fireEvent.press(getByText('Close'));
    await waitFor(() => {
      expect(queryByText('Customer: John Doe')).toBeNull();
    });
  });

  it('handles empty order list gracefully', async () => {
    mockFetchSequence([
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [], next: null }),
        }),
    ]);

    const { getByText } = render(<AdminOrders />);
    fireEvent.press(getByText('Processing'));
    await waitFor(() => getByText('Admin Orders'));
  });

  it('submits a tracking number and calls update API', async () => {
    mockFetchSequence([
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [mockOrder], next: null }),
        }),
      () =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockOrder,
              status: 'out_for_delivery',
              tracking_number: 'TRACK123',
            }),
        }),
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [], next: null }),
        }),
    ]);

    const { getByText, getByPlaceholderText } = render(<AdminOrders />);
    fireEvent.press(getByText('Processing'));
    await waitFor(() => getByText('Order #1'));

    fireEvent.press(getByText('Complete'));
    fireEvent.changeText(getByPlaceholderText('Tracking Number'), 'TRACK123');
    fireEvent.press(getByText('Complete Order'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      const [url, opts] = (fetch as jest.Mock).mock.calls[1];
      expect(url).toContain('/api/store/orders/update/1/');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toMatchObject({
        status: 'out_for_delivery',
        tracking_number: 'TRACK123',
      });
    });
  });
});
