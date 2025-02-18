import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import ForgotScreen from "../app/(tabs)/forgot";

const mockedNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockedNavigate,
    }),
  };
});

const renderWithNavigation = () =>
  render(
    <NavigationContainer>
      <ForgotScreen />
    </NavigationContainer>
  );

describe("ForgotScreen", () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  it("renders correctly", () => {
    const { getByTestId, getByPlaceholderText } = renderWithNavigation();

    expect(getByTestId("forgot-title")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("New Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm New Password")).toBeTruthy();
  });

  it("updates email input", () => {
    const { getByPlaceholderText, getByDisplayValue } = renderWithNavigation();
    const emailInput = getByPlaceholderText("Email");

    fireEvent.changeText(emailInput, "test@example.com");
    expect(getByDisplayValue("test@example.com")).toBeTruthy();
  });

  it("updates new password input", () => {
    const { getByPlaceholderText, getByDisplayValue } = renderWithNavigation();
    const newPasswordInput = getByPlaceholderText("New Password");

    fireEvent.changeText(newPasswordInput, "password123");
    expect(getByDisplayValue("password123")).toBeTruthy();
  });

  it("updates confirm new password input", () => {
    const { getByPlaceholderText, getByDisplayValue } = renderWithNavigation();
    const confirmPasswordInput = getByPlaceholderText("Confirm New Password");

    fireEvent.changeText(confirmPasswordInput, "password123");
    expect(getByDisplayValue("password123")).toBeTruthy();
  });

  it("displays error when email is missing", async () => {
    const { getByPlaceholderText, getByText } = renderWithNavigation();
    const newPasswordInput = getByPlaceholderText("New Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm New Password");
    const resetButton = getByText("Reset Password");

    fireEvent.changeText(newPasswordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");

    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByText("Email is required!")).toBeTruthy();
    });
  });

  it("displays error when new password is missing", async () => {
    const { getByPlaceholderText, getByText } = renderWithNavigation();
    const emailInput = getByPlaceholderText("Email");
    const confirmPasswordInput = getByPlaceholderText("Confirm New Password");
    const resetButton = getByText("Reset Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(confirmPasswordInput, "password123");

    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByText("New password is required!")).toBeTruthy();
    });
  });

  it("displays error when confirm new password is missing", async () => {
    const { getByPlaceholderText, getByText } = renderWithNavigation();
    const emailInput = getByPlaceholderText("Email");
    const newPasswordInput = getByPlaceholderText("New Password");
    const resetButton = getByText("Reset Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(newPasswordInput, "password123");

    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByText("Please confirm your new password!")).toBeTruthy();
    });
  });

  it("displays error when passwords do not match", async () => {
    const { getByPlaceholderText, getByText } = renderWithNavigation();
    const emailInput = getByPlaceholderText("Email");
    const newPasswordInput = getByPlaceholderText("New Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm New Password");
    const resetButton = getByText("Reset Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(newPasswordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password321");

    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByText("Passwords do not match!")).toBeTruthy();
    });
  });

  it("does not display error when all inputs are valid", async () => {
    const { getByPlaceholderText, queryByText, getByText } = renderWithNavigation();
    const emailInput = getByPlaceholderText("Email");
    const newPasswordInput = getByPlaceholderText("New Password");
    const confirmPasswordInput = getByPlaceholderText("Confirm New Password");
    const resetButton = getByText("Reset Password");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(newPasswordInput, "password123");
    fireEvent.changeText(confirmPasswordInput, "password123");

    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(queryByText("Email is required!")).toBeNull();
      expect(queryByText("New password is required!")).toBeNull();
      expect(queryByText("Please confirm your new password!")).toBeNull();
      expect(queryByText("Passwords do not match!")).toBeNull();
    });
  });
});
