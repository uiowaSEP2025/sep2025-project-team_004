import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
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
      const { getByTestId, getByPlaceholderText, getByText } = renderWithNavigation();

      expect(getByTestId("forgot-title")).toBeTruthy();
      expect(getByPlaceholderText("Email")).toBeTruthy();
    });

    it("updates email input", () => {
      const { getByPlaceholderText, getByDisplayValue } = renderWithNavigation();
      const emailInput = getByPlaceholderText("Email");

      fireEvent.changeText(emailInput, "test@example.com");
      expect(getByDisplayValue("test@example.com")).toBeTruthy();
    });
});