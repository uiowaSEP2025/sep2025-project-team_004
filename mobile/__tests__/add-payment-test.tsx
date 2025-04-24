// __tests__/add-payment-test.tsx
import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from '@testing-library/react-native';
import AddPayment from '../app/add-payment';
import { NavigationContext, NavigationProp, ParamListBase } from '@react-navigation/native';

// --- Navigation mock ---
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
} as any as NavigationProp<ParamListBase>;

// --- Mock expo-router's useRouter ---
const mockedRouter = {
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
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

describe("Add Payment Screen", () => {
  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("renders the add payment screen with title and button", async () => {
    const { getByText } = render(<AddPayment />);
    
    expect(getByText("Add a Payment Method")).toBeTruthy();
    expect(getByText("We'll redirect you to Stripe to securely add your card.")).toBeTruthy();
    expect(getByText("Add New Card")).toBeTruthy();
  });

  it("navigates to add-card-webview when Add New Card button is pressed", async () => {
    const { getByText } = render(<AddPayment />);
    
    const addButton = getByText("Add New Card");
    act(() => {
      fireEvent.press(addButton);
    });

    expect(mockedRouter.push).toHaveBeenCalledWith('/add-card-webview');
  });
  
  it("uses the navigation context correctly", async () => {
    const { getByText } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <AddPayment />
      </NavigationContext.Provider>
    );
    
    expect(getByText("Add a Payment Method")).toBeTruthy();
    expect(getByText("We'll redirect you to Stripe to securely add your card.")).toBeTruthy();
  });
});
