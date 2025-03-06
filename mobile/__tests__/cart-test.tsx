// __tests__/cart-test.tsx
import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import CartScreen from '../app/cart'; // Adjust the path as needed
import { CartContext } from '../app/context/CartContext';

// --- Mock expo-router ---
jest.mock('expo-router', () => {
  const backMock = jest.fn();
  return {
    useRouter: () => ({
      back: backMock,
    }),
    __backMock: backMock,
  };
});
const backMock = (jest.requireMock('expo-router') as { __backMock: jest.Mock }).__backMock;

  
  jest.mock('expo-font', () => ({
    loadAsync: jest.fn(() => Promise.resolve()),
    useFonts: () => [true],
    isLoaded: jest.fn(() => true),
  }));
  

// --- Fake Cart Data ---
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

// --- Mock CartContext Values ---
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

// --- Setup Helper ---
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
    // The quantity controls display "-" and "+" texts.
    const minusButtons = getAllByText('-');
    const plusButtons = getAllByText('+');
    // For Product 1 (id: 1) quantity is initially 2.
    act(() => {
      fireEvent.press(minusButtons[0]);
    });
    // Expected new quantity for Product 1: Math.max(1, 2 - 1) === 1
    expect(filledCartContext.updateCartQuantity).toHaveBeenCalledWith(1, 1);

    act(() => {
      fireEvent.press(plusButtons[0]);
    });
    // Expected new quantity for Product 1: 2 + 1 === 3
    expect(filledCartContext.updateCartQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('calls removeFromCart when Remove is pressed', () => {
    const { getAllByText } = setup(filledCartContext);
    // "Remove" appears for each cart item.
    const removeButtons = getAllByText('Remove');
    // Simulate pressing the remove button for the first product.
    act(() => {
      fireEvent.press(removeButtons[0]);
    });
    expect(filledCartContext.removeFromCart).toHaveBeenCalledWith(1);
  });

  it('displays correct checkout total', () => {
    const { getByText } = setup(filledCartContext);
    // Total: Product 1: 10 * 2 = 20, Product 2: 20 * 1 = 20, so overall total = 40
    expect(getByText('Checkout ($40.00)')).toBeTruthy();
  });
});
