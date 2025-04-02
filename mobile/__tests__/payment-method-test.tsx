import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react-native";
import PaymentMethod, { getCardLogo } from "../app/payment-method";
import { PaymentProvider } from "@/app/context/PaymentContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";

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

// Partial payment context with two cards.
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
};

beforeEach(() => {
  jest.clearAllMocks();

  // Global fetch returns the mock cards.
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockPaymentContext.cards,
  });

  // For most tests, AsyncStorage.getItem returns a dummy token.
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dummyToken");
});

afterEach(cleanup);

// Helper to render PaymentMethod wrapped with PaymentProvider.
const renderPaymentMethod = () =>
  render(
    <PaymentProvider>
      <PaymentMethod />
    </PaymentProvider>
  );

describe("PaymentMethod Screen", () => {
  describe("Card Rendering", () => {
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

    it("only displays up to 10 cards", async () => {
      const manyCards = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        last4: `${1000 + i}`,
        cardholder_name: `User ${i}`,
        expiration_date: "10/26",
        card_type: "visa",
        is_default: false,
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => manyCards,
      });

      const { getAllByTestId } = renderPaymentMethod();
      await waitFor(() => {
        expect(getAllByTestId(/default-checkbox-/).length).toBe(10);
      });
    });

    // Test getCardLogo in a way that handles either a string or an object.
    
  });

  describe("Navigation", () => {
    it("navigates back when back button is pressed", async () => {
      const { getByTestId } = renderPaymentMethod();
      await waitFor(() => expect(getByTestId("back-button")).toBeTruthy());
      await act(async () => {
        fireEvent.press(getByTestId("back-button"));
      });
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
  });

  describe("Payment Method Actions", () => {
    it("sets default payment when default checkbox is pressed", async () => {
      // For this test, let the initial load succeed and then simulate a failure for setDefaultPayment.
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken") // for initial loadCards call
        .mockResolvedValueOnce("dummyToken"); // for setDefaultPayment call

      global.fetch = jest
        .fn()
        // First call: loadCards GET
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPaymentContext.cards,
        })
        // Second call: setDefaultPayment POST (simulate failure)
        .mockResolvedValueOnce({
          ok: false,
        })
        // Third call: loadCards after error (optional)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPaymentContext.cards,
        });

      const { getByTestId } = renderPaymentMethod();
      await waitFor(() => expect(getByTestId("default-checkbox-1")).toBeTruthy());
      await act(async () => {
        fireEvent.press(getByTestId("default-checkbox-1"));
      });
      await waitFor(() => {
        // Check that the POST call was attempted.
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/payment/set-default/1/"),
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    describe("Delete Payment Method", () => {
      it("shows alert and deletes card when delete button is pressed (non-web)", async () => {
        jest.replaceProperty(Platform, "OS", "ios");
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(
          (title, message, buttons) => {
            const yesButton = buttons?.find((button) => button.text === "Yes");
            if (yesButton && yesButton.onPress) {
              yesButton.onPress();
            }
          }
        );
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
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/payment/delete/2/"),
            expect.objectContaining({ method: "DELETE" })
          );
        });
        alertSpy.mockRestore();
      });

      it("deletes card directly on web without showing alert", async () => {
        jest.replaceProperty(Platform, "OS", "web");
        const { getByTestId } = renderPaymentMethod();
        await waitFor(() => expect(getByTestId("delete-button-1")).toBeTruthy());
        await act(async () => {
          fireEvent.press(getByTestId("delete-button-1"));
        });
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/payment/delete/1/"),
            expect.objectContaining({ method: "DELETE" })
          );
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("logs an error when no auth token is found during loadCards", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // For loadCards, chain: first call returns dummyToken (so cards load) then subsequent call returns null.
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken")
        .mockResolvedValueOnce(null);
      renderPaymentMethod();
      await waitFor(() => {
        expect(
          consoleSpy.mock.calls.some((call) => call[0] === "User not authenticated.")
        ).toBe(true);
      });
      consoleSpy.mockRestore();
    });

    it("logs an error when fetch fails in loadCards", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });
      renderPaymentMethod();
      await waitFor(() => {
        expect(
          consoleSpy.mock.calls.some((call) =>
            call[0].includes("Error loading payment methods:")
          )
        ).toBe(true);
      });
      consoleSpy.mockRestore();
    });

    it("logs an error when no auth token is found in deletePaymentMethod", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // Chain AsyncStorage so that the initial load gets a token and the deletion call gets null.
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken") // loadCards call
        .mockResolvedValueOnce(null); // deletePaymentMethod call
      jest.replaceProperty(Platform, "OS", "web");

      const { getByTestId } = renderPaymentMethod();
      await waitFor(() => expect(getByTestId("delete-button-1")).toBeTruthy());
      await act(async () => {
        fireEvent.press(getByTestId("delete-button-1"));
      });
      await waitFor(() => {
        expect(
          consoleSpy.mock.calls.some(
            (call) => call[0] === "User not authenticated."
          )
        ).toBe(true);
      });
      consoleSpy.mockRestore();
    });

    it("logs an error when fetch fails in setDefaultPayment", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // Chain AsyncStorage: first call for loadCards, second for setDefaultPayment.
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken")
        .mockResolvedValueOnce("dummyToken");
      global.fetch = jest
        .fn()
        // First call: loadCards GET
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPaymentContext.cards,
        })
        // Second call: setDefaultPayment POST failure
        .mockResolvedValueOnce({
          ok: false,
        })
        // Third call: loadCards after error
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPaymentContext.cards,
        });
      const { getByTestId } = renderPaymentMethod();
      await waitFor(() => expect(getByTestId("default-checkbox-1")).toBeTruthy());
      await act(async () => {
        fireEvent.press(getByTestId("default-checkbox-1"));
      });
      await waitFor(() => {
        expect(
          consoleSpy.mock.calls.some((call) =>
            call[0].includes("Error setting default payment method:")
          )
        ).toBe(true);
      });
      consoleSpy.mockRestore();
    });
  });
});
