import React from "react";
import { render } from "@testing-library/react-native";
import MapSection from "../app/MapSection";

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  const MockMapView = ({ children }: any) => <View testID="mock-map">{children}</View>;
  const MockMarker = ({ coordinate, title, description, children }: any) => (
    <View testID="mock-marker">
      <Text>{title}</Text>
      <Text>{description}</Text>
      {children}
    </View>
  );

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

describe("MapSection", () => {
  const mockSensors = [
    {
      id: "1",
      nickname: "Sensor 1",
      sensor_type: "air" as const,
      latitude: 41.0,
      longitude: -91.0,
    },
    {
      id: "2",
      nickname: "Sensor 2",
      sensor_type: "soil" as const,
      latitude: 42.0,
      longitude: -92.0,
    },
  ];

  const mockRegion = {
    latitude: 41.0,
    longitude: -91.0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  it("renders the MapView", () => {
    const { getByTestId } = render(
      <MapSection sensors={mockSensors} defaultRegion={mockRegion} />
    );
    expect(getByTestId("mock-map")).toBeTruthy();
  });

  it("renders a Marker for each sensor", () => {
    const { getAllByTestId } = render(
      <MapSection sensors={mockSensors} defaultRegion={mockRegion} />
    );
    const markers = getAllByTestId("mock-marker");
    expect(markers.length).toBe(2);
  });

  it("displays correct title and description for each marker", () => {
    const { getByText } = render(
      <MapSection sensors={mockSensors} defaultRegion={mockRegion} />
    );
    expect(getByText("Sensor 1")).toBeTruthy();
    expect(getByText("Type: air")).toBeTruthy();
    expect(getByText("Sensor 2")).toBeTruthy();
    expect(getByText("Type: soil")).toBeTruthy();
  });
});
