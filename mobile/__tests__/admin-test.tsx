import React from 'react'
import { render, waitFor, screen } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import AdminOrders from '../app/admin-orders'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      hostUri: 'localhost:19000',
    },
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  process.env.EXPO_PUBLIC_DEV_FLAG = 'true'
  process.env.EXPO_PUBLIC_BACKEND_URL = 'http://test-backend.com'
  global.fetch = jest.fn()
})

it('renders order data into AdminOrders screen', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('tok')

  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      results: [
        {
          id: 1,
          status: 'out_for_delivery',
          total_price: '10.00',
          created_at: new Date().toISOString(),
          stripe_payment_method_id: null,
          shipping_address: '',
          city: '',
          state: '',
          zip_code: '',
          tracking_number: null,
          user: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
          items: [],
        },
      ],
      next: null,
    }),
  })

  render(
    <NavigationContainer>
      <AdminOrders />
    </NavigationContainer>
  )

  await waitFor(() => {
    expect(screen.getByText(/Order #1/)).toBeTruthy()
  })
})
