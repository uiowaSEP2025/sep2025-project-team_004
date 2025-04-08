import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SensorSelector from "../app/SensorSelector"; // adjust the path if needed

const mockSensor = {
  id: "1",
  nickname: "Test Sensor",
  sensor_type: "air" as const,
  latitude: 41.0,
  longitude: -91.0,
};

const mockOtherSensor = {
  id: "2",
  nickname: "Other Sensor",
  sensor_type: "soil" as const,
  latitude: 42.0,
  longitude: -92.0,
};

const setup = (overrideProps = {}) => {
  const defaultProps = {
    selectedSensor: mockSensor,
    userSensors: [mockSensor, mockOtherSensor],
    showDropdown: false,
    setShowDropdown: jest.fn(),
    onSelect: jest.fn(),
  };

  return render(<SensorSelector {...defaultProps} {...overrideProps} />);
};

describe("SensorSelector", () => {
  it("renders selected sensor nickname and type", () => {
    const { getByText } = setup();
    expect(getByText("Test Sensor")).toBeTruthy();
    expect(getByText("Air Sensor")).toBeTruthy();
  });

  it("shows ▼ when dropdown is closed", () => {
    const { getByText } = setup({ showDropdown: false });
    expect(getByText("▼")).toBeTruthy();
  });

  it("shows ▲ when dropdown is open", () => {
    const { getByText } = setup({ showDropdown: true });
    expect(getByText("▲")).toBeTruthy();
  });

  it("renders all user sensors in dropdown when open", () => {
    const { getAllByText, getByText } = setup({ showDropdown: true });
    expect(getAllByText("Test Sensor")).toHaveLength(2);
    expect(getByText("Other Sensor")).toBeTruthy();
    expect(getAllByText("Air Sensor")).toHaveLength(2);
    expect(getAllByText("Soil Sensor")).toHaveLength(1);
  });

  it("calls setShowDropdown when toggle is pressed", () => {
    const toggleMock = jest.fn();
    const { getByText } = setup({ setShowDropdown: toggleMock });

    fireEvent.press(getByText("▼"));
    expect(toggleMock).toHaveBeenCalledWith(true);
  });

  it("calls onSelect and closes dropdown when sensor is pressed", () => {
    const selectMock = jest.fn();
    const toggleMock = jest.fn();
    const { getByText } = setup({
      showDropdown: true,
      onSelect: selectMock,
      setShowDropdown: toggleMock,
    });

    fireEvent.press(getByText("Other Sensor"));
    expect(selectMock).toHaveBeenCalledWith(mockOtherSensor);
    expect(toggleMock).toHaveBeenCalledWith(false);
  });
});
