import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
const React = require('react');

// ===== MOCK REACT NATIVE / EXPO COMPONENTS =====

// Mock expo vector icons
jest.mock('@expo/vector-icons/Feather', () => 'Feather');
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve())
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: 'localhost:8000'
  },
  Constants: {
    manifest: {
      extra: {
        apiUrl: 'http://localhost:8000'
      }
    }
  }
}));

// Mock the native modules that might cause issues in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  shouldUseNativeDriver: jest.fn(() => false),
}), { virtual: true });

// ===== MOCK DATA STORAGE =====

// Override AsyncStorage mock with additional functionality
jest.mock("@react-native-async-storage/async-storage", () => ({
  ...mockAsyncStorage,
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn((key) => {
    if (key === 'authToken') {
      return Promise.resolve('mock-auth-token');
    }
    if (key === 'userInfo') {
      return Promise.resolve(JSON.stringify({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer'
      }));
    }
    return Promise.resolve(null);
  }),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null))
}));

// ===== MOCK FIREBASE =====
import 'react-native-gesture-handler/jestSetup';
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(() => ({})),
  registerVersion: jest.fn(),
}));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');

  return {
    ...actual,
    getFirestore: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    collection: jest.fn(() => ({})),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
    query: jest.fn(),
    where: jest.fn(),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    setDoc: jest.fn(() => Promise.resolve()),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    increment: jest.fn(() => 1),
    deleteField: jest.fn(() => 'deleted'),
    serverTimestamp: jest.fn(() => new Date()),

    onSnapshot: jest.fn((_query, callback) => {
      callback({ docs: [] });
      return () => {}; // unsubscribe mock
    }),
  };
});

// Mock firebaseConfig aliasing
jest.mock('_utlis/firebaseConfig', () => ({
  firestore: {},
}), { virtual: true });

jest.mock('app/_utlis/firebaseConfig', () => ({
  firestore: {},
}), { virtual: true });

// ===== MOCK EXPO ROUTER =====

// Mock for expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    groupId: 'testGroupId',
    groupName: 'Test Group',
    groupImage: null,
    friends: JSON.stringify([{ id: 2, username: 'Friend1' }]),
  }),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);

const mockUseRouter = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: mockUseRouter,
  useLocalSearchParams: mockUseLocalSearchParams,
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

global.mockUseRouter = mockUseRouter;
global.mockUseLocalSearchParams = mockUseLocalSearchParams;
// ===== MOCK FETCH =====

// Mock fetch API
const originalFetch = global.fetch;
global.fetch = jest.fn((url, options) => {
  // Mock Stripe card fetch response
  if (url && url.includes('/api/payments/cards/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 'card_mock',
          brand: 'Visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          is_default: true
        }
      ])
    });
  }
  
  // For other requests, use the original fetch or return a successful empty response
  if (originalFetch) {
    return originalFetch(url, options);
  }
  
  return Promise.resolve({
    json: () => Promise.resolve([]),
    ok: true
  });
});

// ===== MOCK PROBLEMATIC COMPONENTS =====

// Mock Profile component
jest.mock('./app/(tabs)/profile.tsx', () => function ProfileMock() { return null; }, { virtual: true });
jest.mock('./app/(tabs)/profile', () => function ProfileMock() { return null; }, { virtual: true });

// Mock the @stripe/stripe-react-native module
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    presentPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    createToken: jest.fn(() => Promise.resolve({ token: { id: 'test_token' } })),
  }),
  CardField: 'CardField',
}));

// ===== CONSOLE OVERRIDES =====

// Silence specific error messages
const originalError = console.error;
console.error = (...args) => {
  // Don't show errors related to profile component
  if (typeof args[0] === 'string' && 
     (args[0].includes('Cannot find module') && args[0].includes('profile') ||
      args[0].includes('Error fetching default Stripe card') ||
      args[0].includes('Warning: An update to Profile inside a test') ||
      args[0].includes('not wrapped in act'))) {
    return;
  }
  originalError(...args);
};
