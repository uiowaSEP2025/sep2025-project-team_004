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
import { NavigationContext, NavigationProp, ParamListBase } from '@react-navigation/native';


// Mock png feedback to avoid require() returning null
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
  id: 0,
  last4: '1234',
  cardholder_name: 'John Doe',
  expiration_date: '12/24',
  cardType: 'visa',
  is_default: false,
};

// -------------------
// Mock router
// -------------------
const mockedRouter = {
  back: jest.fn(),
  push: jest.fn(),
  navigate: jest.fn(),
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

const mockNavigation: NavigationProp<ParamListBase> = {
  goBack: jest.fn(),
  reset: jest.fn(),
  navigate: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
} as any;


// -------------------
// Mock AsyncStorage 
// -------------------
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// -------------------
// Helper to render PaymentMethod 
// -------------------
const renderPaymentMethod = () => render(<PaymentMethod />);

afterEach(cleanup);

describe('PaymentMethod Screen', () => {
  beforeEach(() => {
    mockedRouter.back.mockClear();
    mockedRouter.push.mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
    if (!global.fetch) {
      global.fetch = jest.fn();
    } else if (typeof (global.fetch as jest.Mock).mockClear === 'function') {
      (global.fetch as jest.Mock).mockClear();
    }
  });

  it('renders correctly with no stored cards', async () => {
    // Simulate no stored card info by returning null for stored cards
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  
    const { getByText, queryByText } = render(<PaymentMethod />);
  
    await waitFor(() => {
      expect(getByText('Payment method')).toBeTruthy();
    });
  
    expect(queryByText('Card Holder Name')).toBeNull();
  });

  it('renders correctly with stored cards', async () => {
    // Return a dummy auth token and stored card data via AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummyToken');
      return Promise.resolve(JSON.stringify([sampleCard]));
    });
    // Mock fetch to return valid card data (for loadCards)
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [sampleCard],
    });
  
    const { getByText } = renderPaymentMethod();
  
    await waitFor(() => {
      expect(getByText('Payment method')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('12/24')).toBeTruthy();
      expect(getByText(/1234/)).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = renderPaymentMethod(); 
    await act(async () => {
      fireEvent.press(getByTestId('back-button'));
    });
    expect(mockedRouter.navigate).toHaveBeenCalledWith("./Profile");
  });
  

  it('navigates to add payment screen when add button is pressed', async () => {
    const { getByTestId } = renderPaymentMethod();
    await act(async () => {
      fireEvent.press(getByTestId('add-payment-button'));
    });
    expect(mockedRouter.push).toHaveBeenCalledWith('/add-payment');
  });

  it('sets a card as default when default checkbox is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummyToken');
      return Promise.resolve(JSON.stringify([sampleCard]));
    });
    // For loadCards, return valid card data
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [sampleCard],
    });
  
    const { getByTestId } = renderPaymentMethod();
  
    await waitFor(() => {
      expect(getByTestId('default-checkbox-0')).toBeTruthy();
    });
  
    await act(async () => {
      fireEvent.press(getByTestId('default-checkbox-0'));
    });
  
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'storedCards',
        JSON.stringify([{ ...sampleCard, is_default: true }])
      );
    });
  });

  it('shows alert when delete button is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve('dummyToken');
      return Promise.resolve(JSON.stringify([sampleCard]));
    });
    // For loadCards, return valid card data
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [sampleCard],
    });
  
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = renderPaymentMethod();
  
    await waitFor(() => {
      expect(getByTestId('delete-button-0')).toBeTruthy();
    });
  
    await act(async () => {
      fireEvent.press(getByTestId('delete-button-0'));
    });
  
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Card',
      'Are you sure to delete this card？',
      expect.any(Array),
      { cancelable: true }
    );
  });

  // ---- Additional tests to improve coverage ----

  it("alerts user if not authenticated during loadCards", async () => {
    // Simulate missing authToken so that loadCards shows an alert
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => Promise.resolve(null));
    const alertSpy = jest.spyOn(Alert, 'alert');
    renderPaymentMethod();
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "User not authenticated.");
    });
  });

  it("alerts user if fetching payment methods fails", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve("dummyToken");
      return Promise.resolve(JSON.stringify([]));
    });
    // For loadCards, simulate a failed fetch
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed" }),
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    renderPaymentMethod();
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to load payment methods.");
    });
  });

  it("does not render default checkbox if auth token is missing", async () => {
    // When auth token is missing, loadCards returns early so no cards are loaded.
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve(null);
      return Promise.resolve(JSON.stringify([sampleCard]));
    });
    const { queryByTestId } = renderPaymentMethod();
    await waitFor(() => {
      expect(queryByTestId('default-checkbox-0')).toBeNull();
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("logs error when deletion fails", async () => {
    // Chain fetch calls: first for loadCards, then deletion fails.
    (global.fetch as jest.Mock) = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [sampleCard],
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Deletion failed" }),
      });
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve("dummyToken");
      return Promise.resolve(JSON.stringify([sampleCard]));
    });
  
    // Override Alert.alert to simulate user pressing "Yes" immediately.
    const alertMock = jest.spyOn(Alert, 'alert').mockImplementation(
      (title, message, buttons, options) => {
        const yesButton = buttons?.find((button: any) => button.text === 'Yes');
        if (yesButton && yesButton.onPress) {
          yesButton.onPress();
        }
      }
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
    const { getByTestId } = renderPaymentMethod();
    await waitFor(() => {
      expect(getByTestId('delete-button-0')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByTestId('delete-button-0'));
    });
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error deleting payment method:",
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
    alertMock.mockRestore();
  });
  

  it("only displays up to 10 cards", async () => {
    // Create 15 cards
    const manyCards = Array.from({ length: 15 }, (_, i) => ({
      ...sampleCard,
      id: i,
    }));
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'authToken') return Promise.resolve("dummyToken");
      return Promise.resolve(JSON.stringify(manyCards));
    });
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => manyCards,
    });
    const { getAllByTestId } = renderPaymentMethod();
    await waitFor(() => {
      // Check that only 10 default checkboxes are rendered
      expect(getAllByTestId(/default-checkbox-/).length).toBe(10);
    });
  });
});
