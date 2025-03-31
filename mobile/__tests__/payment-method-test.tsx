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

// --- Mock images to avoid require() errors ---
jest.mock("@/assets/images/back-arrow.png", () => "back-arrow.png");
jest.mock("@/assets/images/add-icon.png", () => "add-icon.png");
jest.mock("@/assets/images/delete.png", () => "delete.png");
jest.mock("@/assets/images/card-logo/visa.png", () => "visa.png");
jest.mock("@/assets/images/card-logo/mastercard.png", () => "mastercard.png");
jest.mock("@/assets/images/card-logo/amex.png", () => "amex.png");
jest.mock("@/assets/images/card-logo/discover.png", () => "discover.png");

// --- Mock Expo Router ---
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

// --- Mock AsyncStorage ---
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// --- Partial PaymentContext mock (for reference, not used by PaymentMethod) ---
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

  // Global fetch will resolve with the mock cards array
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockPaymentContext.cards,
  });

  // Simulate that AsyncStorage returns a dummy token
  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
    key === "authToken" ? Promise.resolve("dummyToken") : Promise.resolve(null)
  );
});

afterEach(cleanup);

// Helper function to render PaymentMethod wrapped with PaymentProvider
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

    // Since the component calls router.back(), we expect that instead
    expect(mockedRouter.back).toHaveBeenCalled();
  });

  it("navigates to add payment screen when add button is pressed", async () => {
    const { getByTestId } = renderPaymentMethod();
    await waitFor(() => expect(getByTestId("add-payment-button")).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByTestId("add-payment-button"));
    });

    expect(mockedRouter.push).toHaveBeenCalledWith("/add-payment");
  });

  


  it("shows alert when delete button is pressed", async () => {
    // Set platform to non-web so that Alert is used
    jest.replaceProperty(Platform, "OS", "ios");

    // Spy on Alert.alert and simulate pressing the "Yes" button
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const yesButton = buttons?.find((button) => button.text === "Yes");
      if (yesButton && yesButton.onPress) {
        yesButton.onPress();
      }
    });

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

    // Check that a DELETE request was made for card id 2
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/payment/delete/2/"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    alertSpy.mockRestore();
  });

  it("only displays up to 10 cards", async () => {
    // Create an array of 15 cards
    const manyCards = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      last4: `${1000 + i}`,
      cardholder_name: `User ${i}`,
      expiration_date: "10/26",
      card_type: "visa",
      is_default: false,
    }));

    // Override global.fetch to return manyCards instead of the default 2 cards
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => manyCards,
    });

    const { getAllByTestId } = renderPaymentMethod();

    await waitFor(() => {
      // Expect that only 10 default-checkbox elements are rendered
      expect(getAllByTestId(/default-checkbox-/).length).toBe(10);
    });
  });
});
