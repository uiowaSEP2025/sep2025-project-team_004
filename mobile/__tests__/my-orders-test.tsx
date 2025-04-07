import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Order from '../app/my-orders'; // adjust the import path as needed
import { useRouter } from 'expo-router';

// Mock the useRouter hook from expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

describe('Order Component', () => {
  const mockBack = jest.fn();

  beforeEach(() => {
    mockBack.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });
  });

  it('renders header and tabs correctly', () => {
    const { getByText, getByTestId, getAllByText } = render(<Order />);
    expect(getByText('My order')).toBeTruthy();
    expect(getByTestId('back-button')).toBeTruthy();

    // Use getAllByText and select the first occurrence for each tab.
    expect(getAllByText('Delivered')[0]).toBeTruthy();
    expect(getAllByText('Processing')[0]).toBeTruthy();
    expect(getAllByText('Canceled')[0]).toBeTruthy();
  });

  it('calls router.back when back button is pressed', () => {
    const { getByTestId } = render(<Order />);
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    expect(mockBack).toHaveBeenCalled();
  });

  it('displays Delivered orders by default', () => {
    const { queryAllByText } = render(<Order />);
    // "Detail" text is rendered in each order card.
    // Delivered orders are expected to be 3.
    expect(queryAllByText('Detail')).toHaveLength(3);
  });

  it('switches to Processing tab and displays Processing orders', () => {
    const { getByText, queryAllByText } = render(<Order />);
    // Press the Processing tab by its text.
    fireEvent.press(getByText('Processing'));
    // Processing orders should be 2 in number.
    expect(queryAllByText('Detail')).toHaveLength(2);
    // Optionally, check for a specific order detail.
    expect(getByText('11/03/2022')).toBeTruthy();
  });

  it('switches to Canceled tab and displays Canceled orders', () => {
    const { getByText, queryAllByText } = render(<Order />);
    // Press the Canceled tab by its text.
    fireEvent.press(getByText('Canceled'));
    // Canceled orders should be 1 in number.
    expect(queryAllByText('Detail')).toHaveLength(1);
    // Optionally, check for a specific order detail.
    expect(getByText('02/13/2021')).toBeTruthy();
  });
});
