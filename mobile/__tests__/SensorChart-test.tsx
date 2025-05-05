/**
 * __tests__/SensorChart.test.tsx
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// ---- Mock before importing component ----
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Circle: (props: any) => React.createElement(View, { ...props, testID: 'circle' }),
    useFont: jest.fn(),
  };
});

jest.mock('victory-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CartesianChart: (props: any) => {
      // supply dummy points so children render without error
      const fakePoints = { y: [{ x: 1, y: 2, position: 20 }] };
      return React.createElement(View, null, props.children({ points: fakePoints }));
    },
    Line: (props: any) => React.createElement(View, { ...props, testID: 'line' }),
    useChartPressState: jest.fn(),
  };
});

import SensorChart from '../app/SensorChart';
import { useFont } from '@shopify/react-native-skia';
import { useChartPressState } from 'victory-native';

describe('SensorChart', () => {
  const sampleData = [
    { x: 'A', y: 10 },
    { x: 'B', y: 20 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if font is not loaded yet', () => {
    (useFont as jest.Mock).mockReturnValue(null);
    (useChartPressState as jest.Mock).mockReturnValue({
      state: {
        x: { value: { value: undefined }, position: 0 },
        y: { y: { value: { value: undefined }, position: 0 } },
      },
      isActive: false,
    });

    const { toJSON } = render(
      <SensorChart title="Loading" data={sampleData} color="blue" />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders title and Line but no Circle when inactive', () => {
    (useFont as jest.Mock).mockReturnValue({});
    (useChartPressState as jest.Mock).mockReturnValue({
      state: {
        x: { value: { value: sampleData[0].x }, position: 5 },
        y: { y: { value: { value: sampleData[0].y }, position: 15 } },
      },
      isActive: false,
    });

    const { getByText, queryByTestId } = render(
      <SensorChart title="My Chart" data={sampleData} color="green" />
    );

    expect(getByText('My Chart')).toBeTruthy();
    expect(queryByTestId('line')).toBeTruthy();
    expect(queryByTestId('circle')).toBeNull();
  });

  it('renders a Circle when active', () => {
    (useFont as jest.Mock).mockReturnValue({});
    (useChartPressState as jest.Mock).mockReturnValue({
      state: {
        x: { value: { value: sampleData[0].x }, position: 5 },
        y: { y: { value: { value: sampleData[0].y }, position: 15 } },
      },
      isActive: true,
    });

    const { queryByTestId } = render(
      <SensorChart title="Active Chart" data={sampleData} color="red" />
    );

    expect(queryByTestId('circle')).toBeTruthy();
  });
});
