// __tests__/add-payment-test.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AddPayment from '../app/add-payment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

// Use a unified mock for Navigation to ensure that useNavigation returns the same object for both internal calls and test assertions.
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: mockGoBack,
      push: jest.fn(),
    }),
    // Simply return children to avoid interference from NavigationContainer logic
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  };
});

// mock image resources
jest.mock('@/assets/images/back-arrow.png', () => 'back-arrow.png');
jest.mock('@/assets/images/card-logo/amex.png', () => 'amex.png');
jest.mock('@/assets/images/card-logo/discover.png', () => 'discover.png');
jest.mock('@/assets/images/card-logo/mastercard.png', () => 'mastercard.png');
jest.mock('@/assets/images/card-logo/visa.png', () => 'visa.png');

// mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AddPayment Screen', () => {
  const duplicateCard = {
    last4: '1111',
    cardHolder: 'John Doe',
    expiry: '12/24',
    cardType: 'visa',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Invalid Card Number" alert when the card number is less than 16 digits', async () => {
    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <AddPayment />
      </NavigationContainer>
    );

    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardHolderInput = getByPlaceholderText('Card Holder Name');
    const expiryInput = getByPlaceholderText('Expiry Date');

    act(() => {
      fireEvent.changeText(cardNumberInput, '1234 5678 9012');
      fireEvent.changeText(cardHolderInput, 'John Doe');
      fireEvent.changeText(expiryInput, '12/24');
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const doneButton = getByText('Done');
    act(() => {
      fireEvent.press(doneButton);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Invalid Card Number',
        'Please enter a valid card number.'
      );
    });
    alertSpy.mockRestore();
  });

  it('displays a Duplicate alert and calls navigation.goBack when adding a duplicate card', async () => {
    // Simulate stored duplicate card data
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([duplicateCard]));

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <AddPayment />
      </NavigationContainer>
    );

    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardHolderInput = getByPlaceholderText('Card Holder Name');
    const expiryInput = getByPlaceholderText('Expiry Date');

    // Simulate input: a valid 16-digit card number (format: 4111 1111 1111 1111), card holder "John Doe", expiry "12/24"
    await act(async () => {
      fireEvent.changeText(cardNumberInput, '4111 1111 1111 1111');
      fireEvent.changeText(cardHolderInput, 'John Doe');
      fireEvent.changeText(expiryInput, '12/24');
    });

    // Confirm the input values have been updated (this helps with debugging)
    await waitFor(() => {
      expect(cardNumberInput.props.value).toBe('4111 1111 1111 1111');
      expect(cardHolderInput.props.value).toBe('John Doe');
      expect(expiryInput.props.value).toBe('12/24');
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const doneButton = getByText('Done');
    await act(async () => {
      fireEvent.press(doneButton);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Duplicate Card',
        'This card has already been added.'
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('calls AsyncStorage.setItem, shows a success alert, and navigates back when a new card is added successfully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <AddPayment />
      </NavigationContainer>
    );
    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardHolderInput = getByPlaceholderText('Card Holder Name');
    const expiryInput = getByPlaceholderText('Expiry Date');

    act(() => {
      fireEvent.changeText(cardNumberInput, '4111 1111 1111 1111');
      fireEvent.changeText(cardHolderInput, 'Alice');
      fireEvent.changeText(expiryInput, '11/23');
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const doneButton = getByText('Done');
    await act(async () => {
      fireEvent.press(doneButton);
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Card Added',
        'Your card has been added successfully.'
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('catches exceptions when adding a card fails and displays an error alert', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const storageError = new Error('Storage error');
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(storageError);

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <AddPayment />
      </NavigationContainer>
    );
    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardHolderInput = getByPlaceholderText('Card Holder Name');
    const expiryInput = getByPlaceholderText('Expiry Date');

    act(() => {
      fireEvent.changeText(cardNumberInput, '4111 1111 1111 1111');
      fireEvent.changeText(cardHolderInput, 'Bob');
      fireEvent.changeText(expiryInput, '10/22');
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const doneButton = getByText('Done');
    await act(async () => {
      fireEvent.press(doneButton);
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error storing card', storageError);
      expect(alertSpy).toHaveBeenCalledWith('Error', 'There was an error adding your card.');
    });
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('automatically detects the card type based on the entered card number and renders the corresponding logo', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <AddPayment />
      </NavigationContainer>
    );
    const cardNumberInput = getByPlaceholderText('Card Number');

    act(() => {
      fireEvent.changeText(cardNumberInput, '5111 1111 1111 1111');
    });

    await waitFor(() => {
      const cardLogo = getByTestId('card-logo');
      expect(cardLogo.props.source).toBe('mastercard.png');
    });
  });
});
