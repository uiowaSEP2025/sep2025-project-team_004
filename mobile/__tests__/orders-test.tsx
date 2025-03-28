// __tests__/orderHistoryScreen.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import OrderHistoryScreen from "../app/orders"; // adjust path as needed
import { Alert, Platform } from "react-native";

// Set a dummy backend URL for testing.
process.env.EXPO_PUBLIC_BACKEND_URL = "http://dummy-backend.com";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    MaterialIcons: (props: any) => <Text {...props}>{props.name}</Text>,
  };
});

// Mock navigation using useNavigation.
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  // Provide a dummy useFocusEffect that simply invokes the callback.
  useFocusEffect: (callback: () => void) => callback(),
}));

describe("OrderHistoryScreen", () => {
  // Dummy orders used in tests.
  const dummyOrders = [
    {
      id: 1,
      name: "Test Order",
      description: "Test description",
      price: 10.99,
      image: "http://example.com/test.png",
      orderDate: "2020-01-01",
    },
    {
      id: 2,
      name: "Second Order",
      description: "Another test",
      price: 20,
      orderDate: "2020-02-01",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "web";
  });

  afterEach(() => {
    global.fetch.mockRestore?.();
  });

  test("renders ActivityIndicator while loading", async () => {
    // Simulate a fetch that never resolves.
    global.fetch = jest.fn(() => new Promise(() => {}));
    const { queryByText } = render(<OrderHistoryScreen />);
    // While loading, header text shouldn't be rendered.
    expect(queryByText("Order History")).toBeNull();
  });

  test("renders list of orders after successful fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(dummyOrders),
    });
    const { getByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Order History")).toBeTruthy();
      expect(getByText("Test Order")).toBeTruthy();
      expect(getByText("Ordered on: 2020-01-01")).toBeTruthy();
      expect(getByText("Second Order")).toBeTruthy();
    });
  });

  test("handles error during orders fetch and stops loading", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error("Fetch failed"));
    const { queryByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      // Header should render even if fetch fails.
      expect(queryByText("Order History")).toBeTruthy();
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching products:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  test('handleReturn navigates to "orders"', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(dummyOrders),
    });
    const { getAllByText } = render(<OrderHistoryScreen />);
    // Wait for orders to render.
    await waitFor(() => {
      expect(getAllByText("Return")[0]).toBeTruthy();
    });
    const returnButton = getAllByText("Return")[0];
    fireEvent.press(returnButton);
    expect(mockNavigate).toHaveBeenCalledWith("orders");
  });

  test("handleReview opens the review modal", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(dummyOrders),
    });
    const { getAllByText, getByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Order History")).toBeTruthy();
    });
    const reviewButton = getAllByText("Review")[0];
    fireEvent.press(reviewButton);
    await waitFor(() => {
      expect(getByText("Review Product")).toBeTruthy();
    });
  });

  test("submitting review with invalid rating shows alert", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(dummyOrders),
    });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getAllByText, getByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Order History")).toBeTruthy();
    });
    const reviewButton = getAllByText("Review")[0];
    fireEvent.press(reviewButton);
    await waitFor(() => {
      expect(getByText("Review Product")).toBeTruthy();
    });
    // Without setting any rating (remains 0), press "Submit Review".
    const submitButton = getByText("Submit Review");
    fireEvent.press(submitButton);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Please select a rating between 1 and 5.");
    });
    alertSpy.mockRestore();
  });

  test("submits review successfully", async () => {
    // First fetch loads orders; second fetch submits review.
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve(dummyOrders),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getAllByText, getByText, getByPlaceholderText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Order History")).toBeTruthy();
    });
    // Open review modal.
    const reviewButton = getAllByText("Review")[0];
    fireEvent.press(reviewButton);
    await waitFor(() => {
      expect(getByText("Review Product")).toBeTruthy();
    });
 
    const starIcons = getAllByText("star-border");
    expect(starIcons.length).toBe(5);
    // Press the third star (index 2) to set rating to 3.
    fireEvent.press(starIcons[2]);
    // After re-render, the first three stars should now display "star".
    await waitFor(() => {
      const filledStars = getAllByText("star");
      expect(filledStars.length).toBe(3);
    });
    // Enter review text.
    const textInput = getByPlaceholderText("Write your review (max 255 characters)");
    fireEvent.changeText(textInput, "Great product!");
    // Submit review.
    const submitReviewButton = getByText("Submit Review");
    fireEvent.press(submitReviewButton);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Success", "Your review has been submitted.");
      expect(mockNavigate).toHaveBeenCalledWith("orders");
    });
    alertSpy.mockRestore();
  });

  test("handles failed review submission with non-ok response", async () => {
    // First fetch returns orders; second returns non-ok response.
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve(dummyOrders),
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: "Bad Request" }),
      });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getAllByText, getByText, getByPlaceholderText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Order History")).toBeTruthy();
    });
    const reviewButton = getAllByText("Review")[0];
    fireEvent.press(reviewButton);
    await waitFor(() => {
      expect(getByText("Review Product")).toBeTruthy();
    });
    const starIcons = getAllByText("star-border");
    expect(starIcons.length).toBe(5);
    fireEvent.press(starIcons[3]); // sets rating to 4
    const textInput = getByPlaceholderText("Write your review (max 255 characters)");
    fireEvent.changeText(textInput, "Not good");
    const submitButton = getByText("Submit Review");
    fireEvent.press(submitButton);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to submit review. Please try again later.");
    });
    alertSpy.mockRestore();
  });

  test("handles exception during review submission", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve(dummyOrders),
      })
      .mockRejectedValueOnce(new Error("Network error"));
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getAllByText, getByText, getByPlaceholderText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(getByText("Order History")).toBeTruthy();
    });
    const reviewButton = getAllByText("Review")[0];
    fireEvent.press(reviewButton);
    await waitFor(() => {
      expect(getByText("Review Product")).toBeTruthy();
    });
    const starIcons = getAllByText("star-border");
    expect(starIcons.length).toBe(5);
    fireEvent.press(starIcons[4]); // sets rating to 5
    const textInput = getByPlaceholderText("Write your review (max 255 characters)");
    fireEvent.changeText(textInput, "Excellent!");
    const submitButton = getByText("Submit Review");
    fireEvent.press(submitButton);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "An error occurred while submitting your review.");
    });
    alertSpy.mockRestore();
  });

  test("cancel button in review modal dismisses the modal", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(dummyOrders),
    });
    const { getAllByText, queryByText } = render(<OrderHistoryScreen />);
    await waitFor(() => {
      expect(queryByText("Order History")).toBeTruthy();
    });
    const reviewButton = getAllByText("Review")[0];
    fireEvent.press(reviewButton);
    await waitFor(() => {
      expect(queryByText("Review Product")).toBeTruthy();
    });
    // Press the Cancel button inside the modal.
    const cancelButton = getAllByText("Cancel")[0];
    fireEvent.press(cancelButton);
    await waitFor(() => {
      expect(queryByText("Review Product")).toBeNull();
    });
  });
});
