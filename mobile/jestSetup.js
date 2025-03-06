import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

// Mock AsyncStorage globally
jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);
