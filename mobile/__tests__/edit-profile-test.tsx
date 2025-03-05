// __tests__/editProfile.test.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditProfilePage from '../app/editProfile'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { NavigationContext, NavigationProp, ParamListBase } from '@react-navigation/native';

// Fake user profile data returned from the GET API call.
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

// Create a complete navigation mock.
const mockNavigation: NavigationProp<ParamListBase> = {
  reset: jest.fn(),
  dispatch: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  
}as any as NavigationProp<ParamListBase>;

describe("EditProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure AsyncStorage returns a dummy auth token.
    (AsyncStorage.getItem as jest.Mock) = jest.fn(() => Promise.resolve("dummyToken"));
    (AsyncStorage.setItem as jest.Mock) = jest.fn(() => Promise.resolve());
    // Mock Alert.alert so we can verify its usage.
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("fetches and displays user profile on mount", async () => {
    // Simulate a successful GET profile fetch.
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakeProfile),
    });

    const { getByDisplayValue } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    // Wait for the profile fields to be populated.
    await waitFor(() => {
      expect(getByDisplayValue("testuser")).toBeTruthy();
      expect(getByDisplayValue("Test")).toBeTruthy();
      expect(getByDisplayValue("User")).toBeTruthy();
      expect(getByDisplayValue("1234567890")).toBeTruthy();
      expect(getByDisplayValue("123 Main St")).toBeTruthy();
      expect(getByDisplayValue("Test City")).toBeTruthy();
      expect(getByDisplayValue("TS")).toBeTruthy();
      expect(getByDisplayValue("12345")).toBeTruthy();
    });
  });

  it("updates the profile successfully", async () => {
    // First, simulate the GET request for fetching the profile.
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      // Next, simulate the PATCH request for updating the profile.
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...fakeProfile, phone_number: "0987654321" }),
      });

    const { getByText, getByPlaceholderText } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    // Wait until the profile has been loaded.
    await waitFor(() => {
      expect(getByText("Edit Profile")).toBeTruthy();
    });

    // Change the phone number field.
    const phoneInput = getByPlaceholderText("Phone Number");
    act(() => {
      fireEvent.changeText(phoneInput, "0987654321");
    });

    // Press the update button.
    const updateButton = getByText("Update Profile");
    act(() => {
      fireEvent.press(updateButton);
    });

    // Wait for the success alert to be triggered.
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Your profile has been updated.");
    });
  });

  it("navigates back when the back button is pressed", async () => {
    // Simulate GET request to load profile.
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fakeProfile),
    });

    const { getByTestId } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    // Wait for the back button to be rendered.
    await waitFor(() => {
      expect(getByTestId("back-button")).toBeTruthy();
    });

    // Press the back button.
    const backButton = getByTestId("back-button");
    act(() => {
      fireEvent.press(backButton);
    });

    // Verify that navigation.reset was called with the expected parameters.
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "(tabs)", params: { screen: "home" } }],
    });
  });
});
