import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import CartScreen from '../app/cart';
import { CartContext } from '../app/context/CartContext';

// --- Mocks --- //
jest.mock('expo-router', () => {
  const backMock = jest.fn();
  return {
    useRouter: () => ({
      back: backMock,
      push: jest.fn(),
    }),
    __backMock: backMock,
  };
});
const backMock = (jest.requireMock('expo-router') as { __backMock: jest.Mock }).__backMock;

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: () => [true, null],
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, {
    get: (_, name) =>
      (props: any) =>
        React.createElement(View, { ...props, testID: `icon-${name}` }),
  });
});

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// --- Fake Cart Data --- //
const fakeCart = [
  {
    id: 1,
    name: 'Product 1',
    price: 10,
    quantity: 2,
    image: 'http://example.com/image1.png',
  },
  {
    id: 2,
    name: 'Product 2',
    price: 20,
    quantity: 1,
    image: 'http://example.com/image2.png',
  },
];

// --- Mock CartContext Values --- //
const emptyCartContext = {
  cart: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateCartQuantity: jest.fn(),
  clearCart: jest.fn(),
};

const filledCartContext = {
  cart: fakeCart,
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateCartQuantity: jest.fn(),
  clearCart: jest.fn(),
};

// --- Setup Helper --- //
const setup = (contextValue: any) => {
  return render(
    <CartContext.Provider value={contextValue}>
      <CartScreen />
    </CartContext.Provider>
  );
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// --- Test Suite --- //
describe('CartScreen', () => {
  it('renders empty cart message when cart is empty', () => {
    const { getByText } = setup(emptyCartContext);
    expect(getByText('Your cart is empty.')).toBeTruthy();
  });

  it('renders list of cart items when cart is not empty', () => {
    const { getByText } = setup(filledCartContext);
    expect(getByText('Product 1')).toBeTruthy();
    expect(getByText('Product 2')).toBeTruthy();
  });

  it('calls router.back() when back button is pressed', () => {
    const { getByTestId } = setup(filledCartContext);
    const backButton = getByTestId('back-button');
    act(() => {
      fireEvent.press(backButton);
    });
    expect(backMock).toHaveBeenCalled();
  });

  it('calls updateCartQuantity when quantity buttons are pressed', () => {
    const { getAllByText } = setup(filledCartContext);
    const minusButtons = getAllByText('-');
    const plusButtons = getAllByText('+');

    act(() => {
      fireEvent.press(minusButtons[0]);
    });
    expect(filledCartContext.updateCartQuantity).toHaveBeenCalledWith(1, 1);

    act(() => {
      fireEvent.press(plusButtons[0]);
    });
    expect(filledCartContext.updateCartQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('calls removeFromCart when Remove is pressed', () => {
    const { getAllByText } = setup(filledCartContext);
    const removeButtons = getAllByText('Remove');

    act(() => {
      fireEvent.press(removeButtons[0]);
    });
    expect(filledCartContext.removeFromCart).toHaveBeenCalledWith(1);
  });

  it('displays correct checkout total', () => {
    const { getByText } = setup(filledCartContext);
    expect(getByText('Checkout ($40.00)')).toBeTruthy();
  });

  it('shows toast when trying to checkout with empty cart', () => {
    const toast = require('react-native-toast-message');
    const { getByText } = setup(emptyCartContext);

    fireEvent.press(getByText(/checkout/i));
    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: 'Cart is empty',
      })
    );
  });
});
