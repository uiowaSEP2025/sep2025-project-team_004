import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocialScreen from '../app/(tabs)/social';
import { useInbox } from '../hooks/useInbox';
import { getOrCreateDM } from '../app/api/getorCreateDM';
import { Alert } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'localhost:19000' },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
    useFocusEffect: (cb: () => void) => useEffect(cb, []),
  };
});

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-group-id' })),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  getFirestore: jest.fn(() => ({})),
  getDoc: jest.fn(() =>
    Promise.resolve({ exists: () => true, data: () => ({ name: 'Test User', username: 'testuser' }) })
  ),
}));

jest.mock('../hooks/useInbox', () => ({ useInbox: jest.fn() }));
jest.mock('../app/api/getorCreateDM', () => ({ getOrCreateDM: jest.fn() }));

jest.mock('@expo/vector-icons', () => ({ MaterialIcons: 'MaterialIcons' }));
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

beforeEach(() => {
  jest.clearAllMocks();

  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
    if (key === 'userInfo') return Promise.resolve(JSON.stringify({ id: 1, username: 'Me' }));
    if (key === 'authToken') return Promise.resolve('fake-token');
    return Promise.resolve(null);
  });

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve([
        { id: 2, username: 'Alice', profilePicture: '' },
        { id: 3, username: 'Bob', profilePicture: '' },
      ]),
  });

  (useInbox as jest.Mock).mockReturnValue([
    {
      id: 'conv-1',
      type: 'dm',
      name: 'Alice',
      profilePicture: '',
      lastMessage: 'Hello!',
      lastUpdated: new Date().toISOString(),
      readCount: { 1: 0 },
    },
  ]);

  (getOrCreateDM as jest.Mock).mockResolvedValue('conv-1');
});

afterAll(() => {
  jest.restoreAllMocks();
});

jest.spyOn(Alert, 'prompt').mockImplementation((_title, _message, callback) => {
  if (typeof callback === 'function') {
    callback('Test Group');
  }
});

describe('SocialScreen', () => {
  it('renders header, search bar, and chat items', async () => {
    const { getByText, getByPlaceholderText } = render(<SocialScreen />);
    await waitFor(() => getByText('Chat'));

    expect(getByText('Chat')).toBeTruthy();
    expect(getByPlaceholderText('Search')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Hello!')).toBeTruthy();
  });

  it('navigates into a DM when tapping a chat item', async () => {
    const { getByText } = render(<SocialScreen />);
    await waitFor(() => getByText('Alice'));

    fireEvent.press(getByText('Alice'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/ChatDetail',
      params: {
        conversationId: 'conv-1',
        username: 'Alice',
        profilePicture: '',
      },
    });
  });

  it('creates a group chat when multiple friends are selected and group name is provided', async () => {
    const { getByText, getAllByText } = render(<SocialScreen />);
    await waitFor(() => getByText('Chat'));

    fireEvent.press(getByText('Compose'));
    expect(getByText('Select friends to chat with')).toBeTruthy();

    fireEvent.press(getAllByText('Alice')[1]);
    fireEvent.press(getByText('Bob'));
    fireEvent.press(getByText('Start'));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/GroupChatDetail',
        params: expect.objectContaining({
          groupName: 'Test Group',
        }),
      })
    );
  });

  it('displays unread badge when readCount for current user is greater than zero', async () => {
    (useInbox as jest.Mock).mockReturnValue([
      {
        id: 'conv-2',
        type: 'dm',
        name: 'Charlie',
        profilePicture: '',
        lastMessage: 'Hey!',
        lastUpdated: new Date().toISOString(),
        readCount: { 1: 2 },
      },
    ]);

    const { getByText } = render(<SocialScreen />);
    await waitFor(() => getByText('Charlie'));

    expect(getByText('2')).toBeTruthy();
  });

  it('displays the compose overlay and starts a 1:1 chat', async () => {
    const { getByText, getAllByText } = render(<SocialScreen />);
    await waitFor(() => getByText('Chat'));

    fireEvent.press(getByText('Compose'));
    expect(getByText('Select friends to chat with')).toBeTruthy();

    fireEvent.press(getAllByText('Alice')[1]);
    fireEvent.press(getByText('Start'));

    expect(getOrCreateDM).toHaveBeenCalledWith(1, 2);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/ChatDetail',
        params: {
          conversationId: 'conv-1',
          username: 'Alice',
          profilePicture: '',
        },
      })
    );
  });

  it('toggles header expansion based on scroll position', async () => {
    const { getByText, getByTestId } = render(<SocialScreen />);
    await waitFor(() => getByText('Chat'));

    const scrollView = getByTestId('chat-scrollview'); // ✅ Requires testID on ScrollView

    fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { y: 20 } },
    });

    expect(() => getByText('Compose')).toThrow();

    fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { y: 0 } },
    });

    expect(getByText('Compose')).toBeTruthy();
  });
});
