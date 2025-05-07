import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import StoreScreen from '../../app/(tabs)/store';
import { CartContext } from '../../app/context/CartContext';
import { useRouter } from 'expo-router';

// Mock the expo-router hooks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock StoreSkeletonLoader for simpler testing
jest.mock('@/components/skeletons/StoreSkeletonLoader', () => 'StoreSkeletonLoader');

// Mock fetch API
global.fetch = jest.fn();

describe('Store Reviews Integration', () => {
  // Mock data
  const mockProducts = [
    {
      id: 1,
      name: 'Test Product',
      description: 'Test description',
      price: 99.99,
      average_rating: 4.5,
      review_count: 10,
      new_reviews: [
        { id: 1, rating: 5, comment: 'Great!', created_at: '2023-01-01T12:00:00Z' },
        { id: 2, rating: 4, comment: 'Good!', created_at: '2023-01-02T12:00:00Z' }
      ]
    }
  ];

  // Mock cart context
  const mockCartContext = {
    cart: [],
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    updateQuantity: jest.fn(),
    updateCartQuantity: jest.fn()
  };

  // Setup mocks before each test
  beforeEach(() => {
    // Mock router
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    // Mock fetch to return products
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts)
      })
    );
  });

  it('displays product with rating information', async () => {
    render(
      <CartContext.Provider value={mockCartContext}>
        <StoreScreen />
      </CartContext.Provider>
    );
    
    // Wait for products to load
    await waitFor(() => {
      // Check that rating stars are displayed
      expect(screen.getByTestId('rating-container-1')).toBeTruthy();
    });
  });

  it('opens product details when clicking on image or cart button', async () => {
    render(
      <CartContext.Provider value={mockCartContext}>
        <StoreScreen />
      </CartContext.Provider>
    );
    
    // Wait for products to load
    await waitFor(() => {
      // Find the product image
      const productImage = screen.getByTestId('product-image-1');
      expect(productImage).toBeTruthy();
    });
    
    // Click on the product image to open modal
    fireEvent.press(screen.getByTestId('product-image-1'));
    
    // Modal should be visible
    expect(screen.getByTestId('product-modal')).toBeTruthy();
    
    // Check that rating info is displayed in modal
    expect(screen.getByText('4.5 (10 reviews)')).toBeTruthy();
  });

  it('navigates to reviews page when clicking on reviews text', async () => {
    render(
      <CartContext.Provider value={mockCartContext}>
        <StoreScreen />
      </CartContext.Provider>
    );
    
    // Wait for products to load and open modal
    await waitFor(() => {
      const productImage = screen.getByTestId('product-image-1');
      expect(productImage).toBeTruthy();
    });
    
    // Open the modal
    fireEvent.press(screen.getByTestId('product-image-1'));
    
    // Click on the reviews text
    fireEvent.press(screen.getByTestId('reviews-link'));
    
    // Check that router.push was called with correct parameters
    expect(useRouter().push).toHaveBeenCalledWith({
      pathname: "/product-reviews",
      params: { 
        productId: 1, 
        productName: 'Test Product' 
      }
    });
    
    // Modal should be closed
    expect(screen.queryByTestId('product-modal')).toBeNull();
  });
}); 