import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react-native";
import PaymentMethod from "../app/payment-method";
import { PaymentProvider } from "@/app/context/PaymentContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import { NavigationProp, ParamListBase } from "@react-navigation/native";

// Mock images to avoid require() errors
jest.mock("@/assets/images/back-arrow.png", () => "back-arrow.png");
jest.mock("@/assets/images/add-icon.png", () => "add-icon.png");
jest.mock("@/assets/images/delete.png", () => "delete.png");
jest.mock("@/assets/images/card-logo/visa.png", () => "visa.png");
jest.mock("@/assets/images/card-logo/mastercard.png", () => "mastercard.png");
jest.mock("@/assets/images/card-logo/amex.png", () => "amex.png");
jest.mock("@/assets/images/card-logo/discover.png", () => "discover.png");

// Mock Expo Router
const mockedRouter = {
  back: jest.fn(),
  push: jest.fn(),
  navigate: jest.fn(),
};

jest.mock("expo-router", () => ({
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

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock Payment Context (Partial Mock)
const mockPaymentContext = {
  cards: [
    {
      id: 1,
      last4: "1234",
      cardholder_name: "John Doe",
      expiration_date: "12/24",
      card_type: "visa",
      is_default: false,
    },
    {
      id: 2,
      last4: "5678",
      cardholder_name: "Jane Doe",
      expiration_date: "11/25",
      card_type: "mastercard",
      is_default: false,
    },
  ],
  loadCards: jest.fn(),
  setDefaultPayment: jest.fn(),
  deletePaymentMethod: jest.fn(),
};


beforeEach(() => {
  jest.clearAllMocks();

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockPaymentContext.cards,
  });

  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
    key === "authToken" ? Promise.resolve("dummyToken") : Promise.resolve(null)
  );

  jest
    .spyOn(require("../app/context/PaymentContext"), "usePayment")
    .mockImplementation(() => mockPaymentContext);
});

afterEach(cleanup);

// Helper function to render PaymentMethod
const renderPaymentMethod = () =>
  render(
    <PaymentProvider>
      <PaymentMethod />
    </PaymentProvider>
  );

describe("PaymentMethod Screen", () => {
  it("renders correctly with stored cards", async () => {
    const { getByText } = renderPaymentMethod();

    await waitFor(() => {
      expect(getByText("Payment method")).toBeTruthy();
      expect(getByText("John Doe")).toBeTruthy();
      expect(getByText("12/24")).toBeTruthy();
      expect(getByText(/1234/)).toBeTruthy();
      expect(getByText("Jane Doe")).toBeTruthy();
      expect(getByText("11/25")).toBeTruthy();
      expect(getByText(/5678/)).toBeTruthy();
    });
  });

  it("navigates back when back button is pressed", async () => {
    const { getByTestId } = renderPaymentMethod();
    await waitFor(() => expect(getByTestId("back-button")).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByTestId("back-button"));
    });

    expect(mockedRouter.navigate).toHaveBeenCalledWith("./Profile");
  });

  it("navigates to add payment screen when add button is pressed", async () => {
    const { getByTestId } = renderPaymentMethod();
    await waitFor(() => expect(getByTestId("add-payment-button")).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByTestId("add-payment-button"));
    });

    expect(mockedRouter.push).toHaveBeenCalledWith("/add-payment");
  });

  it("sets a card as default when default checkbox is pressed", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  
    const { getByTestId } = render(
      <PaymentProvider>
        <PaymentMethod />
      </PaymentProvider>
    );
  
    //Wait for the checkbox to be found in the UI
    await waitFor(() => expect(getByTestId("default-checkbox-2")).toBeTruthy());
    
    await act(async () => {
      fireEvent.press(getByTestId("default-checkbox-2"));
    });
    
    //Ensure `setDefaultPayment(2)` was called
    await waitFor(() => {
      expect(mockPaymentContext.setDefaultPayment).toHaveBeenCalledTimes(1);
      expect(mockPaymentContext.setDefaultPayment).toHaveBeenCalledWith(2);
    });
  });
  

  it("shows alert when delete button is pressed", async () => {
    jest.replaceProperty(Platform, "OS", "ios");

    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const yesButton = buttons?.find((button) => button.text === "Yes");
      if (yesButton && yesButton.onPress) {
        yesButton.onPress();
      }
    });

    const deletePaymentSpy = jest.spyOn(mockPaymentContext, "deletePaymentMethod");

    const { getByTestId } = renderPaymentMethod();
    await waitFor(() => expect(getByTestId("delete-button-2")).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByTestId("delete-button-2"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Delete Card",
      "Are you sure you want to delete this card?",
      expect.any(Array),
      { cancelable: true }
    );

    await waitFor(() => {
      expect(deletePaymentSpy).toHaveBeenCalledWith(2);
    });

    alertSpy.mockRestore();
    deletePaymentSpy.mockRestore();
  });

  it("only displays up to 10 cards", async () => {
    const manyCards = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      last4: `${1000 + i}`,
      cardholder_name: `User ${i}`,
      expiration_date: "10/26",
      card_type: "visa",
      is_default: false,
    }));

    jest
      .spyOn(require("../app/context/PaymentContext"), "usePayment")
      .mockReturnValue({
        ...mockPaymentContext,
        cards: manyCards,
      });

    const { getAllByTestId } = renderPaymentMethod();

    await waitFor(() => {
      expect(getAllByTestId(/default-checkbox-/).length).toBe(10);
    });
  });
});
