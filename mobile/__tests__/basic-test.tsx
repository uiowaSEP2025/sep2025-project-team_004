import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

const SimpleComponent = () => {
  return (
    <View>
      <Text>Hello, world!</Text>
    </View>
  );
};

describe('Basic Test', () => {
  it('renders correctly', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Hello, world!')).toBeTruthy();
  });
}); 