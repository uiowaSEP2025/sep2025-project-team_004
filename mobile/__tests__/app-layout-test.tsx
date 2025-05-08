import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import RootLayout from "../app/_layout";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

// Properly mock external modules
jest.mock("expo-font", () => ({
  useFonts: jest.fn(() => [true]),
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),  // ✅ Add this
    removeItem: jest.fn(),  // (optional but often used)
  }));
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    ThemeProvider: ({ children }: any) => <>{children}</>,
    DarkTheme: {},
    DefaultTheme: {},
  };
});
jest.mock("expo-router", () => ({
    useRouter: jest.fn(),
    Stack: Object.assign(({ children }: any) => <>{children}</>, {
      Screen: () => null,
    }),
  }));
jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(() => Promise.resolve(null)), // Safe default
  parse: jest.fn((url) => ({
    path: "ResetPasswordScreen",
    queryParams: { email: "test@example.com", token: "abc123" },
  })),
}));
jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));
jest.mock("react-native-toast-message", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => <></>,
  };
});

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it("renders null while loading fonts and auth state", () => {
    (Font.useFonts as jest.Mock).mockReturnValueOnce([false]);
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeNull();
  });



  it("calls deep link handler on initial URL", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("mockToken");
    (Linking.getInitialURL as jest.Mock).mockResolvedValueOnce("app://ResetPasswordScreen?email=test@example.com&token=abc123");

    render(<RootLayout />);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith({
        pathname: "/ResetPasswordScreen",
        params: { email: "test@example.com", token: "abc123" },
      });
    });
  });
});
