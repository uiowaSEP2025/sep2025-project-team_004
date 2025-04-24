import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react-native";
import PaymentMethod from "../app/payment-method";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

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

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => mockedRouter,
    useFocusEffect: (callback: () => void) => {
      // Call the callback once on mount.
      React.useEffect(() => {
        callback();
      }, []);
    },
  };
});

// --- Mock AsyncStorage ---
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// --- Mock expo-secure-store ---
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// Partial payment data with two cards.
const mockPaymentContext = {
  cards: [
    {
      id: 1,
      last4: "1234",
      cardholder_name: "John Doe",
      exp_month: "12",
      exp_year: "24",
      brand: "visa",
      is_default: false,
    },
    {
      id: 2,
      last4: "5678",
      cardholder_name: "Jane Doe",
      exp_month: "11",
      exp_year: "25",
      brand: "mastercard",
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
  // By default, AsyncStorage.getItem returns a dummy token.
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dummyToken");
  // By default, SecureStore returns our stored cards.
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
    JSON.stringify(mockPaymentContext.cards)
  );
});

afterEach(cleanup);

// Helper: render PaymentMethod (no extra act wrapper on render)
const renderPaymentMethod = () => render(<PaymentMethod />);

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
        exp_month: "10",
        exp_year: "26",
        brand: "visa",
        is_default: false,
      }));
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(manyCards)
      );
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => manyCards,
      });
      const { getAllByTestId } = renderPaymentMethod();
      await waitFor(() => {
        const checkboxes = getAllByTestId(/default-checkbox-/);
        expect(checkboxes.length).toBe(10);
      });
    });
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
      // Force AsyncStorage.getItem to return a token for both calls.
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken") // for loadCards
        .mockResolvedValueOnce("dummyToken"); // for setDefaultPayment

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
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/payment/stripe/set-default/1/"),
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    describe("Delete Payment Method", () => {
      it("shows alert and deletes card when delete button is pressed (non-web)", async () => {
        Platform.OS = "ios";
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
            expect.stringContaining("/api/payment/stripe/delete/2/"),
            expect.objectContaining({ method: "DELETE" })
          );
        });
        alertSpy.mockRestore();
      });

      it("deletes card directly on web without showing alert", async () => {
        Platform.OS = "web";
        const { getByTestId } = renderPaymentMethod();
        await waitFor(() => expect(getByTestId("delete-button-1")).toBeTruthy());
        await act(async () => {
          fireEvent.press(getByTestId("delete-button-1"));
        });
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/payment/stripe/delete/1/"),
            expect.objectContaining({ method: "DELETE" })
          );
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("logs an error when no auth token is found during loadCards", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // Simulate missing token by having getItem return null.
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      renderPaymentMethod();
      // Flush pending microtasks.
      await act(async () => {
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(
          consoleSpy.mock.calls.some((call) => call[0] === "Error loading Stripe cards:" && call[1] instanceof Error)
        ).toBe(true);
      });
      consoleSpy.mockRestore();
    });

    it("logs an error when fetch fails in loadCards", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // Simulate fetch rejection.
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      renderPaymentMethod();
      // Flush pending microtasks.
      await act(async () => {
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(
          consoleSpy.mock.calls.some((call) =>
            call[0].includes("Error loading Stripe cards:")
          )
        ).toBe(true);
      });
      consoleSpy.mockRestore();
    });

    it("logs an error when no auth token is found in deletePaymentMethod", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // First getItem call should succeed for loadCards, second should fail for delete.
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken")
        .mockResolvedValueOnce(null);
      const { getByTestId } = renderPaymentMethod();
      await waitFor(() => expect(getByTestId("delete-button-1")).toBeTruthy());
      await act(async () => {
        fireEvent.press(getByTestId("delete-button-1"));
      });
      await waitFor(() => {
        expect(
          consoleSpy.mock.calls.some((call) => /Error (during|in) delete payment/i.test(call[0]))
        ).toBe(true);
      });
      consoleSpy.mockRestore();
    });
  });
});
