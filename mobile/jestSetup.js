import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

// Mock AsyncStorage globally
jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

// Mock Firebase modules directly
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(() => ({})),
  registerVersion: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
  setDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
  onSnapshot: jest.fn(() => jest.fn()),
  orderBy: jest.fn(() => ({})),
}));

// Create a virtual mock for any import of firebaseConfig
jest.mock('_utlis/firebaseConfig', () => ({
  firestore: {},
  initializeApp: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}), { virtual: true });

// Also mock with app/ prefix
jest.mock('app/_utlis/firebaseConfig', () => ({
  firestore: {},
  initializeApp: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}), { virtual: true });

// Mock for expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock for fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);
