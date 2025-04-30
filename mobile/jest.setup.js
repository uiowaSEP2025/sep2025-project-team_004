// Set up global mocks for Jest tests

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: 'localhost:8081',
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Link: () => 'Link',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: () => 'MaterialIcons',
  Feather: () => 'Feather',
  AntDesign: () => 'AntDesign',
  FontAwesome: () => 'FontAwesome',
  FontAwesome5: () => 'FontAwesome5',
  Ionicons: () => 'Ionicons',
}));

// Mock for navigation
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

// Setup for Platform
const Platform = require('react-native/Libraries/Utilities/Platform');
Platform.OS = 'web'; // Default to web for tests

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock window.matchMedia
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

// Suppress expected console errors in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific warning messages or pass through to original console.error
  if (args[0]?.includes?.('Warning:')) {
    return;
  }
  originalConsoleError(...args);
};

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
); 