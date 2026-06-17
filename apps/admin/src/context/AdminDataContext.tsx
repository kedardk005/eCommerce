import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ActivityLogEntry } from '../mockData'
import { useAdminAuth } from './AdminAuthContext'

export interface AdminVariant {
  id?: string
  sku?: string
  name: string
  stock: number
}

export interface AdminProduct {
  id: string
  title: string
  slug: string
  description: string
  price: number
  discountPrice: number
  brand: string
  category: string
  ageGroup: string
  variants: AdminVariant[]
  status: 'Active' | 'Draft' | 'Archived'
  imageColor: string
}

export interface AdminOrderItem {
  productId: string
  productTitle: string
  variantName: string
  quantity: number
  price: number
}

export interface AdminOrderStatusHistory {
  status: 'Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
  timestamp: string
  note: string
}

export interface AdminOrder {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  items: AdminOrderItem[]
  total: number
  subtotal?: number
  discount?: number
  shipping?: number
  paymentMethod: 'Online' | 'COD'
  paymentStatus: 'Pending' | 'Paid' | 'Refunded'
  status: 'Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
  statusHistory: AdminOrderStatusHistory[]
  shipment?: AdminShipment
  date: string
}

export interface AdminShipment {
  id: string
  shiprocketOrderId?: string
  awb?: string
  courier?: string
  trackingUrl?: string
  status: string
}

export interface AdminReturnRequest {
  id: string
  orderId: string
  customerName: string
  items: {
    productTitle: string
    variantName: string
    quantity: number
  }[]
  reason: string
  status: 'Requested' | 'Approved' | 'Rejected' | 'Refunded'
  rejectReason?: string
  date: string
}

export interface AdminCoupon {
  id: string
  code: string
  type: 'flat' | 'percent'
  value: number
  minOrder: number
  expiry: string
  usageLimit: number
  usedCount: number
  actualUsageCount?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminTicketMessage {
  sender: 'customer' | 'admin'
  text: string
  timestamp: string
}

export interface AdminTicket {
  id: string
  subject: string
  orderRef?: string
  status: 'open' | 'in progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  messages: AdminTicketMessage[]
  customerName: string
  customerEmail: string
}

export interface AdminBanner {
  id: string
  r2Key: string
  url: string
  link?: string | null
  position: number
  isActive: boolean
}

export interface AdminCampaign {
  id: string
  title: string
  description: string
  discountValue?: number | null
  couponId?: string | null
  bannerId?: string | null
  startDate: string
  endDate: string
  isActive: boolean
  status: string
  sentAt?: string | null
  banner?: AdminBanner | null
}

export interface AdminStaticPage {
  id: string
  title: string
  slug: string
  content: string
  isActive: boolean
}

export interface AdminStaffAccount {
  id: string
  name: string
  email: string
  phone?: string | null
  role: 'sub_admin' | 'super_owner'
  isBlocked: boolean
  createdAt: string
  permissions: string[]
}

export interface AdminSettings {
  id: string
  storeName: string
  supportContact: string
  currency: string
  lowStockThreshold: number
  codToggle: boolean
  onlineToggle: boolean
}

export interface FinanceSummary {
  revenue: number
  refunds: number
  net: number
  pendingCod: number
}

export interface FinanceTransaction {
  id: string
  orderId: string
  customerName: string
  amount: number
  type: 'payment' | 'refund'
  method: string
  createdAt: string
}

interface AdminDataContextType {
  products: AdminProduct[]
  categories: string[]
  orders: AdminOrder[]
  returns: AdminReturnRequest[]
  activityLogs: ActivityLogEntry[]
  activityLogsLoading: boolean
  activityLogsError: string | null
  fetchActivityLogs: (filters?: { entity?: string; actorEmail?: string; startDate?: string; endDate?: string }) => Promise<void>
  coupons: AdminCoupon[]
  couponsLoading: boolean
  couponsError: string | null
  tickets: AdminTicket[]
  ticketsLoading: boolean
  ticketsError: string | null
  
  banners: AdminBanner[]
  bannersLoading: boolean
  fetchBanners: () => Promise<void>
  addBanner: (banner: Omit<AdminBanner, 'id'>) => Promise<void>
  updateBanner: (id: string, updated: Partial<AdminBanner>) => Promise<void>
  deleteBanner: (id: string) => Promise<void>

  campaigns: AdminCampaign[]
  campaignsLoading: boolean
  fetchCampaigns: (page?: number, limit?: number) => Promise<void>
  addCampaign: (campaign: Omit<AdminCampaign, 'id' | 'status' | 'sentAt' | 'banner'>) => Promise<void>
  updateCampaign: (id: string, updated: Partial<Omit<AdminCampaign, 'banner'>>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  sendCampaign: (id: string) => Promise<void>

  cmsPages: AdminStaticPage[]
  cmsLoading: boolean
  fetchCmsPages: () => Promise<void>
  updateCmsPage: (slug: string, updated: { title?: string; content: string; isActive?: boolean }) => Promise<void>

  staffAccounts: AdminStaffAccount[]
  accountsLoading: boolean
  fetchStaffAccounts: () => Promise<void>
  inviteStaff: (data: { email: string; name: string; role?: string; permissions: string[] }) => Promise<void>
  updateStaffAccount: (id: string, updated: { role?: 'sub_admin' | 'super_owner'; isBlocked?: boolean; permissions?: string[] }) => Promise<void>

  settings: AdminSettings | null
  settingsLoading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (updated: Partial<Omit<AdminSettings, 'id'>>) => Promise<void>

  financeSummary: FinanceSummary | null
  financeTransactions: FinanceTransaction[]
  financeLoading: boolean
  fetchFinanceSummary: () => Promise<void>
  fetchFinanceTransactions: (filters?: { type?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => Promise<void>

  addProduct: (product: Omit<AdminProduct, 'id' | 'slug'>) => Promise<void>
  updateProduct: (id: string, updated: Partial<AdminProduct>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  addCategory: (name: string) => Promise<void>
  updateCategory: (oldName: string, newName: string) => Promise<void>
  deleteCategory: (name: string) => Promise<void>
  updateStock: (productId: string, variantName: string, newStock: number) => Promise<void>
  updateOrderStatus: (orderId: string, status: AdminOrder['status'], note?: string) => Promise<void>
  processReturn: (returnId: string, action: 'approve' | 'reject' | 'refund', rejectReason?: string) => Promise<void>
  fetchCoupons: (search?: string) => Promise<void>
  addCoupon: (coupon: Omit<AdminCoupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCoupon: (id: string, updated: Partial<AdminCoupon>) => Promise<void>
  deleteCoupon: (id: string) => Promise<void>
  retryShipment: (orderId: string) => Promise<void>
  fetchTickets: (filters?: { status?: string; priority?: string }) => Promise<void>
  replyToTicket: (ticketId: string, message: string) => Promise<void>
  updateTicketStatus: (
    ticketId: string,
    status: 'open' | 'in progress' | 'resolved',
    priority?: 'low' | 'medium' | 'high',
    assignedAdminId?: string
  ) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined)

function mapBackendStatusToUi(status: string): string {
  switch (status) {
    case 'placed': return 'Placed';
    case 'confirmed': return 'Confirmed';
    case 'packed': return 'Packed';
    case 'shipped': return 'Shipped';
    case 'out_for_delivery': return 'Out for Delivery';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function mapUiStatusToBackend(status: string): string {
  switch (status) {
    case 'Placed': return 'placed';
    case 'Confirmed': return 'confirmed';
    case 'Packed': return 'packed';
    case 'Shipped': return 'shipped';
    case 'Out for Delivery': return 'out_for_delivery';
    case 'Delivered': return 'delivered';
    case 'Cancelled': return 'cancelled';
    default: return status.toLowerCase();
  }
}

const mapOrderToAdminOrder = (o: any): AdminOrder => {
  const address = o.addressSnapshot || {};
  return {
    id: o.id,
    customerName: o.user?.name || 'Customer',
    customerEmail: o.user?.email || '',
    customerPhone: o.user?.phone || '',
    shippingAddress: {
      line1: address.line1 || '',
      line2: address.line2 || undefined,
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
    },
    items: o.items.map((item: any) => ({
      productId: item.productVariant?.productId || '',
      productTitle: item.titleSnapshot || '',
      variantName: item.productVariant?.attributes?.name || item.productVariant?.name || 'Standard',
      quantity: item.quantity,
      price: item.priceSnapshot / 100
    })),
    total: o.total / 100,
    subtotal: o.subtotal / 100,
    discount: o.discount / 100,
    shipping: o.shipping / 100,
    paymentMethod: o.payments?.[0]?.method?.toLowerCase().includes('online') ? 'Online' : 'COD',
    paymentStatus: o.returns?.length > 0 ? 'Refunded' : (o.paymentStatus === 'paid' ? 'Paid' : 'Pending'),
    status: mapBackendStatusToUi(o.orderStatus) as AdminOrder['status'],
    statusHistory: o.statusHistory ? o.statusHistory.map((h: any) => ({
      status: mapBackendStatusToUi(h.status) as AdminOrder['status'],
      timestamp: new Date(h.createdAt).toISOString().replace('T', ' ').substring(0, 16),
      note: h.notes || ''
    })) : [],
    shipment: o.shipments?.[0] ? {
      id: o.shipments[0].id,
      shiprocketOrderId: o.shipments[0].shiprocketOrderId || undefined,
      awb: o.shipments[0].awb || undefined,
      courier: o.shipments[0].courier || undefined,
      trackingUrl: o.shipments[0].trackingUrl || undefined,
      status: o.shipments[0].status
    } : undefined,
    date: new Date(o.createdAt).toISOString().substring(0, 10)
  }
}

const mapBackendProductToAdminProduct = (p: any): AdminProduct => {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    price: p.basePrice / 100,
    discountPrice: p.discountPrice ? p.discountPrice / 100 : p.basePrice / 100,
    brand: p.brand?.name || 'Generic',
    category: p.category?.name || 'Uncategorized',
    ageGroup: p.ageGroup,
    variants: p.variants ? p.variants.map((v: any) => ({
      id: v.id,
      sku: v.sku,
      name: v.attributes?.name || v.name || 'Standard',
      stock: v.stock
    })) : [],
    status: p.status === 'active' ? 'Active' : (p.status === 'draft' ? 'Draft' : 'Archived'),
    imageColor: 'bg-primary'
  }
}

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, role } = useAdminAuth()

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [rawCategories, setRawCategories] = useState<any[]>([])
  const [rawBrands, setRawBrands] = useState<any[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([])
  const [activityLogsLoading, setActivityLogsLoading] = useState(false)
  const [activityLogsError, setActivityLogsError] = useState<string | null>(null)

  // Simulated Returns List (Phase 5 target)
  const [returns, setReturns] = useState<AdminReturnRequest[]>([])

  // Coupons State
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const [couponsError, setCouponsError] = useState<string | null>(null)

  // Support Tickets State
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)

  // API fetches
  const fetchProducts = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/products?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data.items || data.products || [])
        setProducts(items.map((p: any) => mapBackendProductToAdminProduct(p)))
      }
    } catch (err) {
      console.error('Failed to fetch admin products:', err)
    }
  }

  const fetchCategoriesAndBrands = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/admin/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/brands')
      ])
      if (catRes.ok) {
        const cats = await catRes.json()
        setRawCategories(cats)
        setCategories(cats.map((c: any) => c.name))
      }
      if (brandRes.ok) {
        const brs = await brandRes.json()
        setRawBrands(brs)
      }
    } catch (err) {
      console.error('Failed to fetch categories/brands:', err)
    }
  }

  const fetchOrders = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/orders?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data.items || data.orders || [])
        setOrders(items.map((o: any) => mapOrderToAdminOrder(o)))
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err)
    }
  }

  const fetchReturns = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/returns?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const items = Array.isArray(data) ? data : (data.items || data.returns || [])
        setReturns(items)
      }
    } catch (err) {
      console.error('Failed to fetch admin returns:', err)
    }
  }

  const fetchCoupons = async (search?: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setCouponsLoading(true)
    setCouponsError(null)
    try {
      let url = '/api/admin/coupons?limit=100'
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons.map((c: any) => ({
          ...c,
          value: c.type === 'flat' ? c.value / 100 : c.value,
          minOrder: c.minOrder / 100
        })))
      } else {
        const err = await res.json()
        setCouponsError(err.error || 'Failed to load coupons')
      }
    } catch (err: any) {
      setCouponsError(err.message)
    } finally {
      setCouponsLoading(false)
    }
  }

  const fetchTickets = async (filters?: { status?: string; priority?: string }) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setTicketsLoading(true)
    setTicketsError(null)
    try {
      let queryStr = '?limit=100'
      if (filters?.status && filters.status !== 'All') {
        queryStr += `&status=${encodeURIComponent(filters.status)}`
      }
      if (filters?.priority && filters.priority !== 'All') {
        queryStr += `&priority=${encodeURIComponent(filters.priority)}`
      }
      const res = await fetch(`/api/admin/tickets${queryStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const rawTickets = Array.isArray(data) ? data : (data.items || data.tickets || [])
        setTickets(rawTickets.map((t: any) => ({
          id: t.id,
          subject: t.subject,
          orderRef: t.orderRef || undefined,
          status: t.status,
          priority: t.priority,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          messages: t.messages || [],
          customerName: t.customerName || t.user?.name || 'Customer',
          customerEmail: t.customerEmail || t.user?.email || ''
        })))
      } else {
        const err = await res.json()
        setTicketsError(err.error || 'Failed to load tickets')
      }
    } catch (err: any) {
      setTicketsError(err.message)
    } finally {
      setTicketsLoading(false)
    }
  }

  const replyToTicket = async (ticketId: string, message: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      })
      if (res.ok) {
        await fetchTickets()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to reply to ticket.')
      }
    } catch (err: any) {
      throw err
    }
  }

  const updateTicketStatus = async (
    ticketId: string,
    status: 'open' | 'in progress' | 'resolved',
    priority?: 'low' | 'medium' | 'high',
    assignedAdminId?: string
  ) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const mappedStatus = status === 'in progress' ? 'in_progress' : status
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: mappedStatus,
          priority,
          assignedAdminId
        })
      })
      if (res.ok) {
        await fetchTickets()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update ticket status.')
      }
    } catch (err: any) {
      throw err
    }
  }

  // Banners State
  const [banners, setBanners] = useState<AdminBanner[]>([])
  const [bannersLoading, setBannersLoading] = useState(false)

  // Campaigns State
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)

  // CMS State
  const [cmsPages, setCmsPages] = useState<AdminStaticPage[]>([])
  const [cmsLoading, setCmsLoading] = useState(false)

  // Staff Accounts State
  const [staffAccounts, setStaffAccounts] = useState<AdminStaffAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)

  // Settings State
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Finance State
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([])
  const [financeLoading, setFinanceLoading] = useState(false)

  // Fetch Banners
  const fetchBanners = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setBannersLoading(true)
    try {
      const res = await fetch('/api/admin/banners', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBanners(data)
      }
    } catch (err) {
      console.error('Failed to fetch admin banners:', err)
    } finally {
      setBannersLoading(false)
    }
  }

  const addBanner = async (banner: Omit<AdminBanner, 'id'>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(banner)
      })
      if (res.ok) {
        await fetchBanners()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add banner')
      }
    } catch (err: any) {
      throw err
    }
  }

  const updateBanner = async (id: string, updated: Partial<AdminBanner>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        await fetchBanners()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update banner')
      }
    } catch (err: any) {
      throw err
    }
  }

  const deleteBanner = async (id: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchBanners()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete banner')
      }
    } catch (err: any) {
      throw err
    }
  }

  // Fetch Campaigns
  const fetchCampaigns = async (page = 1, limit = 20) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setCampaignsLoading(true)
    try {
      const res = await fetch(`/api/admin/campaigns?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.items || [])
      }
    } catch (err) {
      console.error('Failed to fetch admin campaigns:', err)
    } finally {
      setCampaignsLoading(false)
    }
  }

  const addCampaign = async (campaign: Omit<AdminCampaign, 'id' | 'status' | 'sentAt' | 'banner'>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaign)
      })
      if (res.ok) {
        await fetchCampaigns()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add campaign')
      }
    } catch (err: any) {
      throw err
    }
  }

  const updateCampaign = async (id: string, updated: Partial<Omit<AdminCampaign, 'banner'>>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        await fetchCampaigns()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update campaign')
      }
    } catch (err: any) {
      throw err
    }
  }

  const deleteCampaign = async (id: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchCampaigns()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete campaign')
      }
    } catch (err: any) {
      throw err
    }
  }

  const sendCampaign = async (id: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchCampaigns()
        alert('Campaign broadcast triggered successfully!')
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send campaign')
      }
    } catch (err: any) {
      throw err
    }
  }

  // Fetch CMS Pages
  const fetchCmsPages = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setCmsLoading(true)
    try {
      const res = await fetch('/api/admin/pages', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCmsPages(data)
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch static pages.')
      }
    } catch (err) {
      console.error('Failed to fetch admin pages:', err)
      throw err
    } finally {
      setCmsLoading(false)
    }
  }

  const updateCmsPage = async (slug: string, updated: { title?: string; content: string; isActive?: boolean }) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        await fetchCmsPages()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save static page content')
      }
    } catch (err: any) {
      throw err
    }
  }

  // Fetch Staff Accounts
  const fetchStaffAccounts = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setAccountsLoading(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStaffAccounts(data.data || [])
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch staff accounts.')
      }
    } catch (err) {
      console.error('Failed to fetch staff accounts:', err)
      throw err
    } finally {
      setAccountsLoading(false)
    }
  }

  const inviteStaff = async (data: { email: string; name: string; role?: string; permissions: string[] }) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/accounts/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        await fetchStaffAccounts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to invite staff member')
      }
    } catch (err: any) {
      throw err
    }
  }

  const updateStaffAccount = async (id: string, updated: { role?: 'sub_admin' | 'super_owner'; isBlocked?: boolean; permissions?: string[] }) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        await fetchStaffAccounts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update staff account')
      }
    } catch (err: any) {
      throw err
    }
  }

  // Fetch Settings
  const fetchSettings = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch settings configurations.')
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      throw err
    } finally {
      setSettingsLoading(false)
    }
  }

  const updateSettings = async (updated: Partial<Omit<AdminSettings, 'id'>>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update global settings')
      }
    } catch (err: any) {
      throw err
    }
  }

  // Fetch Finance
  const fetchFinanceSummary = async () => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setFinanceLoading(true)
    try {
      const res = await fetch('/api/admin/finance/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFinanceSummary(data)
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch finance summary.')
      }
    } catch (err) {
      console.error('Failed to fetch finance summary:', err)
      throw err
    } finally {
      setFinanceLoading(false)
    }
  }

  const fetchFinanceTransactions = async (filters?: { type?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setFinanceLoading(true)
    try {
      let queryStr = `?page=${filters?.page || 1}&limit=${filters?.limit || 50}`
      if (filters?.type && filters.type !== 'all') {
        queryStr += `&type=${filters.type}`
      }
      if (filters?.startDate) {
        queryStr += `&startDate=${filters.startDate}`
      }
      if (filters?.endDate) {
        queryStr += `&endDate=${filters.endDate}`
      }
      const res = await fetch(`/api/admin/finance/transactions${queryStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFinanceTransactions(data.items || [])
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch finance transactions.')
      }
    } catch (err) {
      console.error('Failed to fetch finance transactions:', err)
      throw err
    } finally {
      setFinanceLoading(false)
    }
  }

  const fetchActivityLogs = async (filters?: { entity?: string; actorEmail?: string; startDate?: string; endDate?: string }) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    setActivityLogsLoading(true)
    setActivityLogsError(null)
    try {
      let queryStr = '?limit=500'
      if (filters) {
        if (filters.entity && filters.entity !== 'All') {
          queryStr += `&entity=${encodeURIComponent(filters.entity)}`
        }
        if (filters.actorEmail) {
          queryStr += `&actorEmail=${encodeURIComponent(filters.actorEmail)}`
        }
        if (filters.startDate) {
          queryStr += `&startDate=${encodeURIComponent(filters.startDate)}`
        }
        if (filters.endDate) {
          queryStr += `&endDate=${encodeURIComponent(filters.endDate)}`
        }
      }
      const res = await fetch(`/api/admin/activity-logs${queryStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setActivityLogs(data.items || [])
      } else {
        const err = await res.json()
        setActivityLogsError(err.error || 'Failed to load activity logs')
      }
    } catch (err: any) {
      setActivityLogsError(err.message)
    } finally {
      setActivityLogsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders()
      fetchProducts()
      fetchCategoriesAndBrands()
      fetchCoupons()
      fetchReturns()
      fetchTickets()
      fetchBanners()
      fetchCampaigns()
      fetchCmsPages()
      fetchActivityLogs()
      if (role === 'super_owner') {
        fetchStaffAccounts()
        fetchSettings()
        fetchFinanceSummary()
        fetchFinanceTransactions()
      }
    } else {
      setOrders([])
      setProducts([])
      setCategories([])
      setCoupons([])
      setReturns([])
      setTickets([])
      setBanners([])
      setCampaigns([])
      setCmsPages([])
      setStaffAccounts([])
      setActivityLogs([])
      setSettings(null)
      setFinanceSummary(null)
      setFinanceTransactions([])
    }
  }, [isLoggedIn, role])

  // --- MUTATORS ---

  const addProduct = async (product: Omit<AdminProduct, 'id' | 'slug'>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return

    let cat = rawCategories.find(c => c.name === product.category)
    let br = rawBrands.find(b => b.name === product.brand)

    const payload = {
      title: product.title,
      slug: product.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: product.description,
      brandId: br ? br.id : rawBrands[0]?.id,
      categoryId: cat ? cat.id : rawCategories[0]?.id,
      ageGroup: product.ageGroup,
      basePrice: Math.round(product.price * 100),
      discountPrice: product.discountPrice ? Math.round(product.discountPrice * 100) : null,
      status: product.status === 'Active' ? 'active' : (product.status === 'Draft' ? 'draft' : 'archived'),
      variants: product.variants.map((v, idx) => ({
        sku: `TOY-${product.title.toUpperCase().replace(/\s+/g, '-')}-${idx}-${Date.now()}`,
        stock: v.stock,
        attributes: { name: v.name }
      })),
      images: [
        {
          r2Key: 'products/default/main.webp',
          url: 'https://media.nilkanthtoys.com/products/default/main.webp',
          position: 0
        }
      ]
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        await fetchProducts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add product.')
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const updateProduct = async (id: string, updated: Partial<AdminProduct>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return

    const product = products.find(p => p.id === id)
    if (!product) return

    const finalTitle = updated.title || product.title
    const categoryName = updated.category || product.category
    const brandName = updated.brand || product.brand

    let cat = rawCategories.find(c => c.name === categoryName)
    let br = rawBrands.find(b => b.name === brandName)

    const finalVariants = updated.variants || product.variants

    const payload = {
      title: finalTitle,
      slug: finalTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      description: updated.description !== undefined ? updated.description : product.description,
      brandId: br ? br.id : rawBrands[0]?.id,
      categoryId: cat ? cat.id : rawCategories[0]?.id,
      ageGroup: updated.ageGroup || product.ageGroup,
      basePrice: updated.price !== undefined ? Math.round(updated.price * 100) : Math.round(product.price * 100),
      discountPrice: updated.discountPrice !== undefined ? (updated.discountPrice ? Math.round(updated.discountPrice * 100) : null) : (product.discountPrice ? Math.round(product.discountPrice * 100) : null),
      status: updated.status ? (updated.status === 'Active' ? 'active' : (updated.status === 'Draft' ? 'draft' : 'archived')) : undefined,
      variants: finalVariants.map((v: any, idx) => ({
        id: v.id,
        sku: v.sku || `TOY-${finalTitle.toUpperCase().replace(/\s+/g, '-')}-${idx}-${Date.now()}`,
        stock: v.stock,
        attributes: { name: v.name }
      }))
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        await fetchProducts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update product.')
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const deleteProduct = async (id: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchProducts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to archive product.')
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const addCategory = async (name: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
          isActive: true
        })
      })
      if (res.ok) {
        await fetchCategoriesAndBrands()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create category')
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const updateCategory = async (oldName: string, newName: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    const cat = rawCategories.find(c => c.name === oldName)
    if (!cat) return
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          slug: newName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
        })
      })
      if (res.ok) {
        await fetchCategoriesAndBrands()
        await fetchProducts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update category')
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const deleteCategory = async (name: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    const cat = rawCategories.find(c => c.name === name)
    if (!cat) return
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        await fetchCategoriesAndBrands()
        await fetchProducts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete category')
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const updateStock = async (productId: string, variantName: string, newStock: number) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return

    const product = products.find(p => p.id === productId)
    if (!product) return

    let cat = rawCategories.find(c => c.name === product.category)
    let br = rawBrands.find(b => b.name === product.brand)

    const updatedVariants = product.variants.map(v => {
      if (v.name === variantName) {
        return { ...v, stock: newStock }
      }
      return v
    })

    const payload = {
      title: product.title,
      categoryId: cat?.id || rawCategories[0]?.id,
      brandId: br?.id || rawBrands[0]?.id,
      variants: updatedVariants.map((v: any, idx) => ({
        id: v.id,
        sku: v.sku || `TOY-${product.title.toUpperCase().replace(/\s+/g, '-')}-${idx}-${Date.now()}`,
        stock: v.stock,
        attributes: { name: v.name }
      }))
    }

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        await fetchProducts()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update stock.')
      }
    } catch (err: any) {
      throw err
    }
  }

  const updateOrderStatus = async (orderId: string, status: AdminOrder['status'], note?: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return

    const backendStatus = mapUiStatusToBackend(status)

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: backendStatus,
          notes: note
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update order status.')
      }

      const resBody = await res.json()
      await fetchOrders()
      if (resBody.warning) {
        alert(resBody.warning)
      } else {
        alert('Order status updated successfully!')
      }
    } catch (err: any) {
      throw err
    }
  }

  const processReturn = async (returnId: string, action: 'approve' | 'reject' | 'refund', rejectReason?: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      let url = `/api/admin/returns/${returnId}/approve`
      let method = 'PATCH'
      let body: any = {}

      if (action === 'reject') {
        url = `/api/admin/returns/${returnId}/reject`
        body = { reason: rejectReason }
      } else if (action === 'refund') {
        url = `/api/admin/returns/${returnId}/refund`
        method = 'POST'
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method !== 'GET' && action !== 'approve' && action !== 'refund' ? JSON.stringify(body) : (action === 'approve' ? JSON.stringify({}) : undefined)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Failed to ${action} return request.`)
      }

      await fetchReturns()
      await fetchOrders()

      // Insert Activity Log locally for admin log screen if tracked in state
      const activeAdmin = localStorage.getItem('admin_role') === 'super_owner' ? 'Jane Doe' : 'Alex Smith'
      const activeRole = (localStorage.getItem('admin_role') as 'super_owner' | 'sub_admin') || 'sub_admin'
      const newLog: ActivityLogEntry = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actorName: activeAdmin,
        role: activeRole,
        actionDescription: `${action.toUpperCase()}D return request ${returnId}`,
        entityType: 'Return',
        entityId: returnId
      }
      setActivityLogs(prev => [newLog, ...prev])

      alert(`Return request was successfully ${action}d!`)
    } catch (err: any) {
      throw err
    }
  }

  const retryShipment = async (orderId: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/retry-shipment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to retry shipment registration.')
      }
      await fetchOrders()
      alert('Shipment registered successfully!')
    } catch (err: any) {
      throw err
    }
  }

  const addCoupon = async (coupon: Omit<AdminCoupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const payload = {
        ...coupon,
        value: coupon.type === 'flat' ? Math.round(coupon.value * 100) : coupon.value,
        minOrder: Math.round(coupon.minOrder * 100)
      }
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        await fetchCoupons()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create coupon')
      }
    } catch (err: any) {
      throw err
    }
  }

  const updateCoupon = async (id: string, updated: Partial<AdminCoupon>) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const payload: any = { ...updated }
      if (updated.type !== undefined || updated.value !== undefined) {
        const existing = coupons.find(c => c.id === id)
        const finalType = updated.type || existing?.type
        const finalValue = updated.value !== undefined ? updated.value : existing?.value
        payload.value = finalType === 'flat' ? Math.round(finalValue! * 100) : finalValue
      }
      if (updated.minOrder !== undefined) {
        payload.minOrder = Math.round(updated.minOrder * 100)
      }
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        await fetchCoupons()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update coupon')
      }
    } catch (err: any) {
      throw err
    }
  }

  const deleteCoupon = async (id: string) => {
    const token = localStorage.getItem('admin_accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await fetchCoupons()
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete coupon')
      }
    } catch (err: any) {
      throw err
    }
  }

  return (
    <AdminDataContext.Provider
      value={{
        products,
        categories,
        orders,
        returns,
        activityLogs,
        activityLogsLoading,
        activityLogsError,
        fetchActivityLogs,
        coupons,
        couponsLoading,
        couponsError,
        tickets,
        ticketsLoading,
        ticketsError,
        banners,
        bannersLoading,
        fetchBanners,
        addBanner,
        updateBanner,
        deleteBanner,
        campaigns,
        campaignsLoading,
        fetchCampaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        sendCampaign,
        cmsPages,
        cmsLoading,
        fetchCmsPages,
        updateCmsPage,
        staffAccounts,
        accountsLoading,
        fetchStaffAccounts,
        inviteStaff,
        updateStaffAccount,
        settings,
        settingsLoading,
        fetchSettings,
        updateSettings,
        financeSummary,
        financeTransactions,
        financeLoading,
        fetchFinanceSummary,
        fetchFinanceTransactions,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        updateStock,
        updateOrderStatus,
        processReturn,
        fetchCoupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        retryShipment,
        fetchTickets,
        replyToTicket,
        updateTicketStatus
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}

export const useAdminData = () => {
  const context = useContext(AdminDataContext)
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminDataProvider')
  }
  return context
}
