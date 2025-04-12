import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import WelcomePage from "../app/(tabs)/home";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Navigation from "@react-navigation/native";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const resetMock = jest.fn();
const navigateMock = jest.fn();

const mockedNavigator = {
  reset: resetMock,
  navigate: navigateMock,
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(() => mockedNavigator),
}));

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});
const mockSensor = {
  id: "1",
  nickname: "Test Sensor",
  sensor_type: "air",
  is_default: true,
  latitude: "41.0",
  longitude: "-91.0",
};
const getItemMock = AsyncStorage.getItem as jest.Mock;
getItemMock.mockImplementation((key: string) => {
  if (key === "authToken") return Promise.resolve("fake_token");
  if (key === "sensors") return Promise.resolve(JSON.stringify([mockSensor]));
  return Promise.resolve(null);
});

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

const setup = () => render(<WelcomePage />);

describe("WelcomePage", () => {
  const fetchMock = global.fetch as jest.Mock;
  it("renders correctly", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockSensor],
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify(mockSensorData),
      });

    const { findByText } = setup();
    expect(await findByText("Today")).toBeTruthy();
    expect(await findByText("Past Week")).toBeTruthy();
    expect(await findByText("Past 30 Days")).toBeTruthy();
  });

  it("shows activity indicator while loading", async () => {
    getItemMock.mockResolvedValue("fake_token");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockSensor],
    });

    fetchMock.mockResolvedValueOnce({
      text: async () => JSON.stringify(mockSensorData),
    });

    const { getByTestId } = setup();
    await waitFor(() => {
      expect(getByTestId("ActivityIndicator")).toBeTruthy();
    });
  });

  it("displays chart titles when data is loaded", async () => {
    getItemMock.mockImplementation((key: string) => {
      if (key === "authToken") return Promise.resolve("fake_token");
      if (key === "sensors") return Promise.resolve(JSON.stringify([mockSensor]));
      return Promise.resolve(null);
    });
  
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockSensor],
      })
      .mockResolvedValueOnce({
        text: async () => JSON.stringify(mockSensorData),
      });
  
    const { findByText } = setup();
  
    await waitFor(async () => {
      expect(await findByText("Temperature (°C)")).toBeTruthy();
      expect(await findByText("Pressure (hPa)")).toBeTruthy();
      expect(await findByText("Humidity (%)")).toBeTruthy();
    });
  });

  it("calls navigation.reset if authToken is missing", async () => {
    const spy = jest.fn();
    mockedNavigator.reset = spy;
  
    getItemMock.mockResolvedValue(null);
    setup();
  
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
  });
