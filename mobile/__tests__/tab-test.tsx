import React from "react";
import { render } from "@testing-library/react-native";
import { Platform, Text } from "react-native";

// Mocks for custom components
jest.mock("@/components/HapticTab", () => ({
  HapticTab: jest.fn(() => null),
}));

jest.mock("@/components/ui/IconSymbol", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    IconSymbol: jest.fn(({ name, size, color }) => (
      <Text testID={`icon-${name}`}>{`${name}:${size}:${color}`}</Text>
    )),
  };
});

jest.mock("@/components/ui/TabBarBackground", () => {
  const React = require("react");
  return jest.fn(() => <></>);
});

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/constants/Colors", () => ({
  Colors: {
    light: { tint: "#123456" },
    dark: { tint: "#654321" },
  },
}));

// Enhanced Tabs mock that invokes tabBarIcon
jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Tabs: Object.assign(({ children }: any) => <>{children}</>, {
      Screen: ({ name, options }: any) => {
        const Icon = options?.tabBarIcon?.({ color: "mock-color" }) || null;
        return (
          <>
            <Text>{name}</Text>
            {Icon}
          </>
        );
      },
    }),
  };
});

// Import target component
import TabLayout from "../app/(tabs)/_layout";
import { IconSymbol } from "@/components/ui/IconSymbol";

describe("TabLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all tab screens", () => {
    const { getByText } = render(<TabLayout />);
    ["home", "store", "social", "profile"].forEach((screen) => {
      expect(getByText(screen)).toBeTruthy();
    });
  });

  it("renders icons with correct props", () => {
    render(<TabLayout />);
    expect(IconSymbol).toHaveBeenCalledWith(
      expect.objectContaining({ name: "house.fill", size: 28, color: "mock-color" }),
      {}
    );
    expect(IconSymbol).toHaveBeenCalledWith(
      expect.objectContaining({ name: "bag.fill", size: 28, color: "mock-color" }),
      {}
    );
    expect(IconSymbol).toHaveBeenCalledWith(
      expect.objectContaining({ name: "message", size: 28, color: "mock-color" }),
      {}
    );
    expect(IconSymbol).toHaveBeenCalledWith(
      expect.objectContaining({ name: "person", size: 28, color: "mock-color" }),
      {}
    );
  });

  it("uses iOS-specific tabBarStyle", () => {
    jest.spyOn(Platform, "select").mockImplementation((options) => options.ios);
    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("uses default tabBarStyle on Android", () => {
    jest.spyOn(Platform, "select").mockImplementation((options) => options.default);
    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toMatchSnapshot();
  });
});
