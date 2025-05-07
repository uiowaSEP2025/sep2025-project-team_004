import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditProfilePage from '../app/editProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// 🔧 Mock: Navigation
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: () => true,
    navigate: jest.fn(),
  }),
}));

// 🔧 Mock: ImagePicker
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
    const { getByText, getByDisplayValue } = render(<EditProfilePage />);

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
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          valid: true,
          standardized: {
            address: "123 Main St",
            city: "Test City",
            state: "TS",
            zip_code: "12345",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeProfile),
      });

    const { getByText, getByPlaceholderText } = render(<EditProfilePage />);

    await waitFor(() => expect(getByText("Edit Profile")).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText("Phone Number"), "0987654321");
    fireEvent.press(getByText("Update Profile"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
        type: "success",
        text1: "Success",
      }));
    });
  });

  it("alerts when address validation fails", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ valid: false, message: "Address is invalid" }),
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(<EditProfilePage />);

    await act(async () => {
      fireEvent.press(getByText("Update Profile"));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Invalid Address", "Address is invalid");
    });
  });

  it("handles image picking and uploading", async () => {
    const mockUri = "file://some-image.jpg";

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile_picture: mockUri }),
    });

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: mockUri }],
    });

    const { getByTestId } = render(<EditProfilePage />);

    await act(async () => {
      fireEvent.press(getByTestId("image-picker-button"));
    });

    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  it("navigates back when the back button is pressed", async () => {
    const { getByTestId } = render(<EditProfilePage />);
    const backButton = getByTestId("back-button");

    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it("alerts when no token is found on mount", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() => Promise.resolve(null));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<EditProfilePage />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "User is not authenticated.");
    });
  });

  it("alerts the user when the profile update returns a 403 Forbidden error", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "authToken") return Promise.resolve("dummyToken");
      if (key === "userInfo") return Promise.resolve(JSON.stringify(fakeProfile));
      return Promise.resolve(null);
    });

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          valid: true,
          standardized: {
            address: "123 Main St",
            city: "Test City",
            state: "TS",
            zip_code: "12345",
          },
        }),
      })
      .mockResolvedValueOnce({
        status: 403,
        ok: false,
        json: () => Promise.resolve({
          detail: "You do not have permission to access this resource.",
        }),
      });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(<EditProfilePage />);
    await waitFor(() => expect(getByText("Edit Profile")).toBeTruthy());
    fireEvent.press(getByText("Update Profile"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error", "You do not have permission to access this resource.");
    });
  });
});
