// __tests__/store-test.tsx
import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import StoreScreen from '../app/(tabs)/store'; // Adjust the import path as needed
import { CartContext } from '../app/context/CartContext';
import { within } from '@testing-library/react-native';


// --- Mock expo-router ---
// Define the push mock inside the jest.mock factory so that no out-of-scope variables are referenced.
jest.mock('expo-router', () => {
  const pushMock = jest.fn();
  return {
    useRouter: () => ({
      push: pushMock,
    }),
    // Export the pushMock so we can assert navigation events.
    __pushMock: pushMock,
  };
});

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: () => [true],
  isLoaded: jest.fn(() => true),
}));

// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');


// Instead of a named import (which causes TS errors), retrieve the push mock from the mock module.
const pushMock = (jest.requireMock('expo-router') as { __pushMock: jest.Mock }).__pushMock;

// --- Fake Data & Context Setup ---
const fakeProducts = [
  {
    id: 1,
    name: 'Product 1',
    description: 'Test product 1',
    price: 10,
    image: 'http://example.com/image1.png',
  },
  {
    id: 2,
    name: 'Product 2',
    description: 'Test product 2',
    price: 20,
    image: 'http://example.com/image2.png',
  },
];

// Provide a mock CartContext value with all required methods.
const mockCartContextValue = {
  cart: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateCartQuantity: jest.fn(),
  clearCart: jest.fn(),
};

// --- Global Fetch Mock ---
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(fakeProducts),
    })
  ) as jest.Mock;
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// --- Setup Function ---
const setup = () => {
  return render(
    <CartContext.Provider value={mockCartContextValue}>
      <StoreScreen />
    </CartContext.Provider>
  );
};

// --- Test Suite ---
describe('StoreScreen', () => {
  it('renders the loading indicator initially', async () => {
    // Mock the fetch call to control loading state
    global.fetch = jest.fn(() => 
      new Promise(resolve => setTimeout(() => {
        resolve({
          json: () => Promise.resolve([])
        });
      }, 100))
    );
    
    const { UNSAFE_getByType } = render(
      <CartContext.Provider value={{ cart: [], addToCart: jest.fn(), removeFromCart: jest.fn(), clearCart: jest.fn() }}>
        <StoreScreen />
      </CartContext.Provider>
    );
    
    // Find the ActivityIndicator by type instead of testID
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders the product list after fetching', async () => {
    const { getByText } = setup();
    await waitFor(() => {
      expect(getByText('Product 1')).toBeTruthy();
      expect(getByText('Product 2')).toBeTruthy();
    });
  });

  it('opens modal when a product cart button is pressed', async () => {
    const { getByText, getByTestId } = setup();
    // Wait for products to load
    await waitFor(() => {
      expect(getByText('Product 1')).toBeTruthy();
    });
    // Simulate press on the cart button for Product 1
    const cartButton = getByTestId('cart-button-1');
    act(() => {
      fireEvent.press(cartButton);
    });
    // Verify the modal becomes visible and displays Product 1 within the modal
    await waitFor(() => {
      const modal = getByTestId('product-modal');
      expect(modal.props.visible).toBe(true);
      // Use within to search only inside the modal container
      expect(within(modal).getByText('Product 1')).toBeTruthy();
    });
  });

  it('increments quantity and adds product to cart', async () => {
    const { getByTestId, getByText } = setup();
    await waitFor(() => {
      expect(getByText('Product 1')).toBeTruthy();
    });
    // Open modal for Product 1
    const cartButton = getByTestId('cart-button-1');
    act(() => {
      fireEvent.press(cartButton);
    });
    await waitFor(() => {
      expect(getByTestId('product-modal').props.visible).toBe(true);
    });
    // Check initial quantity is "1"
    expect(getByText('1')).toBeTruthy();
    // Simulate press on the plus button to increase quantity
    const plusButton = getByTestId('plus-button');
    act(() => {
      fireEvent.press(plusButton);
    });
    await waitFor(() => {
      expect(getByText('2')).toBeTruthy();
    });
    // Press the "Add to Cart" button
    const addToCartButton = getByText('Add to Cart');
    act(() => {
      fireEvent.press(addToCartButton);
    });
    // Ensure addToCart was called with product id 1 and quantity 2
    expect(mockCartContextValue.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      2
    );
  });

  it('navigates to cart when the top bar cart icon is pressed', async () => {
    const { getByTestId, getByText } = setup();
    
    // Wait for loading to complete by checking for a stable element.
    await waitFor(() => {
      expect(getByText('Make your community BETTER')).toBeTruthy();
    });
    
    const topCartButton = getByTestId('top-cart-button');
    act(() => {
      fireEvent.press(topCartButton);
    });
    
    expect(pushMock).toHaveBeenCalledWith('/cart');
  });  
});
