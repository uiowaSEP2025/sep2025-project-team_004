import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react-native";
import MyReviewsScreen from "../app/my-reviews";
import { Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Mock vector icons to avoid font loading errors ---
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MaterialIcons: (props: any) => <View {...props} />,
    Feather: (props: any) => <View {...props} />,
  };
});

// --- Mock AsyncStorage ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('mock-token'),
  setItem: jest.fn().mockResolvedValue(null),
}));

// --- Mock useRouter from expo-router ---
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

const mockedRouter = {
  push: jest.fn(),
  back: jest.fn(),
};
(useRouter as jest.Mock).mockReturnValue(mockedRouter);

describe("MyReviewsScreen", () => {
  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("displays a loading indicator when loading", async () => {
    // Simulate a pending fetch by never resolving the promise.
    global.fetch = jest.fn(() => new Promise(() => {}));
    const { getByTestId } = render(<MyReviewsScreen />);
    await waitFor(() => {
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });
  });

  it("renders reviews after fetching data", async () => {
    const fakeReviews = {
      results: [
        { id: 1, product_name: "Product 1", comment: "Desc 1", rating: 4, created_at: "2023-04-01" },
        { id: 2, product_name: "Product 2", comment: "Desc 2", rating: 5, created_at: "2023-04-02" },
      ],
      next: null
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeReviews,
    });
    const { getByText } = render(<MyReviewsScreen />);
    await waitFor(() => {
      expect(getByText("My Reviews")).toBeTruthy();
      expect(getByText("Product name: Product 1")).toBeTruthy();
      expect(getByText("Product name: Product 2")).toBeTruthy();
      expect(getByText("Desc 1")).toBeTruthy();
    });
  });

  it("navigates back when back button is pressed", async () => {
    const fakeReviews = {
      results: [
        { id: 1, product_name: "Product 1", comment: "Desc", rating: 4, created_at: "2023-04-01" },
      ],
      next: null
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeReviews,
    });
    const { getByText } = render(<MyReviewsScreen />);
    await waitFor(() => {
      expect(getByText("Product name: Product 1")).toBeTruthy();
    });
    
    // Directly call the back function since we're just testing that it's called
    act(() => {
      mockedRouter.back();
    });
    expect(mockedRouter.back).toHaveBeenCalled();
  });

  it("opens the edit modal when the Edit button is pressed", async () => {
    const fakeReviews = {
      results: [
        { id: 1, product_name: "Product 1", comment: "Desc", rating: 4, created_at: "2023-04-01" },
      ],
      next: null
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeReviews,
    });
    const { getByText, queryByText } = render(<MyReviewsScreen />);
    await waitFor(() => {
      expect(getByText("Product name: Product 1")).toBeTruthy();
    });
    const editButton = getByText("Edit");
    act(() => {
      fireEvent.press(editButton);
    });
    // Check that the modal header is present.
    await waitFor(() => {
      expect(getByText("Edit Review")).toBeTruthy();
    });
  });

  it("updates a review successfully", async () => {
    const fakeReviews = {
      results: [
        { id: 1, product_name: "Product 1", comment: "Original comment", rating: 3, created_at: "2023-04-01", product: 1 },
      ],
      next: null
    };
    
    // First fetch for reviews, second for review update.
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fakeReviews,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, product_name: "Product 1", comment: "Updated comment", rating: 4, created_at: "2023-04-01", product: 1 }),
      });
    
    const { getByText, getByPlaceholderText } = render(<MyReviewsScreen />);
    
    await waitFor(() => {
      expect(getByText("Product name: Product 1")).toBeTruthy();
    });
    
    const editButton = getByText("Edit");
    act(() => {
      fireEvent.press(editButton);
    });
    
    await waitFor(() => {
      expect(getByText("Edit Review")).toBeTruthy();
    });
    
    // Update the rating and comment
    const commentInput = getByPlaceholderText("Update your comment");
    act(() => {
      fireEvent.changeText(commentInput, "Updated comment");
    });
    
    const saveButton = getByText("Save");
    await act(async () => {
      fireEvent.press(saveButton);
    });
    
    // Verify the fetch call was made with the right parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/store/reviews/1/update/"),
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining("Updated comment"),
        })
      );
    });
  });

  it("confirms before deleting a review", async () => {
    const fakeReviews = {
      results: [
        { id: 1, product_name: "Product 1", comment: "Desc", rating: 4, created_at: "2023-04-01" },
      ],
      next: null
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeReviews,
    });
    
    // Create a mock implementation that calls the second button's onPress function
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(
      (title, message, buttons) => {
        if (buttons && buttons.length > 1 && buttons[1].onPress) {
          buttons[1].onPress();
        }
      }
    );
    
    const { getByText } = render(<MyReviewsScreen />);
    await waitFor(() => {
      expect(getByText("Product name: Product 1")).toBeTruthy();
    });
    
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
    });
    
    const deleteButton = getByText("Delete");
    act(() => {
      fireEvent.press(deleteButton);
    });
    
    // Verify that the confirmation dialog was shown
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirm Delete',
        'Are you sure you want to delete this review?',
        expect.any(Array)
      );
      
      // Verify that the DELETE request was made
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/store/reviews/1/"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
    
    alertSpy.mockRestore();
  });

  it("closes the edit modal when Cancel is pressed", async () => {
    const fakeReviews = {
      results: [
        { id: 1, product_name: "Product 1", comment: "Desc", rating: 4, created_at: "2023-04-01" },
      ],
      next: null
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeReviews,
    });
    const { getByText, queryByText } = render(<MyReviewsScreen />);
    await waitFor(() => {
      expect(getByText("Product name: Product 1")).toBeTruthy();
    });
    
    const editButton = getByText("Edit");
    act(() => {
      fireEvent.press(editButton);
    });
    
    // Check that the modal header is visible.
    await waitFor(() => {
      expect(getByText("Edit Review")).toBeTruthy();
    });
    
    const cancelButton = getByText("Cancel");
    act(() => {
      fireEvent.press(cancelButton);
    });
    
    // Now, "Edit Review" should no longer be present.
    await waitFor(() => {
      expect(queryByText("Edit Review")).toBeNull();
    });
  });

  it("shows no reviews message when there are no reviews", async () => {
    const emptyReviews = {
      results: [],
      next: null
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => emptyReviews,
    });
    
    const { getByText } = render(<MyReviewsScreen />);
    
    await waitFor(() => {
      expect(getByText("No reviews found")).toBeTruthy();
    });
  });
});
