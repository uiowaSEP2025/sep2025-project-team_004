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
    // By default, AsyncStorage.getItem returns a token and the fake profile.
    (AsyncStorage.getItem as jest.Mock) = jest.fn((key: string) => {
      if (key === "authToken") return Promise.resolve("dummyToken");
      if (key === "userInfo") return Promise.resolve(JSON.stringify(fakeProfile));
      return Promise.resolve(null);
    });
    (AsyncStorage.setItem as jest.Mock) = jest.fn(() => Promise.resolve());
    jest.spyOn(Toast, 'show').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("fetches and displays user profile on mount", async () => {
    // Since profile data is loaded from AsyncStorage,
    // we verify that username, first name, and last name are rendered via getByText,
    // and that the TextInput fields show the corresponding values.
    const { getByText, getByDisplayValue } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("testuser")).toBeTruthy();
      expect(getByText("Test")).toBeTruthy();
      expect(getByText("User")).toBeTruthy();
      expect(getByDisplayValue("1234567890")).toBeTruthy();
      expect(getByDisplayValue("123 Main St")).toBeTruthy();
      expect(getByDisplayValue("Test City")).toBeTruthy();
      expect(getByDisplayValue("TS")).toBeTruthy();
      expect(getByDisplayValue("12345")).toBeTruthy();
    });
  });

  it("updates the profile successfully", async () => {
    // Simulate a successful GET then a successful PATCH update.
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...fakeProfile, phone_number: "0987654321" }),
      });

    const { getByText, getByPlaceholderText } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => {
      expect(getByText("Edit Profile")).toBeTruthy();
    });

    const phoneInput = getByPlaceholderText("Phone Number");
    act(() => {
      fireEvent.changeText(phoneInput, "0987654321");
    });

    const updateButton = getByText("Update Profile");
    act(() => {
      fireEvent.press(updateButton);
    });

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
    // Simulate profile loading.
    const { getByTestId } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => {
      expect(getByTestId("back-button")).toBeTruthy();
    });

    const backButton = getByTestId("back-button");
    act(() => {
      fireEvent.press(backButton);
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it("shows an alert when user is not authenticated during profile fetch", async () => {
    // Simulate missing auth token.
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "authToken") return Promise.resolve(null);
      return Promise.resolve(null);
    });
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

  it("alerts the user when the profile update returns a 403 Forbidden error", async () => {
    // For update profile, simulate a PATCH call that returns 403 with a detail message.
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "authToken") return Promise.resolve("dummyToken");
      if (key === "userInfo") return Promise.resolve(JSON.stringify(fakeProfile));
      return Promise.resolve(null);
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    global.fetch = jest.fn().mockResolvedValueOnce({
      status: 403,
      ok: false,
      json: () => Promise.resolve({ detail: "You do not have permission to access this resource." }),
    });

    const { getByText, getByPlaceholderText } = render(
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
      expect(alertSpy).toHaveBeenCalledWith("Error", "You do not have permission to access this resource.");
    });
  });

  

});
