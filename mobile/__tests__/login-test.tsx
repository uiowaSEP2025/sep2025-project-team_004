
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../app/index";
// Create a mocked navigation function
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
      <HomeScreen />
    </NavigationContainer>
  );

describe("LoginScreen", () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  it("renders correctly", () => {
    const { getByTestId, getByPlaceholderText, getByText } = renderWithNavigation();

    // Use testIDs to uniquely target elements
    expect(getByTestId("login-title")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByTestId("login-button")).toBeTruthy();
    expect(getByText("Register")).toBeTruthy();
  });

  it("updates email and password inputs", () => {
    const { getByPlaceholderText, getByDisplayValue } = renderWithNavigation();
    const emailInput = getByPlaceholderText("Email");
    const passwordInput = getByPlaceholderText("Password");

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
});
