// __tests__/login-test.tsx

// Mock your Firebase config import
jest.mock('../_utlis/firebaseConfig', () => ({
  app: {},
  firestore: {},
}));

// Mock all Firestore functions you use
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(), // ✅ make sure it's here!
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  increment: jest.fn(),
  deleteField: jest.fn(),
  serverTimestamp: jest.fn(),
  onSnapshot: jest.fn(),
}));

// ✅ Import Firestore after mock
import { getDoc } from 'firebase/firestore';
const mockedGetDoc = getDoc as jest.Mock;

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../app/index';

// Bring in additional Firestore mocks so TypeScript doesn’t complain
import { addDoc, updateDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';

// Mock React Navigation’s useNavigation()
const mockedNavigate = jest.fn();
const mockedReset = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockedNavigate,
      reset: mockedReset,
    }),
  };
});

// Mock AsyncStorage
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Helper to render your screen inside a NavigationContainer
const renderWithNavigation = () =>
  render(
    <NavigationContainer>
      <HomeScreen />
    </NavigationContainer>
  );

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId, getByText } = renderWithNavigation();

    expect(getByTestId('login-title')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByText('SIGN UP')).toBeTruthy();
  });

  it('updates email and password inputs', () => {
    const { getByTestId, getByDisplayValue } = renderWithNavigation();
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(getByDisplayValue('test@example.com')).toBeTruthy();
    expect(getByDisplayValue('password123')).toBeTruthy();
  });

  it('shows error when login is pressed with empty fields', async () => {
    const { getByTestId, queryByText } = renderWithNavigation();
    const loginButton = getByTestId('login-button');

    await act(async () => {
      fireEvent.press(loginButton);
    });

    await waitFor(() => {
      expect(queryByText('Both fields are required!')).toBeTruthy();
    });
  });

  it('navigates when register button is pressed', () => {
    const { getByTestId } = renderWithNavigation();
    const registerButton = getByTestId('register-button');

    fireEvent.press(registerButton);
    expect(mockedNavigate).toHaveBeenCalledWith('register');
  });

  it('logs in successfully with valid credentials', async () => {
    // Mock the login and user info API responses
    (global.fetch as jest.Mock) = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'dummy-token' }) }) // login
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, name: 'John Doe', username: 'john' }) }); // me

    // Mock Firestore's getDoc to simulate no existing user doc
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    const { getByTestId } = renderWithNavigation();

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');

    await act(async () => {
      fireEvent.press(getByTestId('login-button'));
    });

    // Check AsyncStorage calls
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'dummy-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'userInfo',
      JSON.stringify({ id: 1, name: 'John Doe', username: 'john' })
    );

    // Check navigation
    expect(mockedReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: '(tabs)', params: { screen: 'home' } }],
    });
  });

  it('shows error when login API returns invalid credentials', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    const { getByTestId, queryByText } = renderWithNavigation();

    fireEvent.changeText(getByTestId('email-input'), 'wrong@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'wrongpassword');

    await act(async () => {
      fireEvent.press(getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(queryByText('Invalid credentials. Please try again.')).toBeTruthy();
    });
  });

  it('shows error when an exception occurs during login', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockRejectedValue(new Error('Network error'));

    const { getByTestId, queryByText } = renderWithNavigation();

    fireEvent.changeText(getByTestId('email-input'), 'error@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');

    await act(async () => {
      fireEvent.press(getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(queryByText('Something went wrong. Please try again later.')).toBeTruthy();
    });
  });
});
