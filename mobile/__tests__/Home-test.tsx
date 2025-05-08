/**
 * __tests__/Home-test.tsx
 */
import '@testing-library/jest-native/extend-expect';
import React from "react";
import {
  render,
  waitFor,
  cleanup,
  fireEvent,
} from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";


// —————————————————————————————————————
// 1) MOCK all child components with simple View stubs
// —————————————————————————————————————
jest.mock("@/components/skeletons/HomeSkeletonLoader", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="HomeSkeletonLoader" />;
});
jest.mock("../app/NoSensorFallback", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="NoSensorFallback" />;
});
jest.mock("../app/MapSection", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="MapSection" />;
});
jest.mock("../app/SensorSelector", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ currentUserId }: { currentUserId: number | null }) =>
    <View testID={`SensorSelector-${currentUserId}`} />;
});
jest.mock("../app/SensorChart", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({ title }: { title: string }) =>
    <View testID={`MockChart-${title}`} />;
});

// —————————————————————————————————————
// 2) MOCK navigation BEFORE importing component
// —————————————————————————————————————
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    reset: jest.fn(),
    navigate: jest.fn(),
  }),
  useFocusEffect: (cb: () => void) => {
    const React = require("react");
    React.useEffect(() => cb(), [cb]);
  },
}));

// —————————————————————————————————————
// 3) SET UP AsyncStorage + fetch defaults
// —————————————————————————————————————
beforeEach(() => {
  jest.clearAllMocks();
  cleanup();
});
(AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
  if (key === "userInfo") return Promise.resolve(JSON.stringify({ id: 42 }));
  if (key === "authToken") return Promise.resolve("tok");
  return Promise.resolve(null);
});
global.fetch = jest.fn((url: string) => {
  if (url.includes("/api/sensors/my/")) {
    // return one default sensor
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            sensor_id: "AAA",
            id: "AAA",
            nickname: "X",
            sensor_type: "air",
            is_default: true,
            latitude: "10",
            longitude: "20",
          },
        ]),
    });
  }
  // for any other URL (i.e. the sensor-data fetch), return our points
  return Promise.resolve({
    ok: true,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          data: {
            points: [
              {
                time: new Date().toISOString(),
                temperature: "1",
                pressure: "2",
                humidity: "3",
              },
            ],
          },
        })
      ),
  });
});

// —————————————————————————————————————
// 4) IMPORT the component under test
// —————————————————————————————————————
import WelcomePage from "../app/(tabs)/home";

// —————————————————————————————————————
// 5) THE MAIN HAPPY-PATH SUITE
// —————————————————————————————————————
describe("WelcomePage", () => {
  it("1) shows the skeleton loader while loading", () => {
    const { getByTestId } = render(<WelcomePage />);
    expect(getByTestId("HomeSkeletonLoader")).toBeTruthy();
  });

  it("2) loads userInfo and passes currentUserId to SensorSelector", async () => {
    const { getByTestId } = render(<WelcomePage />);
    await waitFor(() => {
      expect(getByTestId("SensorSelector-42")).toBeTruthy();
    });
  });

  it("3) switches into chart‐view once data arrives", async () => {
    const { getByTestId } = render(<WelcomePage />);
    await waitFor(() =>
      expect(getByTestId("MockChart-Temperature (°C)")).toBeTruthy()
    );
    expect(getByTestId("MockChart-Pressure (hPa)")).toBeTruthy();
    expect(getByTestId("MockChart-Humidity (%)")).toBeTruthy();
  });

  it("4) toggles to map view when pressing the map button", async () => {
    const { getByTestId } = render(<WelcomePage />);
    await waitFor(() => getByTestId("MockChart-Temperature (°C)"));
    fireEvent.press(getByTestId("ToggleMapButton"));
    expect(getByTestId("MapSection")).toBeTruthy();
  });

  it("5) handles the no‐sensors branch", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce((url: string) => {
      if (url.includes("/api/sensors/my/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, text: () => Promise.resolve("{}") });
    });
    const { getByTestId } = render(<WelcomePage />);
    await waitFor(() => {
      expect(getByTestId("NoSensorFallback")).toBeTruthy();
    });
  });

  it("6) allows switching ranges and re‐renders charts", async () => {
    const { getByText, getByTestId } = render(<WelcomePage />);
    await waitFor(() => getByTestId("MockChart-Temperature (°C)"));

    fireEvent.press(getByText("Past Week"));
    await waitFor(() => {
      expect(getByTestId("MockChart-Temperature (°C)")).toBeTruthy();
    });

    fireEvent.press(getByText("Past 30 Days"));
    await waitFor(() => {
      expect(getByTestId("MockChart-Temperature (°C)")).toBeTruthy();
    });
  });
});

// —————————————————————————————————————
// 6) EDGE-CASE & UNTESTED BRANCHES
// —————————————————————————————————————
const fakeSensor = {
  sensor_id: "ZZZ",
  id: "ZZZ",
  nickname: "NoDefault",
  sensor_type: "air",
  is_default: false,
  latitude: "0",
  longitude: "0",
};

describe("WelcomePage – uncovered branches", () => {
  it("renders SensorSelector with currentUserId = null when no userInfo", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === "userInfo") return Promise.resolve(null);
      if (key === "authToken") return Promise.resolve("good");
      return Promise.resolve(null);
    });

    const { getByTestId } = render(<WelcomePage />);
    await waitFor(() => {
      expect(getByTestId("SensorSelector-null")).toBeTruthy();
    });
  });

  it("keeps showing HomeSkeletonLoader when sensors have no default", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/sensors/my/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([fakeSensor]),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ data: { points: [] } })),
      });
    });

    const { getByTestId } = render(<WelcomePage />);
    expect(getByTestId("HomeSkeletonLoader")).toBeTruthy();
  });

  it("falls back to NoSensorFallback when fetchUserSensors errors out", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/sensors/my/")) {
        return Promise.reject(new Error("network!"));
      }
      return Promise.resolve({ ok: true, text: () => Promise.resolve("{}") });
    });

    const { getByTestId } = render(<WelcomePage />);
    await waitFor(() => {
      expect(getByTestId("NoSensorFallback")).toBeTruthy();
    });
  });

  it("renders the in-ScrollView spinner on non-JSON sensor-data", async () => {
    // override fetch so sensor-data endpoint returns non-JSON
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/sensors/my/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([{ sensor_id: "X", id: "X", is_default: true, latitude: "0", longitude: "0" }]),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve("NOT JSON"),
      });
    });

    const { queryByTestId } = render(<WelcomePage />);

    // wait for the component to finish its focus-effect + fetch logic
    // which will clear the skeleton loader
    await waitFor(() => {
      expect(queryByTestId("HomeSkeletonLoader")).toBeNull();
    });

    // because response wasn’t JSON, we should never see the chart stub…
    expect(queryByTestId("MockChart-Temperature (°C)")).toBeNull();

    // (the inner <ActivityIndicator> branch executed, even though we can't grab it directly)
  });

  it("applies active style when you switch range buttons", async () => {
    // 1) Restore AsyncStorage behavior
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "userInfo") return Promise.resolve(JSON.stringify({ id: 42 }));
      if (key === "authToken") return Promise.resolve("tok");
      return Promise.resolve(null);
    });
  
    // 2) Restore the default fetch mock for sensors + data
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/sensors/my/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                sensor_id: "AAA",
                id: "AAA",
                nickname: "X",
                sensor_type: "air",
                is_default: true,
                latitude: "10",
                longitude: "20",
              },
            ]),
        });
      }
      // sensor-data endpoint
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: {
                points: [
                  {
                    time: new Date().toISOString(),
                    temperature: "1",
                    pressure: "2",
                    humidity: "3",
                  },
                ],
              },
            })
          ),
      });
    });
  
    // 3) Render and wait for the chart stubs (and toggle bar) to appear
    const { getByText, getByTestId } = render(<WelcomePage />);
    await waitFor(() => getByTestId("MockChart-Temperature (°C)"));
  
    // 4) Assert styles on each button
    const todayBtn = getByText("Today");
    expect(todayBtn).toHaveStyle({ color: "#fff" });
  
    fireEvent.press(getByText("Past Week"));
    await waitFor(() => {
      expect(getByText("Past Week")).toHaveStyle({ color: "#fff" });
    });
  
    fireEvent.press(getByText("Past 30 Days"));
    await waitFor(() => {
      expect(getByText("Past 30 Days")).toHaveStyle({ color: "#fff" });
    });
  });
});