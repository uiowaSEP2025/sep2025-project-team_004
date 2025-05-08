// __tests__/SettingsScreen.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';
import SettingsScreen from '../app/settings';
import { TouchableOpacity } from 'react-native';

describe('<SettingsScreen />', () => {
  let screen: ReturnType<typeof render>;

  beforeAll(() => {
    // If you get asset errors, add in your Jest setup:
    // jest.mock('@/assets/images/back-arrow.png', () => 1);
  });

  beforeEach(() => {
    screen = render(<SettingsScreen />);
  });

  it('renders the header with back button and title', () => {
    const { getByText, UNSAFE_getAllByType } = screen;
    expect(getByText('Settings')).toBeTruthy();

    // back button is a TouchableOpacity
    const tapps = UNSAFE_getAllByType(TouchableOpacity);
    // at least one TouchableOpacity (the back arrow)
    expect(tapps.length).toBeGreaterThanOrEqual(1);
  });

  it('shows personal information section with correct name & email', () => {
    const { getByText } = screen;
    expect(getByText('Personal Information')).toBeTruthy();
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Bruno Pham')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('bruno203@gmail.com')).toBeTruthy();
  });

  it('lists all preference options', () => {
    const { getByText } = screen;
    ['Sales', 'New Arrivals', 'Delivery Status'].forEach(label =>
      expect(getByText(label)).toBeTruthy()
    );
  });

  it('lists all help center options as touchables', () => {
    const { UNSAFE_getAllByType, getByText } = screen;
    // back button + 3 help items
    const allTaps = UNSAFE_getAllByType(TouchableOpacity);
    expect(allTaps).toHaveLength(4);

    ['FAQ', 'Contact Us', 'Privacy & Terms'].forEach(label =>
      expect(getByText(label)).toBeTruthy()
    );
  });

  it('matches snapshot', () => {
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
