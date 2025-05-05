import React from 'react';
import { render } from '@testing-library/react-native';
import NotFoundScreen from '../app/+not-found';

// ✅ Declare these inside the mock factory to satisfy Jest's restrictions
jest.mock('@/components/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }: any) => <Text>{children}</Text>,
  };
});

jest.mock('@/components/ThemedView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ThemedView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Link: ({ children }: any) => <Text accessibilityRole="link">{children}</Text>,
    Stack: {
      Screen: () => null,
    },
  };
});

describe('NotFoundScreen', () => {
  it('renders title and link to home screen', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText("This screen doesn't exist.")).toBeTruthy();
    expect(getByText('Go to home screen!')).toBeTruthy();
  });
});
