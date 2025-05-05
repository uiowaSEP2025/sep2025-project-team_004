import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

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
