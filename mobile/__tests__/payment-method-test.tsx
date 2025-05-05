// __tests__/payment-method-test.tsx

// 1) Force the fallback branch so API_BASE_URL is defined
process.env.EXPO_PUBLIC_DEV_FLAG = 'false';
process.env.EXPO_PUBLIC_BACKEND_URL = 'http://test-backend';

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PaymentMethod from '../app/payment-method';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Platform, Alert } from 'react-native';

// mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));

describe('<PaymentMethod />', () => {
  const pushMock = jest.fn();
  const backMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock, back: backMock });
    (useFocusEffect as jest.Mock).mockImplementation(cb => cb());
    Object.defineProperty(Platform, 'OS', { get: () => 'web' });
    global.fetch = jest.fn();
  });

  it('renders header buttons and title', () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
    (fetch as jest.Mock).mockResolvedValue({ json: () => Promise.resolve([]) });

    const { getByTestId, getByText } = render(<PaymentMethod />);
    expect(getByTestId('back-button')).toBeTruthy();
    expect(getByTestId('add-payment-button')).toBeTruthy();
    expect(getByText('Payment method')).toBeTruthy();
  });

  it('loads cards and displays them, and shows disabled style on default', async () => {
    const cardsData = [
      { id: '1', last4: '4242', brand: 'visa', cardholder_name: 'John Doe', exp_month: 12, exp_year: 2025, is_default: true },
      { id: '2', last4: '1234', brand: 'mastercard', cardholder_name: 'Jane Smith', exp_month: 1, exp_year: 2024, is_default: false },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('abc');
    (fetch as jest.Mock).mockResolvedValue({ json: () => Promise.resolve(cardsData) });

    const { findByText, findAllByTestId } = render(<PaymentMethod />);
    await findByText('John Doe');
    await findByText('Jane Smith');

    expect(await findByText(/4242/)).toBeTruthy();
    expect(await findByText('12/2025')).toBeTruthy();
    expect(await findByText(/1234/)).toBeTruthy();
    expect(await findByText('1/2024')).toBeTruthy();

    const [delBtn1] = await findAllByTestId('delete-button-1');
    const [delBtn2] = await findAllByTestId('delete-button-2');

    expect(delBtn1.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.5 })])
    );
    expect(delBtn2.props.style).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.5 })])
    );
  });

  it('handles delete immediately on web', async () => {
    const cards = [{ id: '1', last4: '0000', brand: 'visa', cardholder_name: 'A', exp_month: 11, exp_year: 2023, is_default: false }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('tok');
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve(cards) })   // initial load
      .mockResolvedValueOnce({})                                      // DELETE
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });    // reload after delete

    const { findAllByTestId } = render(<PaymentMethod />);
    const [delBtn] = await findAllByTestId('delete-button-1');
    fireEvent.press(delBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/payment\/stripe\/delete\/1\//),
        expect.objectContaining({
          method: 'DELETE',
          headers: { Authorization: 'Token tok' },
        })
      );
    });
  });

  it('prompts confirm alert and then deletes on non-web', async () => {
    Object.defineProperty(Platform, 'OS', { get: () => 'ios' });
    const cards = [{ id: '3', last4: '3333', brand: 'amex', cardholder_name: 'C', exp_month: 5, exp_year: 2022, is_default: false }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('xyz');
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve(cards) })
      .mockResolvedValue({}); 

    Alert.alert = jest.fn((_, __, buttons) => buttons![0].onPress!());

    const { findAllByTestId } = render(<PaymentMethod />);
    const [delBtn] = await findAllByTestId('delete-button-3');
    fireEvent.press(delBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Card',
      'Are you sure you want to delete this card?',
      expect.any(Array),
      { cancelable: true }
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/payment\/stripe\/delete\/3\//),
        expect.objectContaining({
          method: 'DELETE',
          headers: { Authorization: 'Token xyz' },
        })
      );
    });
  });

  it('sets a card as default when checkbox pressed', async () => {
    const cards = [{ id: '1', last4: '0000', brand: 'visa', cardholder_name: 'A', exp_month: 11, exp_year: 2023, is_default: false }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('tok2');
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve(cards) })
      .mockResolvedValue({});

    const { findAllByTestId } = render(<PaymentMethod />);
    const [checkbox] = await findAllByTestId('default-checkbox-1');
    fireEvent.press(checkbox);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/payment\/stripe\/set-default\/1\//),
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Token tok2' },
        })
      );
    });
  });

  it('navigates back and to add-payment', () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('t');
    (fetch as jest.Mock).mockResolvedValue({ json: () => Promise.resolve([]) });

    const { getByTestId } = render(<PaymentMethod />);
    fireEvent.press(getByTestId('back-button'));
    expect(backMock).toHaveBeenCalled();

    fireEvent.press(getByTestId('add-payment-button'));
    expect(pushMock).toHaveBeenCalledWith('/add-payment');
  });

  it('only renders up to 10 cards even if more are returned', async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`, last4: `${i}`.padStart(4,'0'), brand: 'visa',
      cardholder_name: `Name${i}`, exp_month: 1, exp_year: 2023, is_default: false
    }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('tok3');
    (fetch as jest.Mock).mockResolvedValue({ json: () => Promise.resolve(many) });

    const { findAllByTestId } = render(<PaymentMethod />);
    const boxes = await findAllByTestId(/default-checkbox-/);
    expect(boxes).toHaveLength(10);
  });
});
