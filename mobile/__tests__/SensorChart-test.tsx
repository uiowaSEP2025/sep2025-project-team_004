import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated/mock');
  return {
    ...actual,
    useDerivedValue: jest.fn(), // Controlled in test
    runOnJS: (fn: any) => fn,
  };
});

import { useDerivedValue } from 'react-native-reanimated';

let mockUseFont = jest.fn(() => ({}));
let mockUseChartPressState = jest.fn();

jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Circle: (props: any) => React.createElement(View, { ...props, testID: 'circle' }),
    useFont: () => mockUseFont(),
  };
});

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

  let callback: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFont = jest.fn(() => ({}));

    (useDerivedValue as jest.Mock).mockImplementation((cb) => {
      callback = cb;
    });
  });

  it('returns null if font is not loaded yet', () => {
    mockUseFont = jest.fn(() => null);
    mockUseChartPressState = jest.fn(() => ({
      state: {
        x: { value: { value: 'X' }, position: 0 },
        y: { y: { value: { value: 0 } }, position: 0 },
      },
      isActive: false,
    }));

    const { toJSON } = render(
      <SensorChart title="Loading" data={sampleData} color="blue" />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders title and Line but no Circle when inactive', () => {
    mockUseChartPressState = jest.fn(() => ({
      state: {
        x: { value: { value: sampleData[0].x }, position: 5 },
        y: { y: { value: { value: sampleData[0].y } }, position: 15 },
      },
      isActive: false,
    }));

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

  describe('tooltip behavior', () => {
    it('shows tooltip when active with valid values', async () => {
      mockUseChartPressState = jest.fn(() => ({
        state: {
          x: { value: { value: 'A' }, position: 5 },
          y: { y: { value: { value: 10 } }, position: 15 },
        },
        isActive: true,
      }));

      const { getByText } = render(
        <SensorChart title="Temp" data={sampleData} color="blue" />
      );

      // Wait for the render to complete before calling the callback
      await waitFor(() => {
        callback(); // Simulate chart press state update
        expect(getByText(/Time: A/)).toBeTruthy();
        expect(getByText(/Temp: 10.0/)).toBeTruthy();
      });
    });

    it('hides tooltip when active but values undefined', async () => {
      mockUseChartPressState = jest.fn(() => ({
        state: {
          x: { value: { value: undefined }, position: 5 },
          y: { y: { value: { value: undefined } }, position: 15 },
        },
        isActive: true,
      }));

      const { queryByText } = render(
        <SensorChart title="Temp" data={sampleData} color="blue" />
      );

      await waitFor(() => {
        callback();
        expect(queryByText(/Time:/)).toBeNull();
      });
    });

    it('hides tooltip when inactive', async () => {
      mockUseChartPressState = jest.fn(() => ({
        state: {
          x: { value: { value: 'B' }, position: 5 },
          y: { y: { value: { value: 20 } }, position: 15 },
        },
        isActive: false,
      }));

      const { queryByText } = render(
        <SensorChart title="Temp" data={sampleData} color="blue" />
      );

      await waitFor(() => {
        callback();
        expect(queryByText(/Time:/)).toBeNull();
      });
    });
  });
});
