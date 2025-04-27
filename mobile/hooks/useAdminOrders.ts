// src/hooks/useAdminOrders.ts
import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type OrderStatus = 'Out for Delivery' | 'Processing' | 'Canceled'

export interface OrderDetail {
  id: number
  stripe_payment_method_id: string | null
  shipping_address: string
  city: string
  state: string
  zip_code: string
  total_price: string
  status: string
  tracking_number: string | null
  created_at: string
  user: { first_name: string; last_name: string; email: string }
  items: { product_name: string; product_price: string; quantity: number }[]
}

type ApiResponse = {
  results: Omit<OrderDetail, 'status'> & { status: string }[]
  next: any
}

export function useAdminOrders(apiBase: string) {
  const [orders, setOrders] = useState<Record<OrderStatus, OrderDetail[]>>({
    'Out for Delivery': [],
    Processing: [],
    Canceled: [],
  })
  const [loading, setLoading] = useState(false)
  const [hasNext, setHasNext] = useState(true)

  const fetchOrders = useCallback(
    async (pageNum = 1) => {
      const token = await AsyncStorage.getItem('authToken')
      if (!token) return null

      setLoading(true)
      const res = await fetch(
        `${apiBase}/api/store/orders/admin/?page=${pageNum}`,
        { headers: { Authorization: `Token ${token}` } }
      )
      const data: ApiResponse = await res.json()
      setLoading(false)
      setHasNext(Boolean(data.next))

      // group by our friendly labels
      const grouped: Record<OrderStatus, OrderDetail[]> = {
        'Out for Delivery': [],
        Processing: [],
        Canceled: [],
      }

      for (const o of data.results) {
        const key: OrderStatus =
          o.status === 'out_for_delivery'
            ? 'Out for Delivery'
            : o.status === 'cancelled'
            ? 'Canceled'
            : 'Processing'
        grouped[key].push({ ...o, status: o.status })
      }

      setOrders(prev =>
        pageNum === 1
          ? grouped
          : {
              'Out for Delivery': [...prev['Out for Delivery'], ...grouped['Out for Delivery']],
              Processing: [...prev.Processing, ...grouped.Processing],
              Canceled: [...prev.Canceled, ...grouped.Canceled],
            }
      )

      return data
    },
    [apiBase]
  )

  const completeOrder = useCallback(
    async (orderId: number, tracking: string) => {
      const token = await AsyncStorage.getItem('authToken')
      if (!token) throw new Error('no token')

      const res = await fetch(
        `${apiBase}/api/store/orders/update/${orderId}/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'out_for_delivery',
            tracking_number: tracking,
          }),
        }
      )
      if (!res.ok) throw new Error('update failed')
      const updated: OrderDetail = await res.json()

      // move into Out for Delivery
      setOrders(prev => {
        const copy = { ...prev }
        // remove from Processing
        copy.Processing = copy.Processing.filter(o => o.id !== updated.id)
        // add to Out for Delivery
        copy['Out for Delivery'] = [
          ...copy['Out for Delivery'],
          { ...updated, status: 'out_for_delivery' },
        ]
        return copy
      })
      return updated
    },
    [apiBase]
  )

  return { orders, loading, hasNext, fetchOrders, completeOrder }
}
