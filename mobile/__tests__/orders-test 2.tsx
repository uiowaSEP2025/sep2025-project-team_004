import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react-native";
import OrderHistoryScreen from "../app/orders";
import { ActivityIndicator, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

// --- Mock vector icons to avoid font loading errors ---
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MaterialIcons: (props) => <View {...props} />,
    Feather: (props) => <View {...props} />,
  };
});

// --- Mock useRouter from expo-router ---
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

const mockedRouter = {
  push: jest.fn(),
};
(useRouter as jest.Mock).mockReturnValue(mockedRouter);

describe("OrderHistoryScreen", () => {
  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("displays an ActivityIndicator when loading", async () => {
    // Simulate a pending fetch by never resolving the promise.
    global.fetch = jest.fn(() => new Promise(() => {}));
    const { getByTestId } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });
  });

  it("renders orders after fetching data", async () => {
    const fakeOrders = [
      { id: 1, name: "Product 1", description: "Desc 1", price: 10, orderDate: "2023-04-01" },
      { id: 2, name: "Product 2", description: "Desc 2", price: 20, orderDate: "2023-04-02" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeOrders,
    });
    const { getByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Order History")).toBeTruthy();
      expect(getByText("Product 1")).toBeTruthy();
      expect(getByText("Product 2")).toBeTruthy();
      expect(getByText("$10.00")).toBeTruthy();
      expect(getByText("Ordered on: 2023-04-01")).toBeTruthy();
    });
  });

  it("navigates to /orders when Return button is pressed", async () => {
    const fakeOrders = [
      { id: 1, name: "Product 1", description: "Desc", price: 10, orderDate: "2023-04-01" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeOrders,
    });
    const { getByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Product 1")).toBeTruthy();
    });
    const returnButton = getByText("Return");
    act(() => {
      fireEvent.press(returnButton);
    });
    expect(mockedRouter.push).toHaveBeenCalledWith("/orders");
  });

  it("opens the review modal when the Review button is pressed", async () => {
    const fakeOrders = [
      { id: 1, name: "Product 1", description: "Desc", price: 10, orderDate: "2023-04-01" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeOrders,
    });
    const { getByText, queryByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Product 1")).toBeTruthy();
    });
    const reviewButton = getByText("Review");
    act(() => {
      fireEvent.press(reviewButton);
    });
    // Instead of checking modal.props.visible, check that the modal's header is present.
    await waitFor(() => {
      expect(getByText("Review Product")).toBeTruthy();
    });
  });

  it("submits a valid review successfully", async () => {
    const fakeOrders = [
      { id: 1, name: "Product 1", description: "Desc", price: 10, orderDate: "2023-04-01" },
    ];
    // First fetch for orders, second for review submission.
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fakeOrders,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText, getByPlaceholderText, getByTestId } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Product 1")).toBeTruthy();
    });
    const reviewButton = getByText("Review");
    act(() => {
      fireEvent.press(reviewButton);
    });
    // Use the testID for the first star.
    const starOne = getByTestId("star-1");
    act(() => {
      fireEvent.press(starOne);
    });
    const reviewTextInput = getByPlaceholderText("Write your review (max 255 characters)");
    act(() => {
      fireEvent.changeText(reviewTextInput, "Great product!");
    });
    const submitButton = getByText("Submit Review");
    await act(async () => {
      fireEvent.press(submitButton);
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Success", "Your review has been submitted.");
      expect(mockedRouter.push).toHaveBeenCalledWith("/orders");
    });
    alertSpy.mockRestore();
  });

  it("shows an error alert if rating is invalid", async () => {
    const fakeOrders = [
      { id: 1, name: "Product 1", description: "Desc", price: 10, orderDate: "2023-04-01" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeOrders,
    });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Product 1")).toBeTruthy();
    });
    const reviewButton = getByText("Review");
    act(() => {
      fireEvent.press(reviewButton);
    });
    // Without setting a valid rating (rating remains 0), press Submit Review.
    const submitButton = getByText("Submit Review");
    await act(async () => {
      fireEvent.press(submitButton);
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Please select a rating between 1 and 5.");
    });
    alertSpy.mockRestore();
  });

  it("closes the review modal when Cancel is pressed", async () => {
    const fakeOrders = [
      { id: 1, name: "Product 1", description: "Desc", price: 10, orderDate: "2023-04-01" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeOrders,
    });
    const { getByText, queryByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Product 1")).toBeTruthy();
    });
    const reviewButton = getByText("Review");
    act(() => {
      fireEvent.press(reviewButton);
    });
    // Check that the modal header is visible.
    await waitFor(() => {
      expect(getByText("Review Product")).toBeTruthy();
    });
    const cancelButton = getByText("Cancel");
    act(() => {
      fireEvent.press(cancelButton);
    });
    // Now, "Review Product" should no longer be present.
    await waitFor(() => {
      expect(queryByText("Review Product")).toBeNull();
    });
  });

  it("filters orders based on search query", async () => {
    const fakeOrders = [
      { id: 1, name: "Alpha", description: "Desc", price: 10, orderDate: "2023-04-01" },
      { id: 2, name: "Beta", description: "Desc", price: 20, orderDate: "2023-04-02" },
      { id: 3, name: "Gamma", description: "Desc", price: 30, orderDate: "2023-04-03" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeOrders,
    });
    const { getByTestId, queryByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(queryByText("Alpha")).toBeTruthy();
      expect(queryByText("Beta")).toBeTruthy();
      expect(queryByText("Gamma")).toBeTruthy();
    });
    const searchInput = getByTestId("search-input");
    act(() => {
      fireEvent.changeText(searchInput, "alpha");
    });
    await waitFor(() => {
      expect(queryByText("Alpha")).toBeTruthy();
      expect(queryByText("Beta")).toBeNull();
      expect(queryByText("Gamma")).toBeNull();
    });
  });

  it("displays fallback image when order image is missing", async () => {
    const fakeOrders = [
      { id: 1, name: "Product 1", description: "Desc", price: 10, orderDate: "2023-04-01", image: "" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeOrders,
    });
    const { getByTestId } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      const image = getByTestId("order-image-1");
      expect(image.props.source.uri).toEqual("https://via.placeholder.com/150");
    });
  });
});
