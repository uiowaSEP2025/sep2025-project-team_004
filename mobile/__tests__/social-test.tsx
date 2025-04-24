// __tests__/social-test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SocialScreen from '../app/(tabs)/social';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockImplementation((key) => {
    if (key === 'authToken') return Promise.resolve('dummy-token');
    if (key === 'userInfo') return Promise.resolve(JSON.stringify({ id: 1, username: 'testuser' }));
    return Promise.resolve(null);
  }),
  setItem: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
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

jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
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
    json: () => Promise.resolve({
      results: [
        {
          id: 1,
          conversation_id: "123",
          messages: [
            {
              content: 'Hey, how are you?',
              timestamp: '2023-04-15T10:30:00Z',
              sender: 2,
              recipient: 1,
              sender_username: 'Daniel Atkins',
              recipient_username: 'testuser',
              read: true
            }
          ]
        },
        {
          id: 2,
          conversation_id: "456",
          name: 'Photographers',
          is_group: true,
          messages: [
            {
              content: 'Meeting tomorrow at 10AM',
              timestamp: '2023-04-14T15:45:00Z',
              sender: 3,
              read: true
            }
          ]
        },
        {
          id: 3,
          conversation_id: "789",
          is_group: true,
          messages: [
            {
              content: 'Let\'s plan for the weekend',
              timestamp: '2023-04-13T09:20:00Z',
              sender: 3,
              sender_username: 'Erin',
              read: true
            },
            {
              content: 'Sounds good',
              timestamp: '2023-04-13T09:25:00Z',
              sender: 4,
              sender_username: 'Ursula',
              read: true
            },
            {
              content: 'I agree',
              timestamp: '2023-04-13T09:30:00Z',
              sender: 5,
              sender_username: 'Matthew',
              read: true
            }
          ]
        }
      ],
      next: null
    })
  })
);

describe('SocialScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'authToken') return Promise.resolve('dummy-token');
      if (key === 'userInfo') return Promise.resolve(JSON.stringify({ id: 1, username: 'testuser' }));
      return Promise.resolve(null);
    });
    jest.clearAllMocks();
  });

  it('renders header and search bar correctly', async () => {
    const { getByText, getByPlaceholderText } = render(<SocialScreen />);
    
    await waitFor(() => {
      expect(getByText('Chat')).toBeTruthy();
      expect(getByPlaceholderText('Search')).toBeTruthy();
    });
  });

  it('renders chat items correctly', async () => {
    const { getByText } = render(<SocialScreen />);
    
    await waitFor(() => {
      expect(getByText('Daniel Atkins')).toBeTruthy();
      expect(getByText('Matthew')).toBeTruthy();
      expect(getByText('Ursula')).toBeTruthy();
    });
  });

  it('displays the Compose button when expanded', async () => {
    const { getByText } = render(<SocialScreen />);
    
    await waitFor(() => {
      expect(getByText('Compose')).toBeTruthy();
    });
  });

  it('navigates to ChatDetail when a chat item is pressed', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('expo-router'), 'useRouter').mockImplementation(() => ({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    }));
    
    const { getByText } = render(<SocialScreen />);
    
    await waitFor(() => {
      const chatName = getByText('Daniel Atkins');
      fireEvent.press(chatName);
      expect(mockPush).toHaveBeenCalled();
    });
  });
});
