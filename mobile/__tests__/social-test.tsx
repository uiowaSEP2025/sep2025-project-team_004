// __tests__/social-test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SocialScreen from '../app/(tabs)/social';
import { useNavigation } from '@react-navigation/native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('SocialScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders header and search bar correctly', () => {
    const { getByText, getByPlaceholderText } = render(<SocialScreen />);
    expect(getByText('Stream Chat')).toBeTruthy();
    expect(getByPlaceholderText('Search')).toBeTruthy();
  });

  it('renders chat items correctly', () => {
    const { getByText } = render(<SocialScreen />);
    expect(getByText('Daniel Atkins')).toBeTruthy();
    expect(getByText('Erin, Ursula, Matthew')).toBeTruthy();
    expect(getByText('Photographers')).toBeTruthy();
  });

  it('displays the Compose button when expanded', () => {
    const { getByText } = render(<SocialScreen />);
    expect(getByText('Compose')).toBeTruthy();
  });

  it('navigates to ChatDetail when a chat item is pressed', () => {
    const { getByText } = render(<SocialScreen />);
    const chatName = getByText('Daniel Atkins');
    fireEvent.press(chatName);
    expect(mockNavigate).toHaveBeenCalledWith('ChatDetail', { userId: 1 });
  });
});
