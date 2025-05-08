// ✅ 1) Set ENV before anything else
process.env.EXPO_PUBLIC_DEV_FLAG = 'false';
process.env.EXPO_PUBLIC_BACKEND_URL = 'https://backend.test';

// ✅ 2) Shared mock for navigation.goBack
const mockGoBack = jest.fn();

// ✅ 3) Hoisted module mocks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props: any) => React.createElement(View, props),
  };
});

// ✅ 4) Stub fetch globally
global.fetch = jest.fn();

// ✅ 5) Imports (after ENV & mocks)
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import AddCardWebview from '../app/add-card-webview'; // Adjust if needed

describe('AddCardWebview', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (fetch as jest.Mock).mockClear();
    jest.spyOn(Alert, 'alert').mockClear();
  });

  it('renders a loading spinner when no authToken', () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<AddCardWebview />);
    });

    expect(tree!.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  });

  

  it('on payment-success calls goBack() twice and shows a success alert', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('fake-token');
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ checkout_url: 'any' }),
    });

    const alertSpy = jest.spyOn(Alert, 'alert');

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AddCardWebview />);
    });

    const wvs = tree!.root.findAllByType(WebView);
    act(() => {
      wvs[0].props.onNavigationStateChange({
        url: 'https://backend.test/payment-success',
      });
    });

    expect(mockGoBack).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith(
      'Success',
      'Your payment method has been saved.'
    );
  });

  it('on payment-cancel calls goBack() once', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('fake-token');
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ checkout_url: 'any' }),
    });

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AddCardWebview />);
    });

    const wvs = tree!.root.findAllByType(WebView);
    act(() => {
      wvs[0].props.onNavigationStateChange({
        url: 'https://backend.test/payment-cancel',
      });
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
