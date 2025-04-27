import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditProfilePage from '../app/editProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContext, NavigationProp, ParamListBase } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';             // ← Add this line
import * as ImagePicker from 'expo-image-picker';

jest.mock('expo-image-picker');

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
} as any;

describe("EditProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("updates the profile successfully", async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: true, standardized: fakeProfile }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      });

    const { getByText, getByPlaceholderText } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => expect(getByText("Edit Profile")).toBeTruthy());

    act(() => {
      fireEvent.changeText(getByPlaceholderText("Phone Number"), "0987654321");
    });
    act(() => {
      fireEvent.press(getByText("Update Profile"));
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
        type: "success",
        text1: "Success",
      }));
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("alerts when address validation fails", async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ valid: false, message: "Address is invalid" }),
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await act(async () => {
      fireEvent.press(getByText("Update Profile"));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Invalid Address", "Address is invalid");
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("handles image picking and uploading", async () => {
    const mockUri = "file://some-image.jpg";
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile_picture: mockUri }),
      } as any);

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: mockUri }],
    });

    const { getByTestId } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await act(async () => {
      fireEvent.press(getByTestId("image-picker-button"));
    });

    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("authToken");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/upload-profile-picture/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it("navigates back when the back button is pressed", async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByTestId } = render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => expect(getByTestId("back-button")).toBeTruthy());
    act(() => {
      fireEvent.press(getByTestId("back-button"));
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("alerts when no token is found on mount", async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() => Promise.resolve(null));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(
      <NavigationContext.Provider value={mockNavigation}>
        <EditProfilePage />
      </NavigationContext.Provider>
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "User is not authenticated.");
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
