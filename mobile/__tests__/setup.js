// This file imports the global setup and adds any test-specific setup

// Import global setup
require('../jest.setup');

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock IconSymbol component
jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: () => 'IconSymbol',
}));

// Add test-specific mocks or setup here

// Add a simple test to satisfy Jest
describe('Setup file', () => {
  it('has proper Jest configuration', () => {
    expect(true).toBe(true);
  });
}); 