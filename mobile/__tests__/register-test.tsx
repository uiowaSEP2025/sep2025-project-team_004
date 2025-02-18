import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import RegisterScreen from "../app/register"; 

// Create a mocked goBack function
const mockedGoBack = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: mockedGoBack,
    }),
  };
});

const renderWithNavigation = () =>
  render(
    <NavigationContainer>
      <RegisterScreen />
    </NavigationContainer>
  );

describe("RegisterScreen", () => {
  beforeEach(() => {
    mockedGoBack.mockClear();
  });

  it("renders correctly", () => {
    const { getByTestId, getByPlaceholderText, getAllByText, getByText } = renderWithNavigation();

    // Check title and input fields
    expect(getByTestId("register-title")).toBeTruthy();
    expect(getByPlaceholderText("First Name")).toBeTruthy();
    expect(getByPlaceholderText("Last Name")).toBeTruthy();
    expect(getByPlaceholderText("Username")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm Password")).toBeTruthy();

    // Since both the title and the register button have "Register", getAllByText will return an array.
    const registerElements = getAllByText("Register");
    expect(registerElements.length).toBeGreaterThan(1);
    expect(registerElements[1]).toBeTruthy();

    // Check for the "Back to Login" button
    expect(getByText("Back to Login")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const { getAllByText, queryByText } = renderWithNavigation();

    // Target the register button (second "Register" element)
    const registerButtons = getAllByText("Register");
    const registerButton = registerButtons[1];
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

    const registerButtons = getAllByText("Register");
    const registerButton = registerButtons[1];
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(queryByText("Passwords do not match.")).toBeTruthy();
    });
  });

  it("navigates back when registration is successful", async () => {
    const { getByPlaceholderText, getAllByText, queryByText } = renderWithNavigation();

    fireEvent.changeText(getByPlaceholderText("First Name"), "Bob");
    fireEvent.changeText(getByPlaceholderText("Last Name"), "Jones");
    fireEvent.changeText(getByPlaceholderText("Username"), "bobjones");
    fireEvent.changeText(getByPlaceholderText("Email"), "bob@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "password123");

    const registerButtons = getAllByText("Register");
    const registerButton = registerButtons[1];
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(queryByText("Please fill out all fields.")).toBeNull();
      expect(queryByText("Passwords do not match.")).toBeNull();
      // Ensure navigation.goBack() is called on successful registration
      expect(mockedGoBack).toHaveBeenCalled();
    });
  });

  it('navigates back when "Back to Login" button is pressed', () => {
    const { getByText } = renderWithNavigation();
    const backButton = getByText("Back to Login");
    fireEvent.press(backButton);
    expect(mockedGoBack).toHaveBeenCalled();
  });
});
