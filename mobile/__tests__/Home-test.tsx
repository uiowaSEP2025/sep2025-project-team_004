
// 1) Stub victory-native
jest.mock("victory-native", () => {
  const React = require("react");
  return {
    __esModule: true,
    VictoryChart: (props: any) => React.createElement(React.Fragment, props),
    Line:         (props: any) => React.createElement(React.Fragment, props),
    useChartPressState: () => [false, () => {}],
  };
});

// 2) Stub react-native-skia
jest.mock("@shopify/react-native-skia", () => {
  const React = require("react");
  return {
    __esModule: true,
    Circle:  (props: any) => React.createElement(React.Fragment, props),
    useFont: () => null,
  };
});

// 3) Stub our own children so they don’t drag in unexpected logic
jest.mock("../app/SensorChart", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ title }: { title: string }) =>
      React.createElement(View, null, React.createElement(Text, null, title)),
  };
});
jest.mock("../app/SensorSelector", () => {
  const React = require("react");
  return { __esModule: true, default: () => React.createElement("View", null) };
});
jest.mock("../app/MapSection", () => {
  const React = require("react");
  return { __esModule: true, default: () => React.createElement("View", null) };
});
jest.mock("../app/NoSensorFallback", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(Text, null, "No Sensors"),
  };
});

// 4) Stub AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// 5) Stub navigation
const resetMock = jest.fn();
const navigateMock = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

// 6) Global fetch mock
(global.fetch as jest.Mock) = jest.fn();

// Now import under test
import React from "react";
import { render } from "@testing-library/react-native";
import WelcomePage from "../app/(tabs)/home";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

//
// Test data
//
const mockSensor = {
  id: "1",
  nickname: "Test Sensor",
  sensor_type: "air",
  is_default: true,
  latitude: "41.0",
  longitude: "-91.0",
};
const mockSensorData = {
  data: {
    points: [
      {
        time: new Date().toISOString(),
        temperature: "23.5",
        pressure: "1013",
        humidity: "45",
      },
    ],
  },
};

describe("WelcomePage", () => {
  const useNav = useNavigation as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // navigation
    useNav.mockReturnValue({ reset: resetMock, navigate: navigateMock });

    // AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "authToken") return Promise.resolve("fake_token");
      if (key === "sensors") return Promise.resolve(JSON.stringify([mockSensor]));
      return Promise.resolve(null);
    });

    // fetch
    (global.fetch as jest.Mock).mockReset();
  });

  it("shows the loading indicator immediately", () => {
    const { getByTestId } = render(<WelcomePage />);
    expect(getByTestId("ActivityIndicator")).toBeTruthy();
  });

  it("renders toggle buttons once data loads", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockSensor],
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify(mockSensorData),
      });

    const { findByText } = render(<WelcomePage />);
    expect(await findByText("Today")).toBeTruthy();
    expect(await findByText("Past Week")).toBeTruthy();
    expect(await findByText("Past 30 Days")).toBeTruthy();
  });

  it("displays chart titles when sensor data is ready", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockSensor],
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify(mockSensorData),
      });

    const { findByText } = render(<WelcomePage />);
    // SensorChart stub now renders <Text>{title}</Text>
    expect(await findByText("Temperature (°C)")).toBeTruthy();
    expect(await findByText("Pressure (hPa)")).toBeTruthy();
    expect(await findByText("Humidity (%)")).toBeTruthy();
  });

  it("redirects to index screen if authToken is missing", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      key === "authToken" ? Promise.resolve(null) : Promise.resolve(null)
    );

    render(<WelcomePage />);
    // allow useEffect to run
    await new Promise(process.nextTick);

    expect(resetMock).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "index" }],
    });
  });
});
