/**
 * __tests__/TabLayout.test.tsx
 */
import React from 'react'
import { render } from '@testing-library/react-native'

// 1) Mock useColorScheme hook
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}))
// 2) Mock Colors
jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { tint: 'lightTint' },
    dark: { tint: 'darkTint' },
  },
}))
// 3) Mock HapticTab
jest.mock('@/components/HapticTab', () => ({
  HapticTab: () => null,
}))
// 4) Mock TabBarBackground
jest.mock('@/components/ui/TabBarBackground', () => () => null)
// 5) Mock IconSymbol
jest.mock('@/components/ui/IconSymbol', () => {
  const React = require('react')
  return {
    IconSymbol: (props: any) => React.createElement('IconSymbol', props),
  }
})
// 6) Mock expo-router’s Tabs
jest.mock('expo-router', () => {
  const React = require('react')
  const { View } = require('react-native')

  function Tabs(props: any) {
    return React.createElement(React.Fragment, null, props.children)
  }
  Tabs.Screen = ({ name }: { name: string }) =>
    React.createElement(View, { testID: `screen-${name}` })

  return { Tabs }
})

// 7) Import under test
import TabLayout from '../app/(tabs)/_layout'
import { useColorScheme } from '@/hooks/useColorScheme'

describe('TabLayout', () => {
  beforeEach(() => {
    ;(useColorScheme as jest.Mock).mockReturnValue('light')
  })

  it('renders all four tab screens', () => {
    const { getByTestId } = render(<TabLayout />)

    expect(getByTestId('screen-home')).toBeTruthy()
    expect(getByTestId('screen-store')).toBeTruthy()
    expect(getByTestId('screen-social')).toBeTruthy()
    expect(getByTestId('screen-profile')).toBeTruthy()
  })
})
