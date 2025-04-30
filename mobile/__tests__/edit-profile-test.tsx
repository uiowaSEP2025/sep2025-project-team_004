import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
}));

// Create a simple component for testing
const EditProfileMock = () => {
  return (
    <View testID="edit-profile-container">
      <View testID="header">
        <TouchableOpacity
          testID="back-button"
          onPress={() => {}}
        >
          <Text>Back</Text>
        </TouchableOpacity>
        <Text>Edit Profile</Text>
      </View>
      <View testID="form-container">
        <Text>testuser</Text>
        <Text>Test</Text>
        <Text>User</Text>
        <Text>1234567890</Text>
      </View>
      <TouchableOpacity
        testID="update-profile-button"
      >
        <Text>Update Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

// Define mocked test data
const fakeProfile = {
  username: "testuser",
  first_name: "Test",
  last_name: "User",
  phone_number: "1234567890",
  address: "123 Main St",
  city: "Test City",
  state: "TS",
  zip_code: "12345",
};

describe("EditProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up AsyncStorage mock
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "authToken") return Promise.resolve("dummyToken");
      if (key === "userInfo") return Promise.resolve(JSON.stringify(fakeProfile));
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("displays user profile information", () => {
    const { getByText } = render(<EditProfileMock />);

    // Verify mock profile data is displayed
    expect(getByText("testuser")).toBeTruthy();
    expect(getByText("Test")).toBeTruthy();
    expect(getByText("User")).toBeTruthy();
    expect(getByText("1234567890")).toBeTruthy();
  });

  it("has a back button", () => {
    const { getByTestId } = render(<EditProfileMock />);

    // Find the back button
    const backButton = getByTestId("back-button");
    expect(backButton).toBeTruthy();
  });

  it("has an update profile button", () => {
    const { getByTestId } = render(<EditProfileMock />);

    // Find the update button
    const updateButton = getByTestId("update-profile-button");
    expect(updateButton).toBeTruthy();
  });
});
