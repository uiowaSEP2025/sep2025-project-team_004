import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAdminOrders } from '../hooks/useAdminOrders'

beforeAll(() => {
  global.fetch = jest.fn()
})

describe('useAdminOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('groups results when token present', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('tok')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { id: 1, status: 'out_for_delivery', total_price:'5.00', created_at: new Date().toISOString(),
            stripe_payment_method_id:null, shipping_address:'', city:'', state:'', zip_code:'', tracking_number:null,
            user:{first_name:'',last_name:'',email:''}, items:[] },
          { id: 2, status: 'cancelled', total_price:'7.00', created_at: new Date().toISOString(),
            stripe_payment_method_id:null, shipping_address:'', city:'', state:'', zip_code:'', tracking_number:null,
            user:{first_name:'',last_name:'',email:''}, items:[] },
        ],
        next: null,
      }),
    })

    let ordersRef: any = {}
    let fetchOrdersRef: any
    let hasNextRef: boolean = false

    const TestComponent = () => {
      const { fetchOrders, orders, hasNext } = useAdminOrders('http://api')
      ordersRef = orders
      fetchOrdersRef = fetchOrders
      hasNextRef = hasNext
      return null
    }

    await act(async () => {
      TestRenderer.create(<TestComponent />)
    })

    let data: any
    await act(async () => {
      data = await fetchOrdersRef(1)
    })

    expect(data.next).toBeNull()
    expect(ordersRef['Out for Delivery'].map(o => o.id)).toEqual([1])
    expect(ordersRef['Canceled'].map(o => o.id)).toEqual([2])
    expect(hasNextRef).toBe(false)
  })
})
