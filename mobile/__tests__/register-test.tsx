import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import RegisterScreen from "../app/register";
import fetchMock from "jest-fetch-mock";

fetchMock.enableMocks(); // Enable jest-fetch-mock globally

// Create mocked goBack and navigate functions
const mockedGoBack = jest.fn();
const mockedNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockedNavigate, // Mock navigate
      goBack: mockedGoBack,     // Mock goBack
    }),
  };
});

// Utility to render component with Navigation Container
const renderWithNavigation = () =>
  render(
    <NavigationContainer>
      <RegisterScreen />
    </NavigationContainer>
  );

describe("RegisterScreen", () => {
  beforeEach(() => {
    fetchMock.resetMocks(); // Reset fetch mocks before each test
    mockedGoBack.mockClear();
    mockedNavigate.mockClear();
  });

  it("renders correctly", () => {
    const { getByTestId, getByPlaceholderText, getAllByText, getByText } = renderWithNavigation();

    expect(getByTestId("register-title")).toBeTruthy();
    expect(getByText("WELCOME!")).toBeTruthy();

    expect(getByPlaceholderText("First Name")).toBeTruthy();
    expect(getByPlaceholderText("Last Name")).toBeTruthy();
    expect(getByPlaceholderText("Username")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm Password")).toBeTruthy();

    const registerElements = getAllByText("SIGN UP");
    expect(registerElements.length).toBeGreaterThan(0);
    expect(registerElements[0]).toBeTruthy();
    expect(getByText("Already have account? SIGN IN")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const { getAllByText, queryByText } = renderWithNavigation();

    const registerButtons = getAllByText("SIGN UP");
    const registerButton = registerButtons[0];
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(queryByText("Please fill out all fields.")).toBeTruthy();
    });
  });

  it("shows error when passwords do not match", async () => {
    const { getByPlaceholderText, getAllByText, queryByText } = renderWithNavigation();

    fireEvent.changeText(getByPlaceholderText("First Name"), "Alice");
    fireEvent.changeText(getByPlaceholderText("Last Name"), "Smith");
    fireEvent.changeText(getByPlaceholderText("Username"), "alice123");
    fireEvent.changeText(getByPlaceholderText("Email"), "alice@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "differentPassword");

    const registerButtons = getAllByText("SIGN UP");
    const registerButton = registerButtons[0];
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(queryByText("Passwords do not match.")).toBeTruthy();
    });
  });

  it("navigates back when registration is successful", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: "Account created successfully!" }),
      { status: 201 }
    );

    const { getByPlaceholderText, getAllByText, queryByText } = renderWithNavigation();

    fireEvent.changeText(getByPlaceholderText("First Name"), "Bob");
    fireEvent.changeText(getByPlaceholderText("Last Name"), "Jones");
    fireEvent.changeText(getByPlaceholderText("Username"), "bob123");
    fireEvent.changeText(getByPlaceholderText("Email"), "bob@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "password123");

    const registerButtons = getAllByText("SIGN UP");
    const registerButton = registerButtons[0];
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(queryByText("Please fill out all fields.")).toBeNull();
      expect(queryByText("Passwords do not match.")).toBeNull();
      expect(mockedNavigate).toHaveBeenCalledWith("index");
    });
  });

  it("shows error message when registration fails", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ errors: { email: ["Email already exists."] } }),
      { status: 400 }
    );

    const { getByPlaceholderText, getAllByText, queryByText } = renderWithNavigation();

    fireEvent.changeText(getByPlaceholderText("First Name"), "Bob");
    fireEvent.changeText(getByPlaceholderText("Last Name"), "Jones");
    fireEvent.changeText(getByPlaceholderText("Username"), "bob123");
    fireEvent.changeText(getByPlaceholderText("Email"), "existing@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "password123");

    const registerButtons = getAllByText("SIGN UP");
    const registerButton = registerButtons[0];
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(queryByText("Email already exists.")).toBeTruthy();
    });
  });

  it('navigates back when "Back to Login" button is pressed', () => {
    const { getByText } = renderWithNavigation();
    const backButton = getByText("Already have account? SIGN IN");
    fireEvent.press(backButton);
    expect(mockedGoBack).toHaveBeenCalled();
  });
});
