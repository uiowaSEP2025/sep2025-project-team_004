// ------------------------
// 1) Mocks & Stubs
// ------------------------

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'localhost:19000' },
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('react-native-google-places-autocomplete', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    GooglePlacesAutocomplete: ({ textInputProps }: any) =>
      React.createElement(TextInput, textInputProps),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    MaterialIcons: (props: any) =>
      React.createElement('MaterialIcons', props),
  };
});

jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return {
    useFocusEffect: (fn: () => void) => useEffect(fn, []),
  };
});

// ------------------------
// 2) Imports
// ------------------------

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import CheckoutScreen from '../app/checkout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { CartContext } from '../app/context/CartContext';

// ------------------------
// 3) Utilities
// ------------------------

const flattenStyle = (style: any) =>
  Array.isArray(style)
    ? style.flat(Infinity).reduce((acc, curr) => ({ ...acc, ...(curr || {}) }), {})
    : style;

// ------------------------
// 4) Test Data
// ------------------------

const fakeCards = [
  {
    id: '1',
    brand: 'Visa',
    last4: '1111',
    is_default: true,
    cardholder_name: 'A',
    exp_month: 1,
    exp_year: 2030,
  },
  {
    id: '2',
    brand: 'Amex',
    last4: '2222',
    is_default: false,
    cardholder_name: 'B',
    exp_month: 2,
    exp_year: 2031,
  },
];

// ------------------------
// 5) Setup & Teardown
// ------------------------

beforeEach(() => {
  jest.clearAllMocks();

  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
    if (key === 'authToken') return Promise.resolve('fake-token');
    if (key === 'userInfo')
      return Promise.resolve(
        JSON.stringify({
          address: '123 Main St',
          city: 'Iowa City',
          state: 'IA',
          zip_code: '52240',
        })
      );
    return Promise.resolve(null);
  });

  global.fetch = jest.fn();
});

afterAll(() => {
  jest.restoreAllMocks();
});

// ------------------------
// 6) Tests
// ------------------------

describe('CheckoutScreen', () => {
  it('renders header and back-button works', () => {
    const { getByTestId, getByText } = render(<CheckoutScreen />);
    expect(getByText('Checkout')).toBeTruthy();

    fireEvent.press(getByTestId('back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('disables Submit when no cards are returned', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { getByTestId } = render(<CheckoutScreen />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const btn = getByTestId('submit-button');
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('fetches and displays card options, default selected', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakeCards),
    });

    const { getByTestId } = render(<CheckoutScreen />);
    await waitFor(() => getByTestId('card-option-1'));

    // 🔍 Flatten and test default selected style
    const style1 = flattenStyle(getByTestId('card-option-1').props.style);
    expect(style1).toEqual(expect.objectContaining({ borderColor: '#007AFF' }));

    // Tap second card, expect selection change
    fireEvent.press(getByTestId('card-option-2'));
    const style2 = flattenStyle(getByTestId('card-option-2').props.style);
    expect(style2).toEqual(expect.objectContaining({ borderColor: '#007AFF' }));
  });

  it('shows error Toast when address validation fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeCards),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false, message: 'Bad address' }),
      });

    const { getByTestId } = render(<CheckoutScreen />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.changeText(getByTestId('address-input'), '123 Main St');
    fireEvent.press(getByTestId('card-option-1'));
    fireEvent.press(getByTestId('submit-button'));

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Invalid Address',
        })
      )
    );
  });

  it('completes checkout on valid flow', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeCards),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            standardized: {
              address: '123 Main St',
              city: 'Iowa City',
              state: 'IA',
              zip_code: '52240',
            },
          }),
      })
      .mockResolvedValueOnce({ ok: true });

    const cart = [{ id: 5, price: 10, quantity: 2 }];
    const clearCart = jest.fn();

    const { getByTestId } = render(
      <CartContext.Provider value={{ cart, clearCart }}>
        <CheckoutScreen />
      </CartContext.Provider>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.changeText(getByTestId('address-input'), '123 Main St');
    fireEvent.press(getByTestId('card-option-1'));
    fireEvent.press(getByTestId('submit-button'));

    await waitFor(() => {
      expect(clearCart).toHaveBeenCalled();
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          text1: 'Order placed!',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/store');
    });
  });
});
