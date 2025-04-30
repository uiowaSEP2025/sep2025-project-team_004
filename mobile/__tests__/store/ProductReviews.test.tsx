import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ProductReviewsScreen from '../../app/product-reviews';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Mock the expo-router hooks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe('ProductReviewsScreen', () => {
  // Mock data
  const mockProductId = '123';
  const mockProductName = 'Test Product';
  const mockReviews = [
    { id: 1, rating: 5, comment: 'Great product!', created_at: '2023-05-01T12:00:00Z' },
    { id: 2, rating: 3, comment: 'Average product', created_at: '2023-05-02T12:00:00Z' },
    { id: 3, rating: 4, comment: 'Good product', created_at: '2023-05-03T12:00:00Z' }
  ];

  // Setup mocks before each test
  beforeEach(() => {
    // Mock router
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });
    
    // Mock search params
    (useLocalSearchParams as jest.Mock).mockReturnValue({ 
      productId: mockProductId, 
      productName: mockProductName 
    });
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  it('displays loading state initially', () => {
    // Mock fetch to not resolve yet
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    
    render(<ProductReviewsScreen />);
    
    // Check that loading indicator is displayed
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays reviews when data is loaded', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReviews)
      })
    );
    
    render(<ProductReviewsScreen />);
    
    // Wait for reviews to load
    await waitFor(() => {
      // Check that the product name is displayed in the header
      expect(screen.getByText(`${mockProductName} - Reviews`)).toBeTruthy();
      
      // Check that the reviews are displayed
      expect(screen.getByText('Great product!')).toBeTruthy();
      expect(screen.getByText('Average product')).toBeTruthy();
      expect(screen.getByText('Good product')).toBeTruthy();
    });
  });

  it('displays empty state when no reviews are available', async () => {
    // Mock empty response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );
    
    render(<ProductReviewsScreen />);
    
    // Wait for empty message to appear
    await waitFor(() => {
      expect(screen.getByText('No reviews available for this product.')).toBeTruthy();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock fetch error
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
    );
    
    console.error = jest.fn(); // Suppress error logs
    
    render(<ProductReviewsScreen />);
    
    // Wait for empty state to be displayed
    await waitFor(() => {
      expect(screen.getByText('No reviews available for this product.')).toBeTruthy();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('navigates back when pressing the back button', () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReviews)
      })
    );
    
    render(<ProductReviewsScreen />);
    
    // Press the back button
    fireEvent.press(screen.getByTestId('back-button'));
    
    // Verify router.back was called
    expect(useRouter().back).toHaveBeenCalled();
  });
}); 