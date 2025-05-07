import React from 'react';
import { render } from '@testing-library/react-native';

// 🧠 Patch to disable reanimated's state-triggering behavior
jest.mock('react-native-reanimated', () => {
  return {
    ...jest.requireActual('react-native-reanimated/mock'),
    useDerivedValue: jest.fn(() => undefined),
    runOnJS: (fn: any) => fn,
  };
});

// ✅ Stable mocks with default values
let mockUseFont = jest.fn(() => ({}));
let mockUseChartPressState = jest.fn(() => ({
  state: {
    x: { value: { value: 'A' }, position: 5 },
    y: { y: { value: { value: 10 }, position: 15 } },
  },
  isActive: false,
}));

// 🧪 Mock Skia
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Circle: (props: any) => React.createElement(View, { ...props, testID: 'circle' }),
    useFont: () => mockUseFont(),
  };
});

// 🧪 Mock Victory Native
jest.mock('victory-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CartesianChart: (props: any) => {
      const fakePoints = { y: [{ x: 1, y: 2, position: 20 }] };
      return React.createElement(View, null, props.children({ points: fakePoints }));
    },
    Line: (props: any) => React.createElement(View, { ...props, testID: 'line' }),
    useChartPressState: () => mockUseChartPressState(),
  };
});

import SensorChart from '../app/SensorChart';

describe('SensorChart', () => {
  const sampleData = [
    { x: 'A', y: 10 },
    { x: 'B', y: 20 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFont = jest.fn(() => ({})); // default: font is loaded
    mockUseChartPressState = jest.fn(() => ({
      state: {
        x: { value: { value: sampleData[0].x }, position: 5 },
        y: { y: { value: sampleData[0].y }, position: 15 },
      },
      isActive: false,
    }));
  });

  it('returns null if font is not loaded yet', () => {
    mockUseFont = jest.fn(() => null);

    const { toJSON } = render(
      <SensorChart title="Loading" data={sampleData} color="blue" />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders title and Line but no Circle when inactive', () => {
    const { getByText, queryByTestId } = render(
      <SensorChart title="My Chart" data={sampleData} color="green" />
    );

    expect(getByText('My Chart')).toBeTruthy();
    expect(queryByTestId('line')).toBeTruthy();
    expect(queryByTestId('circle')).toBeNull();
  });

  it('renders a Circle when active', () => {
    mockUseChartPressState = jest.fn(() => ({
      state: {
        x: { value: { value: sampleData[0].x }, position: 5 },
        y: { y: { value: sampleData[0].y }, position: 15 },
      },
      isActive: true,
    }));

    const { queryByTestId } = render(
      <SensorChart title="Active Chart" data={sampleData} color="red" />
    );

    expect(queryByTestId('circle')).toBeTruthy();
  });
});
