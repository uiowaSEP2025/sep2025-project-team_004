import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import PaymentMethod from "../app/payment-method";
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

// --- Mock Expo Router & useFocusEffect ---
const mockedRouter = { back: jest.fn(), push: jest.fn() };
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: () => mockedRouter,
    useFocusEffect: (cb: () => void) => React.useEffect(cb, []),
  };
});

// --- Mock AsyncStorage ---
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Sample cards
const baseCards = [
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
];

beforeEach(() => {
  jest.clearAllMocks();
  // by default, AsyncStorage.getItem returns a token
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dummyToken");
  // by default, fetch returns baseCards
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => baseCards,
  });
});

const renderScreen = () => render(<PaymentMethod />);

describe("PaymentMethod Screen", () => {
  describe("Card Rendering", () => {
    it("renders correctly with stored cards", async () => {
      const { getByText } = renderScreen();
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
      // make fetch return 15 cards
      const many = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        last4: `${1000 + i}`,
        cardholder_name: `User ${i + 1}`,
        exp_month: "10",
        exp_year: "26",
        brand: "visa",
        is_default: false,
      }));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => many,
      });

      const { getAllByTestId } = renderScreen();
      await waitFor(() => {
        const boxes = getAllByTestId(/default-checkbox-/);
        expect(boxes).toHaveLength(10);
      });
    });
  });

  describe("Navigation", () => {
    it("goes back when back button is pressed", async () => {
      const { getByTestId } = renderScreen();
      await waitFor(() => expect(getByTestId("back-button")).toBeTruthy());
      act(() => fireEvent.press(getByTestId("back-button")));
      expect(mockedRouter.back).toHaveBeenCalled();
    });

    it("navigates to add-payment when add button is pressed", async () => {
      const { getByTestId } = renderScreen();
      await waitFor(() => expect(getByTestId("add-payment-button")).toBeTruthy());
      act(() => fireEvent.press(getByTestId("add-payment-button")));
      expect(mockedRouter.push).toHaveBeenCalledWith("/add-payment");
    });
  });

  describe("Payment Method Actions", () => {
    it("sets default payment when default checkbox is pressed", async () => {
      // simulate three calls: load, set-default, reload
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken") // load
        .mockResolvedValueOnce("dummyToken"); // set-default

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => baseCards }) // load
        .mockResolvedValueOnce({ ok: true })                              // set-default
        .mockResolvedValueOnce({ ok: true, json: async () => baseCards }); // reload

      const { getByTestId } = renderScreen();
      await waitFor(() => expect(getByTestId("default-checkbox-1")).toBeTruthy());

      await act(async () => {
        fireEvent.press(getByTestId("default-checkbox-1"));
      });

      // now inspect the mock calls
      const calls = (global.fetch as jest.Mock).mock.calls.map(c => c[0]);
      expect(
        calls.some((url: string) => url.includes("/api/payment/stripe/set-default/1/"))
      ).toBe(true);
    });

    describe("Delete Payment Method", () => {
      it("shows alert and deletes card on mobile", async () => {
        Platform.OS = "android";
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_, __, btns) => {
          // simulate user pressing "Yes"
          btns?.find(b => b.text === "Yes")?.onPress?.();
        });

        global.fetch = jest
          .fn()
          .mockResolvedValueOnce({ ok: true, json: async () => baseCards }) // load
          .mockResolvedValueOnce({ ok: true })                               // delete
          .mockResolvedValueOnce({ ok: true, json: async () => baseCards }); // reload

        const { getByTestId } = renderScreen();
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

        const calls = (global.fetch as jest.Mock).mock.calls.map(c => c[0]);
        expect(calls.some((url: string) => url.includes("/api/payment/stripe/delete/2/"))).toBe(true);

        alertSpy.mockRestore();
      });

      it("deletes card directly on web", async () => {
        Platform.OS = "web";

        global.fetch = jest
          .fn()
          .mockResolvedValueOnce({ ok: true, json: async () => baseCards }) // load
          .mockResolvedValueOnce({ ok: true });                              // delete

        const { getByTestId } = renderScreen();
        await waitFor(() => expect(getByTestId("delete-button-1")).toBeTruthy());

        await act(async () => {
          fireEvent.press(getByTestId("delete-button-1"));
        });

        const calls = (global.fetch as jest.Mock).mock.calls.map(c => c[0]);
        expect(calls.some((url: string) => url.includes("/api/payment/stripe/delete/1/"))).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    it("silently returns if no auth token on loadCards", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      renderScreen();
      // flush promises
      await act(() => Promise.resolve());

      expect(consoleSpy).not.toHaveBeenCalledWith("User not authenticated.");
      consoleSpy.mockRestore();
    });

    it("logs on fetch error", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      global.fetch = jest.fn().mockRejectedValue(new Error("fail"));

      renderScreen();
      await act(() => Promise.resolve());

      expect(
        consoleSpy.mock.calls.some(call => call[0].includes("Error loading Stripe cards:"))
      ).toBe(true);
      consoleSpy.mockRestore();
    });

    it("silently returns if no auth token on delete", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("dummyToken")
        .mockResolvedValueOnce(null);

      Platform.OS = "web";
      const { getByTestId } = renderScreen();
      await waitFor(() => expect(getByTestId("delete-button-1")).toBeTruthy());

      await act(async () => {
        fireEvent.press(getByTestId("delete-button-1"));
      });

      expect(consoleSpy).not.toHaveBeenCalledWith("User not authenticated.");
      consoleSpy.mockRestore();
    });
  });
});
