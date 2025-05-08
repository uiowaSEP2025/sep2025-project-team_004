import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProductReviewsScreen from '../app/product-reviews';
import { useLocalSearchParams, useRouter } from 'expo-router';

global.fetch = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockRouterBack = jest.fn();

const MOCK_REVIEWS = {
  count: 3,
  results: [
    { id: 1, rating: 4, comment: 'Great!', created_at: '2024-01-01T00:00:00Z' },
    { id: 2, rating: 5, comment: 'Excellent!', created_at: '2024-01-02T00:00:00Z' },
    { id: 3, rating: 2, comment: 'Not good', created_at: '2024-01-03T00:00:00Z' },
  ],
  next: null,
};

describe('<ProductReviewsScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back: mockRouterBack });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      productId: '123',
      productName: 'Test Product',
    });
  });

  it('renders loading state initially', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_REVIEWS,
    });

    const { getByTestId } = render(<ProductReviewsScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it('renders empty state when no reviews', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 0, results: [] }),
    });

    const { getByTestId, getByText } = render(<ProductReviewsScreen />);
    await waitFor(() => getByTestId('empty-state'));
    expect(getByText(/no reviews/i)).toBeTruthy();
  });

  it('renders reviews list', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_REVIEWS,
    });

    const { getByTestId, getByText } = render(<ProductReviewsScreen />);
    await waitFor(() => getByTestId('reviews-list'));

    expect(getByText(/Great!/)).toBeTruthy();
    expect(getByText(/Excellent!/)).toBeTruthy();
    expect(getByText(/Not good/)).toBeTruthy();
  });

  it('triggers back navigation', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_REVIEWS,
    });

    const { getByTestId } = render(<ProductReviewsScreen />);
    await waitFor(() => getByTestId('reviews-list'));

    fireEvent.press(getByTestId('back-button'));
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('allows sorting to highest rated', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => MOCK_REVIEWS,
    });

    const { getByText } = render(<ProductReviewsScreen />);
    await waitFor(() => getByText(/Great!/));

    fireEvent.press(getByText(/Highest Rated/));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('reviews/?page=1'));
    });
  });

  it('loads more reviews on button press', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...MOCK_REVIEWS, next: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_REVIEWS,
      });

    const { getByText, getByTestId } = render(<ProductReviewsScreen />);
    await waitFor(() => getByTestId('reviews-list'));

    await act(async () => {
      fireEvent.press(getByText(/Load More Reviews/));
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const { getByTestId } = render(<ProductReviewsScreen />);
    await waitFor(() => getByTestId('empty-state'));
  });
});
