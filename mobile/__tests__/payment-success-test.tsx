/**
 * __tests__/PaymentSuccessScreen.test.tsx
 */
import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import PaymentSuccessScreen from '../app/payment-success';

// 1) Test-file scoped mocks (names prefixed “mock” so Jest will allow them)
const mockUseRouter = jest.fn();
const mockUseLocalSearchParams = jest.fn();

// 2) Mock expo-router using those mocks inside the factory
jest.mock('expo-router', () => {
  return {
    useRouter: () => mockUseRouter(),
    useLocalSearchParams: () => mockUseLocalSearchParams(),
  };
});

// 3) Stub global.fetch
global.fetch = jest.fn();

describe('<PaymentSuccessScreen />', () => {
  const replaceFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // By default, useRouter() returns an object with replace()
    mockUseRouter.mockReturnValue({ replace: replaceFn });
  });

  it('renders the verifying message and spinner', () => {
    mockUseLocalSearchParams.mockReturnValue({ session_id: undefined });
    const { getByText, UNSAFE_getByType } = render(<PaymentSuccessScreen />);

    expect(getByText('Verifying payment...')).toBeTruthy();
    // ActivityIndicator by type
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('confirms session and navigates on success', async () => {
    mockUseLocalSearchParams.mockReturnValue({ session_id: 'ABC123' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'ok' }),
    });

    render(<PaymentSuccessScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/payment/confirm-checkout-session/?session_id=ABC123'
        )
      );
      expect(replaceFn).toHaveBeenCalledWith('/payment-method');
    });
  });

  it('does not call fetch or navigate if no session_id', async () => {
    mockUseLocalSearchParams.mockReturnValue({ session_id: undefined });

    render(<PaymentSuccessScreen />);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
      expect(replaceFn).not.toHaveBeenCalled();
    });
  });

  it('does not navigate on failed confirmation', async () => {
    mockUseLocalSearchParams.mockReturnValue({ session_id: 'BAD123' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'fail' }),
    });

    render(<PaymentSuccessScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(replaceFn).not.toHaveBeenCalled();
    });
  });
});
