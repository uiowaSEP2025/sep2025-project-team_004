// __tests__/checkout-test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import CheckoutScreen from "../app/checkout";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartContext } from "../app/context/CartContext";
import { useRouter } from "expo-router";

// 1. Stub expo-font so vector-icons think fonts are loaded
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: () => true,
  loadAsync: jest.fn(),
}));

// 2. Stub out vector‐icons without JSX
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    MaterialIcons: (props: any) =>
      React.createElement("Text", { testID: "material-icon" }),
  };
});

// 3. Stub toast
jest.mock("react-native-toast-message", () => ({ show: jest.fn() }));

// 4. Stub AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
}));

// 5. Stub router
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));

// 6. Stub GooglePlacesAutocomplete
jest.mock("react-native-google-places-autocomplete", () => {
  const React = require("react");
  const { TextInput } = require("react-native");
  return {
    GooglePlacesAutocomplete: React.forwardRef((props, ref) =>
      React.createElement(TextInput, {
        testID: "address-input",
        placeholder: props.placeholder,
        value: props.textInputProps?.value,
        onChangeText: props.textInputProps?.onChangeText,
      })
    ),
  };
});

describe("CheckoutScreen", () => {
  let mockPush: jest.Mock, mockBack: jest.Mock, clearCart: jest.Mock;
  const fakeCart = [
    { id: 1, price: 5, quantity: 2 },
    { id: 2, price: 10, quantity: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockPush = jest.fn();
    mockBack = jest.fn();
    clearCart = jest.fn();

    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });

    (AsyncStorage.getItem as jest.Mock).mockImplementation(key => {
      if (key === "authToken") return Promise.resolve("token");
      if (key === "userInfo")
        return Promise.resolve(
          JSON.stringify({
            address: "123 Main St",
            city: "TestCity",
            state: "TS",
            zip_code: "12345",
          })
        );
      return Promise.resolve(null);
    });

    // Three fetches: cards, validate, create
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "pm_1",
            brand: "visa",
            last4: "1111",
            is_default: true,
            cardholder_name: "A",
            exp_month: 12,
            exp_year: 2030,
          },
          {
            id: "pm_2",
            brand: "mastercard",
            last4: "2222",
            is_default: false,
            cardholder_name: "B",
            exp_month: 11,
            exp_year: 2029,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          standardized: {
            address: "123 Main St",
            city: "TestCity",
            state: "TS",
            zip_code: "12345",
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true });
  });

  function renderScreen() {
    return render(
      <CartContext.Provider value={{ cart: fakeCart, clearCart }}>
        <CheckoutScreen />
      </CartContext.Provider>
    );
  }

  it("renders fetched cards and auto-selects the default", async () => {
    const { findByText, queryAllByTestId } = renderScreen();
    expect(await findByText(/VISA ending in 1111/)).toBeTruthy();
    expect(await findByText(/MASTERCARD ending in 2222/)).toBeTruthy();
    // exactly one check icon
    expect(queryAllByTestId("material-icon").length).toBe(1);
  });

  it("pre-fills the shipping address input", async () => {
    const { findByTestId } = renderScreen();
    const input = await findByTestId("address-input");
    expect(input.props.placeholder).toBe("Enter your shipping address");
    expect(input.props.value).toContain("123 Main St");
  });

  it("enables the submit button once card & address are present", async () => {
    const { findByText } = renderScreen();
    const submit = await findByText("SUBMIT ORDER");
    await waitFor(() => expect(submit.props.disabled).toBe(false));
  });

  it("completes a successful checkout flow", async () => {
    const { findByText } = renderScreen();
    const submit = await findByText("SUBMIT ORDER");
    fireEvent.press(submit);
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith({ type: "success", text1: "Order placed!" })
    );
    expect(clearCart).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/store");
  });

  it("shows an error toast when address validation fails", async () => {
    // override second fetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "pm_1",
            brand: "visa",
            last4: "1111",
            is_default: true,
            cardholder_name: "A",
            exp_month: 12,
            exp_year: 2030,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ valid: false, message: "Bad Address" }),
      });

    const { findByText } = renderScreen();
    const submit = await findByText("SUBMIT ORDER");
    fireEvent.press(submit);
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith({
        type: "error",
        text1: "Invalid Address",
        text2: "Bad Address",
      })
    );
  });
});
