/**
 * __tests__/payment-method.test.tsx
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PaymentMethod from '../app/payment-method';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// --- Mock out images so require(...) calls don’t break in tests ---
jest.mock('@/assets/images/back-arrow.png',    () => 1);
jest.mock('@/assets/images/add-icon.png',       () => 1);
jest.mock('@/assets/images/card-logo/visa.png',        () => 1);
jest.mock('@/assets/images/card-logo/mastercard.png',  () => 1);
jest.mock('@/assets/images/card-logo/amex.png',        () => 1);
jest.mock('@/assets/images/card-logo/discover.png',    () => 1);
jest.mock('@/assets/images/delete.png',          () => 1);

// --- Mock AsyncStorage ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// --- Mock Constants ---
jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'test:8081' },
}));

// --- Mock expo-router hooks ---
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useFocusEffect: (cb: () => void) => cb(),  // immediately invoke focus effect
}));

// --- Mock global fetch ---
global.fetch = jest.fn();

describe('PaymentMethod component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Force web behavior so Alert.alert branch is bypassed
    Platform.OS = 'web';
  });

  it('renders header title and buttons', () => {
    const { getByTestId, getByText } = render(<PaymentMethod />);
    expect(getByTestId('back-button')).toBeTruthy();
    expect(getByTestId('add-payment-button')).toBeTruthy();
    expect(getByText('Payment method')).toBeTruthy();
  });

  it('fetches cards and displays their last4 and holder name', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
    const mockCards = [{
      id: '1', last4: '4242', brand: 'visa',
      cardholder_name: 'Alice', exp_month: 12, exp_year: 2025, is_default: false
    }];
    (global.fetch as jest.Mock)
      // first call: loadCards()
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockCards) });

    // Act
    const { findByText } = render(<PaymentMethod />);

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payment/stripe-methods/'),
        expect.any(Object)
      )
    );
    expect(await findByText('4242')).toBeTruthy();
    expect(await findByText('Alice')).toBeTruthy();
  });

  it('navigates back when back-button pressed', () => {
    const { getByTestId } = render(<PaymentMethod />);
    fireEvent.press(getByTestId('back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates to add-payment on add-button press', () => {
    const { getByTestId } = render(<PaymentMethod />);
    fireEvent.press(getByTestId('add-payment-button'));
    expect(mockPush).toHaveBeenCalledWith('/add-payment');
  });

  it('sends POST to set-default when default checkbox pressed', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
    const card = {
      id: '2', last4: '2222', brand: 'mastercard',
      cardholder_name: 'Bob', exp_month: 1, exp_year: 2026, is_default: false
    };
    // initial load
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve([card]) })
      // second call: set-default
      .mockResolvedValueOnce({ json: () => Promise.resolve([card]) });

    // Act
    const { findByTestId } = render(<PaymentMethod />);
    const checkbox = await findByTestId(`default-checkbox-${card.id}`);
    fireEvent.press(checkbox);

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/payment/stripe/set-default/${card.id}/`),
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('sends DELETE to delete endpoint on delete-button press (web)', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
    const card = {
      id: '3', last4: '3333', brand: 'amex',
      cardholder_name: 'Carol', exp_month: 6, exp_year: 2024, is_default: false
    };
    // initial load
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve([card]) })
      // delete call
      .mockResolvedValueOnce({ json: () => Promise.resolve({}) })
      // reload
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    // Act
    const { findByTestId } = render(<PaymentMethod />);
    const delBtn = await findByTestId(`delete-button-${card.id}`);
    fireEvent.press(delBtn);

    // Assert
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/payment/stripe/delete/${card.id}/`),
        expect.objectContaining({ method: 'DELETE' })
      )
    );
  });

  it('limits rendered cards to 10 when API returns more', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token123');
    // Generate 11 mock cards
    const manyCards = Array.from({ length: 11 }, (_, i) => ({
      id: `${i+1}`,
      last4: String(i+1).padStart(4, '0'),
      brand: 'visa',
      cardholder_name: `User${i+1}`,
      exp_month: 1,
      exp_year: 2025,
      is_default: false,
    }));
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve(manyCards) });

    const { findAllByTestId } = render(<PaymentMethod />);
    const checkboxes = await findAllByTestId(/default-checkbox-/);
    expect(checkboxes).toHaveLength(10);
  });
});
