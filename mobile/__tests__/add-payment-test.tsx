// __tests__/add-payment-test.tsx
import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import PaymentMethod from '../app/add-payment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { NavigationContext, NavigationProp, ParamListBase } from '@react-navigation/native';


const mockNavigation: NavigationProp<ParamListBase> = {
    reset: jest.fn(),
    dispatch: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    isFocused: jest.fn(),
    canGoBack: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(),
    
  }as any as NavigationProp<ParamListBase>;



// --- Mock asset images so that require() returns dummy strings ---
jest.mock('@/assets/images/back-arrow.png', () => 'back-arrow.png');
jest.mock('@/assets/images/add-icon.png', () => 'add-icon.png');
jest.mock('@/assets/images/card-logo/visa.png', () => 'visa.png');
jest.mock('@/assets/images/card-logo/mastercard.png', () => 'mastercard.png');
jest.mock('@/assets/images/card-logo/amex.png', () => 'amex.png');
jest.mock('@/assets/images/card-logo/discover.png', () => 'discover.png');

// --- Mock AsyncStorage ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// --- Mock expo-router's useRouter ---
const mockedRouter = {
  navigate: jest.fn(),
  push: jest.fn(),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockedRouter,
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => mockNavigation,
  };
});

// --- Set a default fetch mock for GET requests (used in loadCards) ---
beforeEach(() => {
  cleanup();
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [], // Return an empty array to avoid .find() error
  });
});

describe('Add Payment Screen (PaymentMethod)', () => {
  it('renders header and input fields', async () => {
    const { getByText, getByPlaceholderText } = render(<PaymentMethod />);
    // Note: Your component renders header text "Payment method" (adjust if needed)
    await waitFor(() => {
      expect(getByText('Add payment method')).toBeTruthy();
    });
    // Verify the input fields exist by placeholder text.
    expect(getByPlaceholderText('Card Number')).toBeTruthy();
    expect(getByPlaceholderText('Card Holder Name')).toBeTruthy();
    expect(getByPlaceholderText('Expiry Date')).toBeTruthy();
    expect(getByPlaceholderText('CVV')).toBeTruthy();
  });

  it('formats card number correctly when input changes', async () => {
    const { getByPlaceholderText, getByText } = render(<PaymentMethod />);
    const cardNumberInput = getByPlaceholderText('Card Number');

    act(() => {
      fireEvent.changeText(cardNumberInput, '4111111111111111');
    });

    // Expect the displayed masked/formatted card number to be "4111 1111 1111 1111"
    await waitFor(() => {
      expect(getByText('4111 1111 1111 1111')).toBeTruthy();
    });
  });

  it('successfully adds a card when auth token is present and API call succeeds', async () => {
    // Simulate a valid auth token.
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummyToken');
      return Promise.resolve(null);
    });
    // Override fetch for the POST request.
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (options && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ card_id: 1 }),
        });
      }
      // For GET calls (loadCards) return an empty array.
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText, getByTestId } = render(<PaymentMethod />);
    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardHolderInput = getByPlaceholderText('Card Holder Name');
    const expiryInput = getByPlaceholderText('Expiry Date');

    act(() => {
      fireEvent.changeText(cardNumberInput, '4111111111111111');
      fireEvent.changeText(cardHolderInput, 'John Doe');
      fireEvent.changeText(expiryInput, '12/24');
    });

    // Press the header "Done" button.
    const doneButton = getByTestId('done-button');
    await act(async () => {
      fireEvent.press(doneButton);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Success', 'Your payment method has been added.');
      // In handleAddCard, after a successful POST, it calls: navigation.navigate("payment-method")
      expect(mockNavigation.navigate).toHaveBeenCalledWith('payment-method');
    });
  });

  it('shows error alert when auth token is missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = render(<PaymentMethod />);
    const doneButton = getByTestId('done-button');
    await act(async () => {
      fireEvent.press(doneButton);
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'User not authenticated.');
    });
  });

  it('shows error alert when API call fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dummyToken');
    // Override fetch for the POST call to simulate failure.
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (options && options.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: async () => ({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText, getByTestId } = render(<PaymentMethod />);
    const cardNumberInput = getByPlaceholderText('Card Number');
    const cardHolderInput = getByPlaceholderText('Card Holder Name');
    const expiryInput = getByPlaceholderText('Expiry Date');

    act(() => {
      fireEvent.changeText(cardNumberInput, '4111111111111111');
      fireEvent.changeText(cardHolderInput, 'John Doe');
      fireEvent.changeText(expiryInput, '12/24');
    });

    const doneButton = getByTestId('done-button');
    await act(async () => {
      fireEvent.press(doneButton);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'There was an error adding your card.');
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <PaymentMethod />
      </NavigationContext.Provider>
    );
    await act(async () => {
      fireEvent.press(getByTestId('back-button'));
    });
    await waitFor(() => {
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
  

  it('calls handleAddCard when "ADD NEW CARD" button is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dummyToken');
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (options && options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ card_id: 1 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = render(<PaymentMethod />);
    const addNewCardButton = getByTestId('add-new-card-button');
    await act(async () => {
      fireEvent.press(addNewCardButton);
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Success', 'Your payment method has been added.');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('payment-method');
    });
  });
});
