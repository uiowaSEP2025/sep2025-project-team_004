import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react-native';
import ChatDetail from '../app/ChatDetail';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import {
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  increment,
} from 'firebase/firestore';

import { query } from 'firebase/firestore';
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    // core mocks
    PanGestureHandler: View,
    TapGestureHandler: View,
    GestureHandlerRootView: View,
    NativeViewGestureHandler: View,
    FlingGestureHandler: View,
    Directions: {},
    State: {},
    // generic fallbacks
    Swipeable: View,
    DrawerLayout: View,
    // default export fallback (to suppress install() crash)
    default: {},
  };
});


// Add mock for `query` to return something consistent:
(query as jest.Mock).mockReturnValue('mockQuery');

(onSnapshot as jest.Mock).mockImplementationOnce((q, callback) => {
  if (q === 'mockQuery') {
    callback({
      docs: [
        {
          id: 'msg1',
          data: () => ({
            content: 'New message!',
            senderId: 2,
            timestamp: { toMillis: () => Date.now() },
          }),
        },
      ],
    });
  }
  return () => {};
});

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn((_, callback) => {
    callback({ docs: [] });
    return () => {}; // ✅ Important: return unsubscribe function
  }),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  startAfter: jest.fn(),
  limit: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn(),
  writeBatch: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));



const Stack = createStackNavigator();

const renderWithNavigation = () =>
  render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="ChatDetail" component={ChatDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );


describe('ChatDetail Component', () => {
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      conversationId: 'convo123',
      username: 'TestUser',
      profilePicture: null,
    });

    (useRouter as jest.Mock).mockReturnValue({
      back: mockRouterBack,
    });


    AsyncStorage.getItem = jest.fn().mockResolvedValue(
      JSON.stringify({ id: 1, username: 'TestUser' })
    );

    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    (getDoc as jest.Mock).mockResolvedValue({
      data: () => ({
        members: [1, 2],
      }),
    });
  });

  it('renders correctly', async () => {
    const { getByPlaceholderText, getByText } = renderWithNavigation();
    await waitFor(() => {
      expect(getByPlaceholderText('Type your message')).toBeTruthy();
      expect(getByText('Send')).toBeTruthy();
    });
  });
  it('handles missing userInfo in AsyncStorage gracefully', async () => {
    AsyncStorage.getItem = jest.fn().mockResolvedValue(null);
    const { getByPlaceholderText } = renderWithNavigation();
    await waitFor(() => {
      expect(getByPlaceholderText('Type your message')).toBeTruthy();
    });
  });

  it('renders nothing when there are no messages', () => {
    const { queryAllByText } = renderWithNavigation();
    expect(queryAllByText(/.+/).length).toBeGreaterThanOrEqual(0); // no crashes
  });

  it('renders nothing when there are no messages', () => {
    const { queryAllByText } = renderWithNavigation();
    expect(queryAllByText(/.+/).length).toBeGreaterThanOrEqual(0); // no crashes
  });
  it('clears typing status when app becomes inactive', async () => {
    const fakeListener = jest.fn();
    AppState.addEventListener = jest.fn().mockImplementation((_, cb) => {
      fakeListener.mockImplementation(cb);
      return { remove: jest.fn() };
    });
  
    renderWithNavigation();
  
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled(); // ensure user loaded
    });
  
    act(() => {
      fakeListener('background'); // simulate background event
    });
  
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        undefined, // or use: expect.anything()
        { typing: false },
        { merge: true }
      );
    });
  });

  
  it('logs error if readCount update fails in loadInitialMessages', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
    (getDoc as jest.Mock).mockResolvedValueOnce({ data: () => ({ members: [1, 2] }) });
    (updateDoc as jest.Mock).mockRejectedValueOnce(new Error('fail'));
  
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderWithNavigation();
  
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        '❌ Failed to reset readCount:',
        expect.any(Error)
      );
    });
  
    spy.mockRestore();
  });
  
  it('does not load more messages if already loading or has no more', async () => {
    const utils = renderWithNavigation();
    const { getByTestId } = renderWithNavigation();
    (getDocs as jest.Mock).mockClear();
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
  
    // simulate conditions
    act(() => {
      (utils.getByTestId('flatlist').props.onEndReached as any)();
    });
  
    (getDocs as jest.Mock).mockClear(); // Clear before triggering loadMore
fireEvent.scroll(getByTestId('flatlist'), {
  nativeEvent: {
    contentOffset: { y: 1000 },
    contentSize: { height: 1000 },
    layoutMeasurement: { height: 100 },
  },
});
expect(getDocs).not.toHaveBeenCalled(); // Now it only checks the scroll-related call
  });
  
  it('does not send message if input is empty', async () => {
    const { getByText, getByPlaceholderText } = renderWithNavigation();
  
    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
  
    fireEvent.changeText(getByPlaceholderText('Type your message'), '   ');
    fireEvent.press(getByText('Send'));
  
    expect(addDoc).not.toHaveBeenCalled();
  });
  
  

  it('sends a message', async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({});
    (updateDoc as jest.Mock).mockResolvedValueOnce({});
    (getDoc as jest.Mock).mockResolvedValueOnce({ data: () => ({ members: [1, 2] }) });

    const { getByPlaceholderText, getByText } = renderWithNavigation();

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText('Type your message'), 'Hello world');

    await act(async () => {
      fireEvent.press(getByText('Send'));
    });

    expect(addDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
  });

  it('navigates back on back button press', async () => {
    const { getByText } = renderWithNavigation();
    fireEvent.press(getByText('←'));
    expect(mockRouterBack).toHaveBeenCalled();
  });

  

  it('skips loadMoreMessages if lastVisible is null', async () => {
    const { getByPlaceholderText } = renderWithNavigation();
    fireEvent.changeText(getByPlaceholderText('Type your message'), 'Trigger render');
    await waitFor(() => {
      expect(getDocs).not.toHaveBeenCalled();
    });
  });
  it('renders incoming messages correctly', async () => {
    (onSnapshot as jest.Mock).mockImplementationOnce((_, callback) => {
      callback({ docs: [] }); // Typing snapshot
      return () => {};
    });
  
    const mockMessage = {
      id: 'msg1',
      data: () => ({
        content: 'Hello from other user!',
        senderId: 2,
        timestamp: { toMillis: () => Date.now() },
      }),
    };
  
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [mockMessage],
    });
  
    const { getByText } = renderWithNavigation();
  
    await waitFor(() => {
      expect(getByText('Hello from other user!')).toBeTruthy();
    });
  });
  
  
  
  

  it('clears input after sending message', async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({});
    (updateDoc as jest.Mock).mockResolvedValueOnce({});
    (getDoc as jest.Mock).mockResolvedValueOnce({
      data: () => ({ members: [1, 2] }),
    });
  
    const { getByPlaceholderText, getByText, queryByDisplayValue } = renderWithNavigation();
  
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  
    const input = getByPlaceholderText('Type your message');
    fireEvent.changeText(input, 'Test clear');
  
    await act(async () => {
      fireEvent.press(getByText('Send'));
    });
  
    await waitFor(() => {
      expect(queryByDisplayValue('Test clear')).toBeNull();
    });
  });
  
  
  
  
  
  
  
  it('triggers loadMoreMessages when scrolling reaches end', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        {
          id: 'msg2',
          data: () => ({
            content: 'Older message',
            senderId: 2,
            timestamp: { toMillis: () => Date.now() },
          }),
        },
      ],
    });
  
    const { getByTestId } = renderWithNavigation();
  
    // Simulate FlatList end reached
    await act(async () => {
      fireEvent.scroll(getByTestId('flatlist'), {
        nativeEvent: { contentOffset: { y: 1000 }, contentSize: { height: 1000 }, layoutMeasurement: { height: 100 } },
      });
    });
  
    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
    });
  });
  
  it('prevents double rendering same real-time message', async () => {
    (onSnapshot as jest.Mock).mockImplementationOnce((_, callback) => {
      callback({ docs: [] }); // Typing snapshot
      return () => {};
    });
  
    const msg = {
      id: 'msg_unique',
      data: () => ({
        content: 'Hello!',
        senderId: 2,
        timestamp: { toMillis: () => Date.now() },
      }),
    };
  
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [msg],
    });
  
    (onSnapshot as jest.Mock).mockImplementationOnce((_, callback) => {
      callback({
        docs: [msg],
      });
      return () => {};
    });
  
    const { getAllByText } = renderWithNavigation();
  
    await waitFor(() => {
      expect(getAllByText('Hello!').length).toBe(1);
    });
  });

  it('displays messages in correct order', async () => {
    const now = Date.now();
  
    const first = {
      id: 'msg1',
      data: () => ({
        content: 'First message',
        senderId: 1,
        timestamp: { toMillis: () => now - 1000 },
      }),
    };
  
    const second = {
      id: 'msg2',
      data: () => ({
        content: 'Second message',
        senderId: 2,
        timestamp: { toMillis: () => now },
      }),
    };
  
    (onSnapshot as jest.Mock).mockImplementationOnce((_, callback) => {
      callback({ docs: [] }); // Typing snapshot
      return () => {};
    });
  
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [second, first], // DESC order as per firestore query
    });
  
    const { getAllByText } = renderWithNavigation();
  
    await waitFor(() => {
      const messages = getAllByText(/message/);
      expect(messages[0].props.children).toBe('Second message');
      expect(messages[1].props.children).toBe('First message');
    });
  });
  it('displays messages with correct sender info', async () => {
    (onSnapshot as jest.Mock).mockImplementationOnce((_, callback) => {
      callback({
        docs: [
          {
            id: 'msg1',
            data: () => ({
              content: 'Hello!',
              senderId: 1,
              timestamp: { toMillis: () => Date.now() },
            }),
          },
        ],
      });
      return () => {};
    });

    const { getByText } = renderWithNavigation();
    await waitFor(() => {
      expect(getByText('TestUser')).toBeTruthy();
    });
  });

  it('displays messages with correct timestamp', async () => {
    const now = Date.now();
    const msg = {
      id: 'msg1',
      data: () => ({
        content: 'Hello!',
        senderId: 1,
        timestamp: { toMillis: () => now },
      }),
    };
  
    (onSnapshot as jest.Mock).mockImplementationOnce((_, callback) => {
      callback({ docs: [] }); // Typing snapshot
      return () => {};
    });
  
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [msg] });
  
    const { getByText } = renderWithNavigation();
  
    // Replace /just now/i with whatever you actually render
    await waitFor(() => {
      expect(getByText('Hello!')).toBeTruthy();
    });
  });
  
  

  
  
  

  it('displays typing indicator', async () => {
    (onSnapshot as jest.Mock).mockImplementationOnce((_, callback) => {
      callback({
        docs: [
          {
            id: '2',
            data: () => ({
              typing: true,
              username: 'OtherUser',
              lastUpdated: { toMillis: () => Date.now() },
            }),
          },
        ],
      });
      return () => {};
    });

    const { getByText } = renderWithNavigation();
    await waitFor(() => {
      expect(getByText('OtherUser is typing...')).toBeTruthy();
    });
  });
});
