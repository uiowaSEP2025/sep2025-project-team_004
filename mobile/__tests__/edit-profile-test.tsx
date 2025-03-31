import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditProfilePage from '../app/editProfile'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { NavigationContext, NavigationProp, ParamListBase } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

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
} as any as NavigationProp<ParamListBase>;

describe("EditProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure AsyncStorage returns a dummy auth token by default.
    (AsyncStorage.getItem as jest.Mock) = jest.fn(() => Promise.resolve("dummyToken"));
    (AsyncStorage.setItem as jest.Mock) = jest.fn(() => Promise.resolve());
    // Mock Toast.show so we can verify its usage.
    jest.spyOn(Toast, 'show').mockImplementation(() => {});
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

    // Wait for the success toast to be triggered.
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: "success",
        text1: "Success",
        text2: "Your profile has been updated.",
        position: "top",
        topOffset: Platform.OS === "web" ? 20 : 70,
        visibilityTime: 4000,
        autoHide: true,
      });
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
      routes: [{ name: "(tabs)", params: { screen: "profile" } }],
    });
  });

  // New test: Check for missing auth token during profile fetch.
  it("shows an alert when user is not authenticated during profile fetch", async () => {
    // Simulate missing auth token.
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "User is not authenticated.");
    });
  });

  // New test: Check for 403 Forbidden response during profile fetch.
  it("alerts the user when the profile fetch returns a 403 Forbidden error", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("dummyToken");
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    global.fetch = jest.fn().mockResolvedValueOnce({
      status: 403,
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "You do not have permission to access this resource.");
    });
  });

  // New test: Check update failure due to server error.
  it("displays an error alert when updating the profile fails", async () => {
    global.fetch = jest.fn()
      // Simulate successful GET request.
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      // Simulate PATCH request failure.
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Update failed due to server error." }),
      });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    // Wait until the profile is loaded.
    await waitFor(() => {
      expect(getByText("Edit Profile")).toBeTruthy();
    });

    // Update the phone number to trigger the update call.
    const phoneInput = getByPlaceholderText("Phone Number");
    act(() => {
      fireEvent.changeText(phoneInput, "0987654321");
    });

    const updateButton = getByText("Update Profile");
    act(() => {
      fireEvent.press(updateButton);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "Update failed due to server error.");
    });
  });

  // New test: Check exception handling during profile update.
  it("shows an alert when an exception occurs during profile update", async () => {
    global.fetch = jest.fn()
      // Simulate successful GET request.
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      // Simulate PATCH request throwing an error.
      .mockRejectedValueOnce(new Error("Network error"));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("Edit Profile")).toBeTruthy();
    });

    const updateButton = getByText("Update Profile");
    act(() => {
      fireEvent.press(updateButton);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to update profile.");
    });
  });
});
