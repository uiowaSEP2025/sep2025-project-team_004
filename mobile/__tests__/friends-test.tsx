import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FriendRequestsScreen from '../app/friends'; // update the path as needed
import { NavigationContext } from '@react-navigation/native';
import {
  sendFriendRequest,
  getPendingRequests,
  getAllFriends,
  acceptFriendRequest,
  rejectFriendRequest,
} from '@/app/api/friends';

// Mock expo-font to bypass native font loading
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: () => [true],
}));

// Mock @expo/vector-icons without referencing out-of-scope variables
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: (props: { name: string; size: number; color: string }) => {
      return React.createElement(Text, null, props.name);
    },
  };
});

// Mock the API functions
jest.mock('@/app/api/friends', () => ({
  sendFriendRequest: jest.fn(),
  getPendingRequests: jest.fn(),
  getAllFriends: jest.fn(),
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
}));

describe('FriendRequestsScreen', () => {
  const customNavigation = {
    goBack: jest.fn(),
  };

  // Provide default responses for the API mocks
  beforeEach(() => {
    jest.clearAllMocks();
    (getPendingRequests as jest.Mock).mockResolvedValue([
      {
        id: 1,
        from_user: 10,
        from_user_username: 'user1',
        to_user: 20,
        created_at: '2025-03-28T00:00:00Z',
      },
    ]);
    (getAllFriends as jest.Mock).mockResolvedValue([
      { id: 1, username: 'friend1' },
    ]);
    (sendFriendRequest as jest.Mock).mockResolvedValue({});
    (acceptFriendRequest as jest.Mock).mockResolvedValue({});
    (rejectFriendRequest as jest.Mock).mockResolvedValue({});
  });

  const renderComponent = () =>
    render(
      <NavigationContext.Provider value={customNavigation}>
        <FriendRequestsScreen />
      </NavigationContext.Provider>
    );

  it('renders header and tabs correctly', async () => {
    const { getByText } = renderComponent();
    // Header text
    expect(getByText('Friends')).toBeTruthy();
    // Tabs
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Add Friend')).toBeTruthy();
  });

  it('fetches pending requests and friends on mount', async () => {
    const { getByText } = renderComponent();
    // Wait for the pending request (user1) to be displayed
    await waitFor(() => {
      expect(getByText('user1')).toBeTruthy();
    });
    // Switch to "All" tab to verify friend list
    fireEvent.press(getByText('All'));
    await waitFor(() => {
      expect(getByText('friend1')).toBeTruthy();
    });
  });

  it('sends friend request and shows success modal', async () => {
    const { getByText, getByPlaceholderText, queryByText } = renderComponent();

    // Switch to "Add Friend" tab
    fireEvent.press(getByText('Add Friend'));

    // Type into the input and send a friend request
    const input = getByPlaceholderText('Search for a friend...');
    act(() => {
      fireEvent.changeText(input, 'newFriend');
    });
    const sendButton = getByText('Send Request');
    await act(async () => {
      fireEvent.press(sendButton);
    });

    // Verify that the API was called with the trimmed search term and that the modal shows a success message
    await waitFor(() => {
      expect(sendFriendRequest).toHaveBeenCalledWith('newFriend');
      expect(getByText('Friend request sent!')).toBeTruthy();
    });

    // Dismiss modal
    fireEvent.press(getByText('OK'));
    await waitFor(() => {
      expect(queryByText('Friend request sent!')).toBeNull();
    });
  });

  it('accepts a friend request and updates UI', async () => {
    const { getByText, queryByText } = renderComponent();

    // Wait for pending request (user1) to be rendered
    await waitFor(() => {
      expect(getByText('user1')).toBeTruthy();
    });

    // Press the Accept button
    const acceptButton = getByText('Accept');
    await act(async () => {
      fireEvent.press(acceptButton);
    });

    // Check that the accept API is called and that the modal shows the success message
    await waitFor(() => {
      expect(acceptFriendRequest).toHaveBeenCalledWith(1);
      expect(getByText('Friend request accepted!')).toBeTruthy();
    });

    // Dismiss modal
    fireEvent.press(getByText('OK'));
    await waitFor(() => {
      expect(queryByText('Friend request accepted!')).toBeNull();
    });

    // Ensure the pending request has been removed from the UI
    await waitFor(() => {
      expect(queryByText('user1')).toBeNull();
    });
  });

  it('rejects a friend request and updates UI', async () => {
    const { getByText, queryByText } = renderComponent();

    // Wait for pending request (user1) to be rendered
    await waitFor(() => {
      expect(getByText('user1')).toBeTruthy();
    });

    // Press the Reject button
    const rejectButton = getByText('Reject');
    await act(async () => {
      fireEvent.press(rejectButton);
    });

    // Check that the reject API is called and that the modal shows the rejection message
    await waitFor(() => {
      expect(rejectFriendRequest).toHaveBeenCalledWith(1);
      expect(getByText('Friend request rejected!')).toBeTruthy();
    });

    // Dismiss modal
    fireEvent.press(getByText('OK'));
    await waitFor(() => {
      expect(queryByText('Friend request rejected!')).toBeNull();
    });

    await waitFor(() => {
      expect(queryByText('user1')).toBeNull();
    });
  });

  it('navigates back when the back button is pressed', () => {
    const { getByText } = renderComponent();

    const backButton = getByText('arrow-back');
    fireEvent.press(backButton);
    expect(customNavigation.goBack).toHaveBeenCalled();
  });
});
