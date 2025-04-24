import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import FriendRequestsScreen from "../app/friends";
import * as api from "@/app/api/friends";
import { NavigationContext } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('dummy-token'),
  setItem: jest.fn(),
}));

const goBackMock = jest.fn();
const navigateMock = jest.fn();
const pushMock = jest.fn();

// Mock for expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock for react-navigation
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: jest.fn(),
      navigate: jest.fn(),
    }),
    useFocusEffect: (callback: () => void) => {
      const mockReact = require('react');
      mockReact.useEffect(() => {
        callback();
      }, [callback]);
    },
    useRoute: () => ({
      params: {},
      name: 'MockedScreen',
      key: 'mocked-screen-key'
    }),
  };
});

jest.mock("@expo/vector-icons", () => {
  return {
    MaterialIcons: ({ name }: { name: string }) => {
      return <></>;
    },
  };
});

jest.mock("@/app/api/friends", () => ({
  sendFriendRequest: jest.fn(),
  getPendingRequests: jest.fn(),
  getAllFriends: jest.fn(),
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => ({}),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({})
  })
);

const mockPending = [
  { id: 1, from_user: 2, from_user_username: "alice", to_user: 1, created_at: "2024-01-01T00:00:00Z" },
];

const mockFriends = [
  { id: 2, username: "bob" },
];

// Create a mock navigation context value
const navContext = {
  isFocused: () => true,
  addListener: jest.fn(() => jest.fn()),
};

// A helper function to wrap components with the navigation context
const renderWithNavigation = (component: React.ReactNode) => {
  return render(
    <NavigationContext.Provider value={navContext as any}>
      {component}
    </NavigationContext.Provider>
  );
};

describe("FriendRequestsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dummy-token');
    (api.getPendingRequests as jest.Mock).mockResolvedValue(mockPending);
    (api.getAllFriends as jest.Mock).mockResolvedValue(mockFriends);
  });

  it("renders header and tabs", async () => {
    const { getByText } = renderWithNavigation(<FriendRequestsScreen />);
    expect(getByText("Friends")).toBeTruthy();
    expect(getByText("Pending")).toBeTruthy();
    expect(getByText("All")).toBeTruthy();
    expect(getByText("Add Friend")).toBeTruthy();
  });

  it("shows pending requests by default", async () => {
    const { getByText } = renderWithNavigation(<FriendRequestsScreen />);
    await waitFor(() => {
      expect(getByText("alice")).toBeTruthy();
    });
  });

  it("switches to All tab and shows friends", async () => {
    const { getByText } = renderWithNavigation(<FriendRequestsScreen />);
    fireEvent.press(getByText("All"));
    await waitFor(() => {
      expect(getByText("bob")).toBeTruthy();
    });
  });

  it("sends friend request and shows confirmation modal", async () => {
    (api.sendFriendRequest as jest.Mock).mockResolvedValueOnce({});

    const { getByPlaceholderText, getByText } = renderWithNavigation(<FriendRequestsScreen />);
    fireEvent.press(getByText("Add Friend"));

    const input = getByPlaceholderText("Search for a friend...");
    fireEvent.changeText(input, "newuser");
    fireEvent.press(getByText("Send Request"));

    await waitFor(() => {
      expect(getByText("Friend request sent!")).toBeTruthy();
    });
  });

  it("calls acceptFriendRequest and updates list", async () => {
    (api.acceptFriendRequest as jest.Mock).mockResolvedValueOnce({});
    (api.getAllFriends as jest.Mock).mockResolvedValueOnce([...mockFriends, { id: 3, username: "newfriend" }]);

    const { getByText, queryByText } = renderWithNavigation(<FriendRequestsScreen />);
    await waitFor(() => getByText("alice"));

    fireEvent.press(getByText("Accept"));

    await waitFor(() => {
      expect(api.acceptFriendRequest).toHaveBeenCalledWith(1);
    }, { timeout: 1000 });

    expect(queryByText("alice")).toBeNull();
    expect(getByText("Friend request accepted!")).toBeTruthy();
  });

  it("calls rejectFriendRequest and updates list", async () => {
    (api.rejectFriendRequest as jest.Mock).mockResolvedValueOnce({});

    const { getByText, queryByText } = renderWithNavigation(<FriendRequestsScreen />);
    await waitFor(() => getByText("alice"));

    fireEvent.press(getByText("Reject"));

    await waitFor(() => {
      expect(api.rejectFriendRequest).toHaveBeenCalledWith(1);
      expect(queryByText("alice")).toBeNull();
      expect(getByText("Friend request rejected!")).toBeTruthy();
    });
  });
});
