// __tests__/cartcontext.test.tsx
import React, { useContext } from 'react';
import { Text, Button, View } from 'react-native';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContext, CartProvider } from '../app/context/CartContext';

// Mock AsyncStorage using its jest mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// A simple consumer component to interact with CartContext.
const CartConsumer: React.FC = () => {
  const cartContext = useContext(CartContext);
  if (!cartContext) return null;
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart } = cartContext;
  return (
    <View>
      {/* Render the cart as a JSON string for testing */}
      <Text testID="cartItems">{JSON.stringify(cart)}</Text>
      <Button
        testID="addButton"
        title="Add"
        onPress={() =>
          addToCart({ id: 1, name: 'Test Item', price: 10, quantity: 1 }, 1)
        }
      />
      <Button
        testID="addAgainButton"
        title="Add Again"
        onPress={() =>
          addToCart({ id: 1, name: 'Test Item', price: 10, quantity: 1 }, 1)
        }
      />
      <Button
        testID="removeButton"
        title="Remove"
        onPress={() => removeFromCart(1)}
      />
      <Button
        testID="updateButton"
        title="Update"
        onPress={() => updateCartQuantity(1, 5)}
      />
      <Button testID="clearButton" title="Clear" onPress={clearCart} />
    </View>
  );
};

// A helper to render the CartProvider with our consumer.
const renderCartProvider = () =>
  render(
    <CartProvider>
      <CartConsumer />
    </CartProvider>
  );

// Ensure AsyncStorage is cleared before each test.
beforeEach(async () => {
  await AsyncStorage.clear();
});
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('CartContext', () => {
  it('loads initial cart from AsyncStorage', async () => {
    // Set up AsyncStorage to return a preset cart value.
    const presetCart = [{ id: 1, name: 'Stored Item', price: 15, quantity: 3 }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(presetCart));

    const { getByTestId } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Wait for the provider to load the preset cart.
    await waitFor(() => {
      expect(getByTestId('cartItems').props.children).toContain('Stored Item');
    });
  });

  it('adds an item to the cart', async () => {
    const { getByTestId } = renderCartProvider();
    const cartItemsText = getByTestId('cartItems');
    // Initially, cart should be empty.
    expect(cartItemsText.props.children).toEqual('[]');

    // Press the add button.
    fireEvent.press(getByTestId('addButton'));

    await waitFor(() => {
      // After adding, expect the cart to contain the item.
      expect(getByTestId('cartItems').props.children).toContain('Test Item');
    });
  });

  it('increases quantity if the same item is added again', async () => {
    const { getByTestId } = renderCartProvider();

    // Press add button twice.
    fireEvent.press(getByTestId('addButton'));
    fireEvent.press(getByTestId('addAgainButton'));

    await waitFor(() => {
      // The cart item should now have quantity 2.
      expect(getByTestId('cartItems').props.children).toContain('"quantity":2');
    });
  });

  it('removes an item from the cart', async () => {
    const { getByTestId } = renderCartProvider();
    // Add an item first.
    fireEvent.press(getByTestId('addButton'));

    await waitFor(() => {
      expect(getByTestId('cartItems').props.children).toContain('Test Item');
    });

    // Press the remove button.
    fireEvent.press(getByTestId('removeButton'));

    await waitFor(() => {
      expect(getByTestId('cartItems').props.children).toEqual('[]');
    });
  });

  it('updates the quantity of an item', async () => {
    const { getByTestId } = renderCartProvider();
    // Add an item.
    fireEvent.press(getByTestId('addButton'));

    await waitFor(() => {
      expect(getByTestId('cartItems').props.children).toContain('Test Item');
    });

    // Press update button.
    fireEvent.press(getByTestId('updateButton'));

    // Instead of parsing JSON, check for a substring that indicates quantity 5.
    await waitFor(() => {
      expect(getByTestId('cartItems').props.children).toContain('"quantity":5');
    });
  });

  it('clears the cart', async () => {
    const { getByTestId } = renderCartProvider();
    // Add an item.
    fireEvent.press(getByTestId('addButton'));

    await waitFor(() => {
      expect(getByTestId('cartItems').props.children).toContain('Test Item');
    });

    // Press clear button.
    fireEvent.press(getByTestId('clearButton'));

    await waitFor(() => {
      expect(getByTestId('cartItems').props.children).toEqual('[]');
    });
  });
});
