import "react-native-gesture-handler/jestSetup";

// Mocking Expo Vector Icons to prevent rendering errors
jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MockMaterialIcons",
  Feather: "MockFeather",
  Ionicons: "MockIonicons",
}));

// Properly Mock expo-font to prevent forEach error
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
  processFontFamily: jest.fn((font) => font),
}));

jest.mock('../assets/images/avatar-placeholder.png', () => 'avatar-placeholder.png');


// Mocking React Navigation (if used)
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mocking SafeAreaView for React Native Screens
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mocking AsyncStorage (if used in the app)
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));


jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));


// Fix Jest warnings related to timers
jest.useFakeTimers();
