import { Order, OrderItem, ProductVariant, Product } from '@prisma/client'

export class ShiprocketService {
  private static cachedToken: string | null = null
  private static tokenExpiry: number = 0 // epoch ms

  private static isMockMode(): boolean {
    const email = process.env.SHIPROCKET_EMAIL
    const password = process.env.SHIPROCKET_PASSWORD
    return !email || !password || email === 'dummy' || email.includes('dummy')
  }

  public static async getAuthToken(): Promise<string> {
    if (this.isMockMode()) {
      return 'mock-shiprocket-token'
    }

    const now = Date.now()
    if (this.cachedToken && now < this.tokenExpiry) {
      return this.cachedToken
    }

    try {
      const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Auth failed with status ${res.status}: ${errBody}`)
      }

      const data = await res.json() as { token: string }
      this.cachedToken = data.token
      // Set expiry to 9 days from now (typically valid for 10 days)
      this.tokenExpiry = now + 9 * 24 * 60 * 60 * 1000
      return this.cachedToken
    } catch (error) {
      console.error('[ShiprocketService] Error getting auth token, falling back to mock mode:', error)
      throw new Error(`Failed to authenticate with Shiprocket API: ${(error as any).message}`)
    }
  }

  public static async createShipmentOrder(order: any): Promise<{ shiprocketOrderId: string; shipmentId: string }> {
    if (this.isMockMode()) {
      return {
        shiprocketOrderId: 'SR-ORD-' + Math.floor(100000 + Math.random() * 900000),
        shipmentId: 'SR-SHP-' + Math.floor(200000 + Math.random() * 900000)
      }
    }

    const token = await this.getAuthToken()
    const address = order.addressSnapshot || {}
    const [firstName, ...lastNameParts] = (order.user?.name || 'Customer').split(' ')
    const lastName = lastNameParts.join(' ') || 'Customer'

    const orderItems = order.items.map((item: any) => ({
      name: item.titleSnapshot,
      sku: item.productVariant?.sku || `SKU-MOCK-${item.id}`,
      units: item.quantity,
      selling_price: (item.priceSnapshot / 100).toString(),
      discount: "0",
      tax: "0",
      hsn: ""
    }))

    const payload = {
      order_id: order.id,
      order_date: new Date(order.createdAt).toISOString().replace('T', ' ').substring(0, 16),
      pickup_location: 'Primary',
      billing_customer_name: firstName || 'Customer',
      billing_last_name: lastName || 'Customer',
      billing_address: address.line1,
      billing_address_2: address.line2 || '',
      billing_city: address.city,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: 'India',
      billing_email: order.user?.email || 'customer@example.com',
      billing_phone: address.phone || '9999999999',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.paymentMethod?.toLowerCase() === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.subtotal / 100,
      length: 10,
      width: 10,
      height: 10,
      weight: 0.5
    }

    try {
      const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Order creation failed with status ${res.status}: ${errText}`)
      }

      const data = await res.json() as { order_id: any; shipment_id: any }
      return {
        shiprocketOrderId: String(data.order_id),
        shipmentId: String(data.shipment_id)
      }
    } catch (error) {
      console.error('[ShiprocketService] Error creating shipment order:', error)
      throw new Error(`Failed to create order in Shiprocket: ${(error as any).message}`)
    }
  }

  public static async assignAwb(shipmentId: string): Promise<{ awb: string; courier: string }> {
    if (this.isMockMode() || shipmentId.startsWith('SR-SHP-')) {
      return {
        awb: 'SR-AWB-' + Math.floor(100000000000 + Math.random() * 900000000000),
        courier: 'BlueDart (Mock)'
      }
    }

    const token = await this.getAuthToken()

    try {
      const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shipment_id: parseInt(shipmentId)
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`AWB assignment failed with status ${res.status}: ${errText}`)
      }

      const data = await res.json() as any
      const awbCode = data.response?.data?.awb_code
      const courierName = data.response?.data?.courier_name

      if (!awbCode) {
        throw new Error(data.response?.data?.message || 'AWB code not returned by Shiprocket')
      }

      return {
        awb: awbCode,
        courier: courierName || 'Shiprocket Partner'
      }
    } catch (error) {
      console.error('[ShiprocketService] Error assigning AWB:', error)
      throw new Error(`Failed to assign AWB in Shiprocket: ${(error as any).message}`)
    }
  }

  public static async trackShipment(awb: string): Promise<any> {
    if (this.isMockMode() || awb.startsWith('SR-AWB-')) {
      return {
        awb,
        status: 'In Transit',
        location: 'Mumbai Hub',
        events: [
          { activity: "Shipment In Transit", location: "Mumbai Gateway", timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
          { activity: "Order Picked Up", location: "Warehouse Primary", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          { activity: "Shipment Manifested / Ready for Pickup", location: "Warehouse Primary", timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() }
        ]
      }
    }

    const token = await this.getAuthToken()

    try {
      const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error(`Tracking request failed with status ${res.status}`)
      }

      const data = await res.json() as any
      const trackingData = data.tracking_data || {}
      const shipmentTrack = trackingData.shipment_track?.[0] || {}
      const scans = trackingData.shipment_track_activities || []

      const events = scans.map((scan: any) => ({
        activity: scan.activity || scan.status,
        location: scan.location || 'Hub',
        timestamp: scan.date || scan.timestamp
      }))

      return {
        awb,
        status: shipmentTrack.current_status || 'Manifested',
        location: shipmentTrack.current_location_name || 'Warehouse',
        events: events.length > 0 ? events : [
          { activity: shipmentTrack.current_status || 'Manifested', location: shipmentTrack.current_location_name || 'Warehouse', timestamp: shipmentTrack.updated_at || new Date().toISOString() }
        ]
      }
    } catch (error) {
      console.error('[ShiprocketService] Error tracking shipment:', error)
      return {
        awb,
        status: 'Shipment Manifested',
        location: 'Warehouse',
        events: [
          { activity: 'Tracking query failed. Please try again later.', location: 'API Error', timestamp: new Date().toISOString() }
        ]
      }
    }
  }
}
