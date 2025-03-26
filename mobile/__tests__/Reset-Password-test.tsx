import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ResetPasswordScreen from "../app/ResetPasswordScreen";
import { useRouter } from "expo-router";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({
    email: "test@example.com",
    token: "valid-token",
  })),
}));

describe("ResetPasswordScreen", () => {
  it("renders reset password screen correctly", () => {
    const { getByTestId, getByPlaceholderText } = render(<ResetPasswordScreen />);

    expect(getByTestId("reset-button")).toBeTruthy(); // Title
    expect(getByPlaceholderText("New Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm New Password")).toBeTruthy();
  });

  it("shows an error when fields are empty", async () => {
    const { getByTestId } = render(<ResetPasswordScreen />);
    const resetButton = getByTestId("reset-button");

    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toBeTruthy();
      expect(getByTestId("error-message").children[0]).toBe("Please fill in all fields.");
    });
  });

  it("validates password complexity", async () => {
    const { getByPlaceholderText, getByTestId } = render(<ResetPasswordScreen />);
    const passwordInput = getByPlaceholderText("New Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm New Password");
    const resetButton = getByTestId("reset-button");

    fireEvent.changeText(passwordInput, "weak");
    fireEvent.changeText(confirmPasswordInput, "weak");
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toBeTruthy();
      expect(getByTestId("error-message").children[0]).toContain("Password must be at least 8 characters long.");
    });
  });

  it("submits a reset request successfully", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;

    const { getByPlaceholderText, getByTestId } = render(<ResetPasswordScreen />);
    const passwordInput = getByPlaceholderText("New Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm New Password");
    const resetButton = getByTestId("reset-button");

    fireEvent.changeText(passwordInput, "StrongPass1");
    fireEvent.changeText(confirmPasswordInput, "StrongPass1");
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/auth/reset-password/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", token: "valid-token", new_password: "StrongPass1" }),
        })
      );
    });
  });
});
