// jest.setup.js

// 🌐 Global Polyfills for test environment
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (fn) => setTimeout(fn, 0);
}

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(() => fn(...args), 0);
}

// 🧠 React Native Environment Config
const Platform = require('react-native/Libraries/Utilities/Platform');
Platform.OS = 'web'; // Forces React Native to behave like Web

// 🎨 Mocks for React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// 🗃 AsyncStorage (Base + Extended)
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => ({
  ...mockAsyncStorage,
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn((key) => {
    if (key === 'authToken') return Promise.resolve('mock-auth-token');
    if (key === 'userInfo') {
      return Promise.resolve(JSON.stringify({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
      }));
    }
    return Promise.resolve(null);
  }),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

// 📱 Navigation Mocks
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      canGoBack: jest.fn().mockReturnValue(true),
    }),
    useFocusEffect: jest.fn((callback) => callback()),
  };
});

// 🔁 Repeated expo-router mock (deduped)
const mockUseRouter = jest.fn();
const mockUseLocalSearchParams = jest.fn(() => ({
  groupId: 'testGroupId',
  groupName: 'Test Group',
  groupImage: null,
  friends: JSON.stringify([{ id: 2, username: 'Friend1' }]),
}));
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

// 🔣 Expo constants & font mocks
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: 'localhost:8000',
  },
  Constants: {
    manifest: {
      extra: {
        apiUrl: 'http://localhost:8000',
      },
    },
  },
}));
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// 🧪 Firebase mocks
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
      return () => {}; // unsubscribe
    }),
  };
});

// 🔌 Firebase config aliases
jest.mock('_utlis/firebaseConfig', () => ({ firestore: {} }), { virtual: true });
jest.mock('app/_utlis/firebaseConfig', () => ({ firestore: {} }), { virtual: true });

// 🖼 Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: () => 'MaterialIcons',
  Feather: () => 'Feather',
  AntDesign: () => 'AntDesign',
  FontAwesome: () => 'FontAwesome',
  FontAwesome5: () => 'FontAwesome5',
  Ionicons: () => 'Ionicons',
}));

// 💳 Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    presentPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    createToken: jest.fn(() => Promise.resolve({ token: { id: 'test_token' } })),
  }),
  CardField: 'CardField',
}));

// 🧪 Native Animated Helper

// 🌐 Mock matchMedia for responsive hooks/components
if (typeof window !== 'undefined') {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// 🌍 Global fetch mock (Stripe & general use)
const originalFetch = global.fetch;
global.fetch = jest.fn((url, options) => {
  if (url?.includes('/api/payments/cards/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 'card_mock',
          brand: 'Visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          is_default: true,
        },
      ]),
    });
  }

  return originalFetch?.(url, options) ?? Promise.resolve({ json: () => Promise.resolve([]), ok: true });
});

// 🧽 Suppress noisy console errors
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (
      args[0].includes('Cannot find module') && args[0].includes('profile') ||
      args[0].includes('Error fetching default Stripe card') ||
      args[0].includes('Warning: An update to Profile inside a test') ||
      args[0].includes('not wrapped in act')
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};
