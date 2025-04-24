import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

// Mock AsyncStorage globally
jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock('../_utlis/firebaseConfig', () => ({
  firestore: {},
  initializeApp: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);
