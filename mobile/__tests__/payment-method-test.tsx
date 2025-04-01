import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react-native";
import PaymentMethod from "../app/payment-method";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Alert, Platform } from "react-native";


// Mock static assets
jest.mock("@/assets/images/back-arrow.png", () => "back-arrow.png");
jest.mock("@/assets/images/add-icon.png", () => "add-icon.png");
jest.mock("@/assets/images/delete.png", () => "delete.png");
jest.mock("@/assets/images/card-logo/visa.png", () => "visa.png");
jest.mock("@/assets/images/card-logo/mastercard.png", () => "mastercard.png");
jest.mock("@/assets/images/card-logo/amex.png", () => "amex.png");
jest.mock("@/assets/images/card-logo/discover.png", () => "discover.png");

// Router mock
const mockedRouter = {
  back: jest.fn(),
  push: jest.fn(),
};
jest.mock("expo-router", () => ({
  useRouter: () => mockedRouter,
  useFocusEffect: (cb: () => void) => cb(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockCards = [
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
];

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue("dummyToken");
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockCards));
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockCards,
  });
});

afterEach(cleanup);

describe("PaymentMethod Screen", () => {
  it("renders correctly with stored cards", async () => {
    const { getByText } = render(<PaymentMethod />);

    await waitFor(() => {
      expect(getByText("Payment method")).toBeTruthy();
      expect(getByText("John Doe")).toBeTruthy();
      expect(getByText("Jane Doe")).toBeTruthy();
    });
  });

  it("navigates back when back button is pressed", async () => {
    const { getByTestId } = render(<PaymentMethod />);
    fireEvent.press(getByTestId("back-button"));
    expect(mockedRouter.back).toHaveBeenCalled();
  });

  it("navigates to add payment screen when add button is pressed", async () => {
    const { getByTestId } = render(<PaymentMethod />);
    fireEvent.press(getByTestId("add-payment-button"));
    expect(mockedRouter.push).toHaveBeenCalledWith("/add-payment");
  });

  it("shows alert when delete button is pressed", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_, __, buttons) => {
      const yes = buttons?.find((b) => b.text === "Yes");
      yes?.onPress?.();
    });

    const { getByTestId } = render(<PaymentMethod />);
    await waitFor(() => fireEvent.press(getByTestId("delete-button-2")));

    expect(alertSpy).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/payment/delete/2/"),
      expect.objectContaining({ method: "DELETE" })
    );

    alertSpy.mockRestore();
  });

  it("only displays up to 10 cards", async () => {
    const manyCards = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      last4: `00${i + 1}`.slice(-4),
      cardholder_name: `User ${i + 1}`,
      expiration_date: "12/24",
      card_type: "visa",
      is_default: false,
    }));
  
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(() =>
      Promise.resolve(JSON.stringify(manyCards))
    );
  
    const { getAllByTestId } = render(<PaymentMethod />);
  
    await waitFor(() => {
      const checkboxes = getAllByTestId(/default-checkbox-/);
      console.log("Found checkboxes:", checkboxes.length);
      expect(checkboxes.length).toBe(10);
    });
  });
});
  
