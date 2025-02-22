// __tests__/payment-method-test.tsx
import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import PaymentMethod from '../app/payment-method';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Mock png feedback，avoid require() returns null
jest.mock('@/assets/images/back-arrow.png', () => 'back-arrow.png');
jest.mock('@/assets/images/add-icon.png', () => 'add-icon.png');
jest.mock('@/assets/images/delete.png', () => 'delete.png');
jest.mock('@/assets/images/card-logo/visa.png', () => 'visa.png');
jest.mock('@/assets/images/card-logo/mastercard.png', () => 'mastercard.png');
jest.mock('@/assets/images/card-logo/amex.png', () => 'amex.png');
jest.mock('@/assets/images/card-logo/discover.png', () => 'discover.png');

// -------------------
// Sample Card
// -------------------
const sampleCard = {
  last4: '1234',
  cardHolder: 'John Doe',
  expiry: '12/24',
  cardType: 'visa',
  default: false,
};

// -------------------
// Mock router
// -------------------
const mockedRouter = {
  back: jest.fn(),
  push: jest.fn(),
};

// -------------------
// Mock expo-router
// -------------------
jest.mock('expo-router', () => ({
    useRouter: () => mockedRouter,
    useFocusEffect: (callback: () => void) => {
      callback();
    },
  }));
  

// -------------------
// Mock AsyncStorage 
// -------------------
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// -------------------
// Pack and Render PaymentMethod 
// -------------------
const renderPaymentMethod = () => render(<PaymentMethod />);


afterEach(cleanup);

describe('PaymentMethod Screen', () => {
  beforeEach(() => {
    mockedRouter.back.mockClear();
    mockedRouter.push.mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  it('renders correctly with no stored cards', async () => {
    // If AsyncStorage have no card info
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  
    const { getByText, queryByText } = render(<PaymentMethod />);
  
    await waitFor(() => {
      expect(getByText('Payment method')).toBeTruthy();
    });
  
    expect(queryByText('Card Holder Name')).toBeNull();
  });

  it('renders correctly with stored cards', async () => {
    // Mock AsyncStorage returns a card info
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([sampleCard]));

    const { getByText } = await renderPaymentMethod();

    await waitFor(() => {
      expect(getByText('Payment method')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('12/24')).toBeTruthy();
      // check the last 4 digits
      expect(getByText(/1234/)).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = await renderPaymentMethod();
    act(() => {
      fireEvent.press(getByTestId('back-button'));
    });
    expect(mockedRouter.back).toHaveBeenCalled();
  });

  it('navigates to add payment screen when add button is pressed', async () => {
    const { getByTestId } = await renderPaymentMethod();
    act(() => {
      fireEvent.press(getByTestId('add-payment-button'));
    });
    expect(mockedRouter.push).toHaveBeenCalledWith('/add-payment');
  });

  it('sets a card as default when default checkbox is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([sampleCard]));


    const { getByTestId } = await renderPaymentMethod();

    await waitFor(() => {
      expect(getByTestId('default-checkbox-0')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(getByTestId('default-checkbox-0'));
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'storedCards',
        JSON.stringify([{ ...sampleCard, default: true }])
      );
    });
  });

  it('shows alert when delete button is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([sampleCard]));
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    const { getByTestId } = renderPaymentMethod();
  
    await waitFor(() => {
      expect(getByTestId('delete-button-0')).toBeTruthy();
    });
  
    act(() => {
      fireEvent.press(getByTestId('delete-button-0'));
    });
  
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Card',
      'Are you sure to delete this card？',
      expect.any(Array),
      { cancelable: true }
    );
  });
  
});
