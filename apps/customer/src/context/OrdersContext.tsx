import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Product, Variant } from '../mockData'
import type { Address } from './AuthContext'
import { useAuth } from './AuthContext'

export interface OrderItem {
  id: string
  product: Product
  variant: Variant
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  address: Address
  paymentMethod: string
  paymentStatus: 'paid' | 'pending'
  status: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'out for delivery' | 'delivered' | 'cancelled'
  timestamp: string
  shipment?: Shipment
}

export interface Shipment {
  id: string
  shiprocketOrderId?: string
  awb?: string
  courier?: string
  trackingUrl?: string
  status: string
}

interface OrdersContextType {
  orders: Order[]
  loading: boolean
  error: string | null
  addOrder: (orderData: { addressId: string; paymentMethod: 'online' | 'cod'; couponCode?: string }, idempotencyKey?: string) => Promise<string>
  cancelOrder: (id: string) => Promise<void>
  fetchOrders: () => Promise<void>
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapBackendOrderToFrontend = (o: any): Order => {
    const address = o.addressSnapshot || {}
    return {
      id: o.id,
      subtotal: o.subtotal / 100,
      discount: o.discount / 100,
      deliveryFee: o.shipping / 100,
      total: o.total / 100,
      address: {
        id: o.addressId || 'addr',
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        phone: address.phone || '',
        isDefault: false
      },
      paymentMethod: o.payments?.[0]?.method || 'Cash on Delivery',
      paymentStatus: o.paymentStatus === 'paid' ? 'paid' : 'pending',
      status: o.orderStatus === 'out_for_delivery' ? 'out for delivery' : o.orderStatus,
      timestamp: o.createdAt,
      shipment: o.shipments?.[0] ? {
        id: o.shipments[0].id,
        shiprocketOrderId: o.shipments[0].shiprocketOrderId || undefined,
        awb: o.shipments[0].awb || undefined,
        courier: o.shipments[0].courier || undefined,
        trackingUrl: o.shipments[0].trackingUrl || undefined,
        status: o.shipments[0].status
      } : undefined,
      items: o.items.map((item: any) => {
        const v = item.productVariant || {}
        const p = v.product || {}
        
        const mappedProduct: Product = {
          id: p.id || '',
          title: p.title || item.titleSnapshot,
          slug: p.slug || '',
          description: p.description || '',
          price: p.basePrice ? p.basePrice / 100 : item.priceSnapshot / 100,
          discountPrice: p.discountPrice ? p.discountPrice / 100 : item.priceSnapshot / 100,
          brand: p.brand?.name || 'Handcrafted',
          category: p.category?.name || 'Toys',
          ageGroup: p.ageGroup || '3-5 years',
          rating: p.rating || 5.0,
          stockStatus: v.stock > 0 ? 'In Stock' : 'Out of Stock',
          variants: p.variants ? p.variants.map((varOpt: any) => ({
            name: varOpt.attributes?.name || varOpt.name || 'Standard',
            stock: varOpt.stock
          })) : [],
          reviews: [],
          imageColor: 'bg-primary'
        }

        const mappedVariant: Variant = {
          name: v.attributes?.name || v.name || 'Standard',
          stock: v.stock || 0
        }

        return {
          id: item.id,
          product: mappedProduct,
          variant: mappedVariant,
          quantity: item.quantity
        }
      })
    }
  }

  const fetchOrders = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error('Failed to load orders')
      }
      const data = await res.json()
      const orderList = data.items || data.orders || []
      setOrders(orderList.map((o: any) => mapBackendOrderToFrontend(o)))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders()
    } else {
      setOrders([])
    }
  }, [isLoggedIn])

  const addOrder = async (orderData: { addressId: string; paymentMethod: 'online' | 'cod'; couponCode?: string }, idempotencyKey?: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      throw new Error('You must be signed in to place an order.')
    }

    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey
      }

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to place order.')
      }

      const order = await res.json()
      await fetchOrders() // refresh list
      return order.id
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cancelOrder = async (id: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel order.')
      }

      await fetchOrders() // refresh list
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <OrdersContext.Provider value={{ orders, loading, error, addOrder, cancelOrder, fetchOrders }}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrdersContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}
