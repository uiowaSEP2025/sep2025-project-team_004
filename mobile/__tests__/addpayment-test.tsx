// __tests__/PaymentMethod.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PaymentMethod from '../app/add-payment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

let mockGoBack: jest.Mock;
jest.mock('@react-navigation/native', () => {
  mockGoBack = jest.fn();
  return {
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
  };
});

let mockReplace: jest.Mock;
jest.mock('expo-router', () => {
  mockReplace = jest.fn();
  return {
    useRouter: () => ({
      replace: mockReplace,
    }),
  };
});

global.fetch = jest.fn();

describe('PaymentMethod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats card number correctly', () => {
    const { getByPlaceholderText, getByText } = render(<PaymentMethod />);
    const cardInput = getByPlaceholderText('Card Number');
    fireEvent.changeText(cardInput, '4242424242424242');
    expect(getByText('4242 4242 4242 4242')).toBeTruthy();
  });

  it('goes back when back button is pressed', () => {
    const { getByTestId } = render(<PaymentMethod />);
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows error if token is missing', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(<PaymentMethod />);
    const doneButton = getByTestId('done-button');
    fireEvent.press(doneButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('User not authenticated.');
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows success toast and navigates on successful submission', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const { getByTestId, getByPlaceholderText } = render(<PaymentMethod />);

    fireEvent.changeText(getByPlaceholderText('Card Number'), '4242424242424242');
    fireEvent.changeText(getByPlaceholderText('Card Holder Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Expiry Date'), '12/25');
    fireEvent.changeText(getByPlaceholderText('CVV'), '123');

    fireEvent.press(getByTestId('done-button'));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          text1: 'Success',
        }),
      );
      expect(mockReplace).toHaveBeenCalledWith('/payment-method');
    });
  });

  it('shows alert on failed API call', async () => {
    jest.spyOn(Alert, 'alert');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const { getByTestId, getByPlaceholderText } = render(<PaymentMethod />);
    fireEvent.changeText(getByPlaceholderText('Card Number'), '4242424242424242');
    fireEvent.changeText(getByPlaceholderText('Card Holder Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Expiry Date'), '12/25');
    fireEvent.changeText(getByPlaceholderText('CVV'), '123');

    fireEvent.press(getByTestId('done-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'There was an error adding your card.');
    });
  });

  it('calls handleAddCard with add-new-card-button as well', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const { getByTestId, getByPlaceholderText } = render(<PaymentMethod />);
    fireEvent.changeText(getByPlaceholderText('Card Number'), '4111111111111111');
    fireEvent.changeText(getByPlaceholderText('Card Holder Name'), 'Jane Smith');
    fireEvent.changeText(getByPlaceholderText('Expiry Date'), '11/30');
    fireEvent.changeText(getByPlaceholderText('CVV'), '456');

    fireEvent.press(getByTestId('add-new-card-button'));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalled();
    });
  });
});
