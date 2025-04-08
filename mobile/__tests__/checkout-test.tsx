import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import CheckoutScreen from "../app/checkout";
import { CartContext } from "../app/context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// Mocks
jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
    isLoaded: jest.fn().mockReturnValue(true),
    unloadAsync: jest.fn(),
  }));
  
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
}));
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

// Suppress Image require errors
jest.mock("@/assets/images/card-logo/amex.png", () => 1);
jest.mock("@/assets/images/card-logo/discover.png", () => 1);
jest.mock("@/assets/images/card-logo/mastercard.png", () => 1);
jest.mock("@/assets/images/card-logo/visa.png", () => 1);
jest.mock("@/assets/images/card-logo/default-card.png", () => 1);
it("renders checkout screen correctly", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mockToken");
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, card_type: "visa", last4: "1234", is_default: true }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          address: "123 St", city: "Iowa", state: "IA", zip_code: "52242"
        }),
      });
  
    const cart = [{ id: 1, price: 50, quantity: 2 }];
    const clearCart = jest.fn();
  
    const { getByText, getByPlaceholderText } = render(
      <CartContext.Provider value={{ cart, clearCart }}>
        <CheckoutScreen />
      </CartContext.Provider>
    );
  
    await waitFor(() => {
      expect(getByText("Checkout")).toBeTruthy();
      expect(getByText("VISA ending in 1234")).toBeTruthy();
      expect(getByPlaceholderText("Enter your address")).toBeTruthy();
    });
  });
  it("submits the order and clears cart", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("mockToken");
  
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 2, card_type: "mastercard", last4: "5678", is_default: true }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          address: "123 Lane", city: "Coralville", state: "IA", zip_code: "52241"
        }),
      })
      .mockResolvedValueOnce({ ok: true }); // Order submit
  
    const cart = [{ id: 2, name: "Sensor", price: 40, quantity: 1 }];
    const clearCart = jest.fn();
  
    const { getByText, getByPlaceholderText } = render(
      <CartContext.Provider value={{ cart, clearCart }}>
        <CheckoutScreen />
      </CartContext.Provider>
    );
  
    await waitFor(() => getByText("SUBMIT ORDER"));
  
    // Simulate filling the address input to ensure button is enabled
    fireEvent.changeText(getByPlaceholderText("Enter your address"), "123 Lane, Coralville, IA, 52241");
  
    fireEvent.press(getByText("SUBMIT ORDER"));
  
    await waitFor(() => {
      expect(clearCart).toHaveBeenCalled();
      expect(Toast.show).toHaveBeenCalledWith({
        type: "success",
        text1: "Order placed!",
      });
    });
  });
  