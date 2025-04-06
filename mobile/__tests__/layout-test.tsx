
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import RootLayout from "../app/_layout"; // adjust the import path as needed
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)), // change to a token string to simulate authenticated state
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-font", () => ({
  useFonts: () => [true],
}));

jest.mock("@react-navigation/native", () => ({
  DarkTheme: {},
  DefaultTheme: {},
  ThemeProvider: ({ children }) => children,
}));

const DummyStack = ({ children }) => <>{children}</>;
DummyStack.Screen = (props) => <>{props.children}</>;

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  Stack: DummyStack,
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  parse: jest.fn(() => ({ path: "", queryParams: {} })),
}));

describe("RootLayout", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly after fonts and auth check complete", async () => {
    render(<RootLayout />);
    
    await waitFor(() => {
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });

  it("navigates to ResetPasswordScreen on deep link with correct params", async () => {
    // Set up the deep link values
    const testEmail = "test@example.com";
    const testToken = "12345";
    const testUrl = `myapp://ResetPasswordScreen?email=${testEmail}&token=${testToken}`;

    // Update the mocks for deep linking
    Linking.getInitialURL.mockResolvedValueOnce(testUrl);
    Linking.parse.mockReturnValueOnce({
      path: "ResetPasswordScreen",
      queryParams: { email: testEmail, token: testToken },
    });

    render(<RootLayout />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/ResetPasswordScreen",
        params: { email: testEmail, token: testToken },
      });
    });
  });
});
