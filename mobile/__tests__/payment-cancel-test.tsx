import React from 'react';
import { render } from '@testing-library/react-native';
import PaymentCancelScreen from '../app/payment-cancel';

describe('PaymentCancelScreen', () => {
  it('renders the cancellation message correctly', () => {
    const { getByText } = render(<PaymentCancelScreen />);
    expect(getByText('Payment was canceled.')).toBeTruthy();
  });

  it('has the correct style for the container and text', () => {
    const { getByText } = render(<PaymentCancelScreen />);
    const textElement = getByText('Payment was canceled.');

    expect(textElement.props.style).toEqual(
      expect.objectContaining({ fontSize: 18, color: '#FF3B30' })
    );
  });
});
