import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ForgotScreen from "../app/forgot";
import { useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message'

// Mock navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
}));


// Mock useToast from showMessage hook


describe("ForgotScreen", () => {
  it("renders the forgot password screen correctly", () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(<ForgotScreen />);

    expect(getByTestId("forgot-title")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByText("Reset Password")).toBeTruthy();
    expect(getByText("Back to Login")).toBeTruthy();
  });

  it("shows an error when email is empty", async () => {
    const { getByText, getByTestId } = render(<ForgotScreen />);
    const resetButton = getByText("Reset Password");

    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByTestId("error-message").children[0]).toBe("Email is required!");
    });
  });

  it("sends a reset email when a valid email is entered", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;

    const { getByPlaceholderText, getByText } = render(<ForgotScreen />);
    const emailInput = getByPlaceholderText("Email");
    const resetButton = getByText("Reset Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/auth/request-password-reset/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );
    });
  });
});
