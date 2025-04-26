import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import NoSensorFallbackView from "../app/NoSensorFallback"; // adjust path if needed
import * as Navigation from "@react-navigation/native";

const navigateMock = jest.fn();

jest.mock("@react-navigation/native", () => {
    const navigateMock = jest.fn();
    return {
      useNavigation: () => ({
        navigate: navigateMock,
      }),
    };
  });

  describe("NoSensorFallbackView", () => {
    it("renders the fallback texts and button", () => {
      const { getByText } = render(<NoSensorFallbackView />);
      expect(
        getByText("You must buy a sensor before you can view any data!")
      ).toBeTruthy();
      expect(
        getByText("Please see our store to purchase your first sensor.")
      ).toBeTruthy();
      expect(getByText("Go to Store")).toBeTruthy();
    });
  
    it("navigates to the store when button is pressed", () => {
      const { getByText } = render(<NoSensorFallbackView />);
      const button = getByText("Go to Store");
  
      const navigate = (Navigation.useNavigation() as any).navigate;
      fireEvent.press(button);
      expect(navigate).toHaveBeenCalledWith("store");
    });
  });
