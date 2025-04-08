import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import FriendRequestsScreen from "../app/friends";
import * as api from "@/app/api/friends";
import { useNavigation } from "@react-navigation/native";

const goBackMock = jest.fn();
const navigateMock = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

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

const mockPending = [
  { id: 1, from_user: 2, from_user_username: "alice", to_user: 1, created_at: "2024-01-01T00:00:00Z" },
];

const mockFriends = [
  { id: 2, username: "bob" },
];

describe("FriendRequestsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({
      goBack: goBackMock,
      navigate: navigateMock,
    });

    (api.getPendingRequests as jest.Mock).mockResolvedValue(mockPending);
    (api.getAllFriends as jest.Mock).mockResolvedValue(mockFriends);
  });

  it("renders header and tabs", async () => {
    const { getByText } = render(<FriendRequestsScreen />);
    expect(getByText("Friends")).toBeTruthy();
    expect(getByText("Pending")).toBeTruthy();
    expect(getByText("All")).toBeTruthy();
    expect(getByText("Add Friend")).toBeTruthy();
  });

  it("shows pending requests by default", async () => {
    const { getByText } = render(<FriendRequestsScreen />);
    await waitFor(() => {
      expect(getByText("alice")).toBeTruthy();
    });
  });

  it("switches to All tab and shows friends", async () => {
    const { getByText } = render(<FriendRequestsScreen />);
    fireEvent.press(getByText("All"));
    await waitFor(() => {
      expect(getByText("bob")).toBeTruthy();
    });
  });

  it("sends friend request and shows confirmation modal", async () => {
    (api.sendFriendRequest as jest.Mock).mockResolvedValueOnce({});

    const { getByPlaceholderText, getByText } = render(<FriendRequestsScreen />);
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

    const { getByText, queryByText } = render(<FriendRequestsScreen />);
    await waitFor(() => getByText("alice"));

    fireEvent.press(getByText("Accept"));

    await waitFor(() => {
      expect(api.acceptFriendRequest).toHaveBeenCalledWith(1);
      expect(queryByText("alice")).toBeNull();
      expect(getByText("Friend request accepted!")).toBeTruthy();
    });
  });

  it("calls rejectFriendRequest and updates list", async () => {
    (api.rejectFriendRequest as jest.Mock).mockResolvedValueOnce({});

    const { getByText, queryByText } = render(<FriendRequestsScreen />);
    await waitFor(() => getByText("alice"));

    fireEvent.press(getByText("Reject"));

    await waitFor(() => {
      expect(api.rejectFriendRequest).toHaveBeenCalledWith(1);
      expect(queryByText("alice")).toBeNull();
      expect(getByText("Friend request rejected!")).toBeTruthy();
    });
  });
});
