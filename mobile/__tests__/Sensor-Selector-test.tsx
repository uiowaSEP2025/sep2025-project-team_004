import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SensorSelector from "../app/SensorSelector";

// Mock router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Image since React Native requires actual assets
jest.mock("react-native/Libraries/Image/Image", () => "Image");

// Mocks
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    expect(getAllByText("Test Sensor").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Other Sensor")).toBeTruthy();
    expect(getAllByText("Air Sensor").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Soil Sensor")).toBeTruthy();
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

  it("navigates to /first-look on 'Add More Sensors' press", () => {
    const toggleMock = jest.fn();
    const { getByText } = setup({ showDropdown: true, setShowDropdown: toggleMock });

    fireEvent.press(getByText("Add More Sensors"));
    expect(mockPush).toHaveBeenCalledWith("/first-look");
    expect(toggleMock).toHaveBeenCalledWith(false);
  });

  it("navigates to /first-look on 'First Time Deploy' press", () => {
    const toggleMock = jest.fn();
    const { getByText } = setup({ showDropdown: true, setShowDropdown: toggleMock });

    fireEvent.press(getByText("First Time Deploy"));
    expect(mockPush).toHaveBeenCalledWith("/first-look");
    expect(toggleMock).toHaveBeenCalledWith(false);
  });
});
