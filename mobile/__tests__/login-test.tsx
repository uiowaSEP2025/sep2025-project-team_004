// __tests__/login-test.tsx


import AsyncStorage from '@react-native-async-storage/async-storage';
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../app/index";

// Create mocked navigation functions
const mockedNavigate = jest.fn();
const mockedReset = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockedNavigate,
      reset: mockedReset,
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const renderWithNavigation = () =>
  render(
    <NavigationContainer>
      <HomeScreen />
    </NavigationContainer>
  );

describe("HomeScreen", () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
    mockedReset.mockClear();
  });

  it("renders correctly", () => {
    const { getByTestId, getByPlaceholderText, getByText } = renderWithNavigation();

    expect(getByTestId("login-title")).toBeTruthy();
    expect(getByTestId("email-input")).toBeTruthy();
    expect(getByTestId("password-input")).toBeTruthy();
    expect(getByTestId("login-button")).toBeTruthy();
    expect(getByText("SIGN UP")).toBeTruthy();
  });

  it("updates email and password inputs", () => {
    const { getByTestId, getByPlaceholderText, getByDisplayValue } = renderWithNavigation();
    const emailInput = getByTestId("email-input");
    const passwordInput = getByTestId("password-input");

    fireEvent.changeText(emailInput, "test@example.com");
    fireEvent.changeText(passwordInput, "password123");

    expect(getByDisplayValue("test@example.com")).toBeTruthy();
    expect(getByDisplayValue("password123")).toBeTruthy();
  });

  it("shows error when login is pressed with empty fields", async () => {
    const { getByTestId, queryByText } = renderWithNavigation();
    const loginButton = getByTestId("login-button");

    await act(async () => {
      fireEvent.press(loginButton);
    });

    await waitFor(() => {
      expect(queryByText("Both fields are required!")).toBeTruthy();
    });
  });

  it("navigates when register button is pressed", () => {
    const { getByTestId } = renderWithNavigation();
    const registerButton = getByTestId("register-button");
    fireEvent.press(registerButton);
    expect(mockedNavigate).toHaveBeenCalledWith("register");
  });

  // ---- New tests to cover login logic ----

  it("logs in successfully with valid credentials", async () => {
    // Mock fetch calls:
    // First call: login API returns a token.
    // Second call: user API returns user info.
    (global.fetch as jest.Mock) = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "dummy-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "John Doe" }),
      });

    const { getByPlaceholderText, getByTestId } = renderWithNavigation();
    fireEvent.changeText(getByTestId("email-input"), "test@example.com");
    fireEvent.changeText(getByTestId("password-input"), "password123");

    await act(async () => {
      fireEvent.press(getByTestId("login-button"));
    });

    // Check that AsyncStorage.setItem was called with the correct values.
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("authToken", "dummy-token");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "userInfo",
      JSON.stringify({ id: 1, name: "John Doe" })
    );

    // Check that navigation.reset is called to navigate to the tabs/home screen.
    expect(mockedReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "(tabs)", params: { screen: "home" } }],
    });
  });

  it("shows error when login API returns invalid credentials", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });

    const { getByPlaceholderText, getByTestId, queryByText } = renderWithNavigation();
    fireEvent.changeText(getByTestId("email-input"), "wrong@example.com");
    fireEvent.changeText(getByTestId("password-input"), "wrongpassword");

    await act(async () => {
      fireEvent.press(getByTestId("login-button"));
    });

    await waitFor(() => {
      expect(queryByText("Invalid credentials. Please try again.")).toBeTruthy();
    });
  });

  it("shows error when an exception occurs during login", async () => {
    (global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error("Network error"));

    const { getByPlaceholderText, getByTestId, queryByText } = renderWithNavigation();
    fireEvent.changeText(getByTestId("email-input"), "error@example.com");
    fireEvent.changeText(getByTestId("password-input"), "password123");

    await act(async () => {
      fireEvent.press(getByTestId("login-button"));
    });

    await waitFor(() => {
      expect(queryByText("Something went wrong. Please try again later.")).toBeTruthy();
    });
  });
});
