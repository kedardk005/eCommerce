export interface KPIStats {
  totalOrdersToday: number
  revenueToday: number
  pendingOrders: number
  lowStockCount: number
  openTickets: number
}

export interface SalesDataPoint {
  day: string
  date: string
  revenue: number
  orders: number
}

export interface RecentOrder {
  id: string
  customerName: string
  total: number
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  date: string
  itemsCount: number
}

export interface LowStockAlert {
  id: string
  productTitle: string
  variantName: string
  stock: number
  threshold: number
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  actorName: string
  role: 'super_owner' | 'sub_admin'
  actionDescription: string
  entityType: 'Product' | 'Order' | 'Return' | 'Customer' | 'Support Ticket' | 'Marketing' | 'Settings' | 'Auth'
  entityId: string
}

export const MOCK_KPI: KPIStats = {
  totalOrdersToday: 48,
  revenueToday: 1564.50,
  pendingOrders: 14,
  lowStockCount: 5,
  openTickets: 6
}

export const MOCK_SALES_TREND: SalesDataPoint[] = [
  { day: 'Mon', date: 'Jun 9', revenue: 980, orders: 28 },
  { day: 'Tue', date: 'Jun 10', revenue: 1240, orders: 35 },
  { day: 'Wed', date: 'Jun 11', revenue: 1100, orders: 31 },
  { day: 'Thu', date: 'Jun 12', revenue: 1750, orders: 48 },
  { day: 'Fri', date: 'Jun 13', revenue: 1420, orders: 40 },
  { day: 'Sat', date: 'Jun 14', revenue: 2100, orders: 58 },
  { day: 'Sun', date: 'Jun 15', revenue: 1890, orders: 52 }
]

export const MOCK_RECENT_ORDERS: RecentOrder[] = [
  { id: 'ORD-9025', customerName: 'Emily Stone', total: 104.97, status: 'Pending', date: '2026-06-15 21:45', itemsCount: 3 },
  { id: 'ORD-9024', customerName: 'Marcus Thorne', total: 34.99, status: 'Processing', date: '2026-06-15 19:20', itemsCount: 1 },
  { id: 'ORD-9023', customerName: 'Sarah K.', total: 58.97, status: 'Shipped', date: '2026-06-15 18:05', itemsCount: 2 },
  { id: 'ORD-9022', customerName: 'Alice Wright', total: 128.97, status: 'Delivered', date: '2026-06-15 15:30', itemsCount: 4 },
  { id: 'ORD-9021', customerName: 'David Miller', total: 49.99, status: 'Cancelled', date: '2026-06-15 11:15', itemsCount: 1 }
]

export const MOCK_LOW_STOCK: LowStockAlert[] = [
  { id: '3', productTitle: 'Balancing Acrobat Figurines', variantName: 'Standard Pack', stock: 3, threshold: 5 },
  { id: '14', productTitle: 'Miniature Wooden Tool Bench', variantName: 'Standard Tool Set', stock: 4, threshold: 5 },
  { id: '20', productTitle: 'Safari Animals Puzzle', variantName: 'Safari Animals', stock: 0, threshold: 5 },
  { id: '1', productTitle: 'Classic Wooden Train Set', variantName: 'Natural Wood', stock: 2, threshold: 5 },
  { id: '18', productTitle: 'Tactile Wooden Sound Blocks', variantName: 'Sound Blocks', stock: 1, threshold: 5 }
]

export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
  {
    id: 'act-1',
    timestamp: '2026-06-15 22:30:15',
    actorName: 'Jane Doe',
    role: 'super_owner',
    actionDescription: 'Updated pricing for "Classic Wooden Train Set" from $39.99 to $34.99',
    entityType: 'Product',
    entityId: '1'
  },
  {
    id: 'act-2',
    timestamp: '2026-06-15 21:15:42',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Dispatched order ORD-9023 via Shiprocket, generated AWB #SR-98213876',
    entityType: 'Order',
    entityId: 'ORD-9023'
  },
  {
    id: 'act-3',
    timestamp: '2026-06-15 20:02:11',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Approved return request for order ORD-9012 (Reason: Damaged packaging)',
    entityType: 'Return',
    entityId: 'RET-302'
  },
  {
    id: 'act-4',
    timestamp: '2026-06-15 19:40:00',
    actorName: 'Jane Doe',
    role: 'super_owner',
    actionDescription: 'Disabled sub-admin account for user "temp_staff@toystore.com"',
    entityType: 'Auth',
    entityId: 'user-82'
  },
  {
    id: 'act-5',
    timestamp: '2026-06-15 18:22:33',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Replied to support ticket #TCK-408: "Your order is scheduled for dispatch tomorrow morning."',
    entityType: 'Support Ticket',
    entityId: 'TCK-408'
  },
  {
    id: 'act-6',
    timestamp: '2026-06-15 16:50:00',
    actorName: 'Jane Doe',
    role: 'super_owner',
    actionDescription: 'Updated Razorpay Live Integration keys in payment gateway settings',
    entityType: 'Settings',
    entityId: 'setting-pay-01'
  },
  {
    id: 'act-7',
    timestamp: '2026-06-15 15:12:08',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Increased stock level for "Geometric Shape Sorter" (Bright Colors) by 25 units',
    entityType: 'Product',
    entityId: '9'
  },
  {
    id: 'act-8',
    timestamp: '2026-06-15 14:05:55',
    actorName: 'Jane Doe',
    role: 'super_owner',
    actionDescription: 'Created discount coupon "SUMMERWOOD" (15% off, min order $50)',
    entityType: 'Marketing',
    entityId: 'coupon-summer15'
  },
  {
    id: 'act-9',
    timestamp: '2026-06-15 12:30:40',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Blocked customer account "spammer_joy@gmail.com" due to fraudulent returns',
    entityType: 'Customer',
    entityId: 'cust-998'
  },
  {
    id: 'act-10',
    timestamp: '2026-06-15 11:00:12',
    actorName: 'Jane Doe',
    role: 'super_owner',
    actionDescription: 'Changed default store shipping rate from $5.00 to $4.50',
    entityType: 'Settings',
    entityId: 'setting-ship-01'
  },
  {
    id: 'act-11',
    timestamp: '2026-06-14 17:45:30',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Marked order ORD-9020 as "Packed" and queued for courier pickup',
    entityType: 'Order',
    entityId: 'ORD-9020'
  },
  {
    id: 'act-12',
    timestamp: '2026-06-14 15:30:22',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Created new product "Stackable Forest Tree Blocks" in Building Blocks category',
    entityType: 'Product',
    entityId: '21'
  },
  {
    id: 'act-13',
    timestamp: '2026-06-14 14:20:10',
    actorName: 'Jane Doe',
    role: 'super_owner',
    actionDescription: 'Modified Terms & Conditions static page details via CMS editor',
    entityType: 'Settings',
    entityId: 'cms-page-terms'
  },
  {
    id: 'act-14',
    timestamp: '2026-06-14 11:05:44',
    actorName: 'Alex Smith',
    role: 'sub_admin',
    actionDescription: 'Initiated refund processing for return RET-301 in the amount of $24.99',
    entityType: 'Return',
    entityId: 'RET-301'
  },
  {
    id: 'act-15',
    timestamp: '2026-06-14 09:12:15',
    actorName: 'Jane Doe',
    role: 'super_owner',
    actionDescription: 'Created sub-admin login credentials for "Alex Smith" (alex.smith@toystore.com)',
    entityType: 'Auth',
    entityId: 'user-05'
  }
]
