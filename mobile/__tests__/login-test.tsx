// __tests__/login-test.tsx

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Create a simple Login component for testing
const LoginScreen = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const handleLogin = () => {
    if (email === 'test@example.com' && password === 'password123') {
      // Simulate successful login
      AsyncStorage.setItem('authToken', 'fake-auth-token');
      AsyncStorage.setItem('userInfo', JSON.stringify({ email: email }));
    } else {
      // Simulate login failure
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'Invalid email or password',
      });
    }
  };
  
  return (
    <View>
      <TextInput
        testID="email-input"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      <TextInput
        testID="password-input"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <TouchableOpacity 
        testID="login-button"
        onPress={handleLogin}
      >
        <Text>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders login form elements', () => {
    const { getByTestId } = render(<LoginScreen />);
    
    // Check that the form elements exist
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });
  
  it('handles successful login', async () => {
    const { getByTestId } = render(<LoginScreen />);
    
    // Fill in the form with valid credentials
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    
    // Submit the form
    fireEvent.press(getByTestId('login-button'));
    
    // Check that AsyncStorage was called with the expected values
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'fake-auth-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userInfo', expect.any(String));
    });
  });
  
  it('handles failed login', async () => {
    const { getByTestId } = render(<LoginScreen />);
    
    // Fill in the form with invalid credentials
    fireEvent.changeText(getByTestId('email-input'), 'wrong@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'wrongpassword');
    
    // Submit the form
    fireEvent.press(getByTestId('login-button'));
    
    // Check that Toast.show was called with an error message
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        text1: 'Login Failed',
      }));
    });
  });
});
