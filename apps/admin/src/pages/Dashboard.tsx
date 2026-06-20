import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminData } from '../context/AdminDataContext'
import type { SalesDataPoint } from '../mockData'

export const Dashboard: React.FC = () => {
  const { products, orders, returns, tickets } = useAdminData()
  const navigate = useNavigate()

  const [hoveredBar, setHoveredBar] = useState<SalesDataPoint | null>(null)

  // Chart configuration parameters
  const chartHeight = 160
  const chartWidth = 500

  // 1. Calculate live KPIs
  const ordersTodayList = useMemo(() => {
    return orders.filter(o => o.date === '2026-06-15')
  }, [orders])

  const ordersTodayCount = ordersTodayList.length
  
  const revenueToday = useMemo(() => {
    return ordersTodayList.reduce((sum, o) => sum + o.total, 0)
  }, [ordersTodayList])

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => ['Placed', 'Confirmed', 'Packed'].includes(o.status)).length
  }, [orders])

  // Get flat list of variants under warning threshold (< 5 units)
  const lowStockVariants = useMemo(() => {
    const list: { id: string; productTitle: string; variantName: string; stock: number }[] = []
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.stock < 5) {
          list.push({
            id: p.id,
            productTitle: p.title,
            variantName: v.name,
            stock: v.stock
          })
        }
      })
    })
    return list
  }, [products])

  const lowStockCount = lowStockVariants.length

  const openTicketsCount = useMemo(() => {
    return tickets.filter(t => t.status === 'open' || t.status === 'in progress').length
  }, [tickets])

  // Dynamic Sales Trend chart data (binding Sunday's metric to live orders)
  const salesTrendData: SalesDataPoint[] = useMemo(() => {
    return [
      { day: 'Mon', date: 'Jun 9', revenue: 980, orders: 28 },
      { day: 'Tue', date: 'Jun 10', revenue: 1240, orders: 35 },
      { day: 'Wed', date: 'Jun 11', revenue: 1100, orders: 31 },
      { day: 'Thu', date: 'Jun 12', revenue: 1750, orders: 48 },
      { day: 'Fri', date: 'Jun 13', revenue: 1420, orders: 40 },
      { day: 'Sat', date: 'Jun 14', revenue: 2100, orders: 58 },
      { day: 'Sun', date: 'Jun 15', revenue: Math.round(revenueToday), orders: Math.max(52, ordersTodayCount) }
    ]
  }, [revenueToday, ordersTodayCount])

  const maxRevenue = Math.max(...salesTrendData.map(d => d.revenue))
  const yAxisCeiling = Math.max(2000, Math.ceil(maxRevenue / 500) * 500)

  // Format currency
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(val)
  }

  // Get status styling class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Placed':
        return 'bg-accent-yellow/10 text-ink border border-accent-yellow/30'
      case 'Confirmed':
        return 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
      case 'Packed':
        return 'bg-accent-blue/25 text-ink border border-accent-blue/40'
      case 'Shipped':
        return 'bg-accent-blue/40 text-white border border-accent-blue'
      case 'Out for Delivery':
        return 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20'
      case 'Delivered':
        return 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30'
      case 'Cancelled':
        return 'bg-primary/25 text-primary border border-primary/40'
      default:
        return 'bg-bg text-ink-muted border border-border'
    }
  }

  // Take the 5 most recent orders for display
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5)
  }, [orders])

  return (
    <div className="space-y-5">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 text-left">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Store Dashboard</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Real-time shop operations summary and high-density performance logs.
          </p>
        </div>
        <div className="mt-2 sm:mt-0 text-[10px] text-ink-muted font-mono">
          Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Orders */}
        <div className="bg-surface border border-border p-3.5 rounded shadow-sm text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue" />
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Orders Today</p>
          <p className="text-xl font-heading font-extrabold text-ink mt-1">{ordersTodayCount}</p>
          <span className="text-[9px] text-ink-muted font-medium">Seeded: {orders.length} total</span>
        </div>

        {/* Revenue Today */}
        <div className="bg-surface border border-border p-3.5 rounded shadow-sm text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent-teal" />
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Revenue Today</p>
          <p className="text-xl font-heading font-extrabold text-ink mt-1">{formatINR(revenueToday)}</p>
          <span className="text-[9px] text-accent-teal font-semibold">📈 Real-time context</span>
        </div>

        {/* Pending Orders */}
        <div className="bg-surface border border-border p-3.5 rounded shadow-sm text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent-yellow" />
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Pending Orders</p>
          <p className="text-xl font-heading font-extrabold text-ink mt-1">{pendingOrdersCount}</p>
          <span className="text-[9px] text-ink-muted">Requires packaging</span>
        </div>

        {/* Low Stock Items */}
        <div className="bg-surface border border-border p-3.5 rounded shadow-sm text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Low Stock alerts</p>
          <p className="text-xl font-heading font-extrabold text-ink mt-1">{lowStockCount}</p>
          <span className="text-[9px] text-primary font-semibold">⚠️ Action required</span>
        </div>

        {/* Open Support Tickets & Pending Returns */}
        <div className="bg-surface border border-border p-3.5 rounded shadow-sm text-left relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Support & Returns</p>
          <p className="text-xl font-heading font-extrabold text-ink mt-1">
            {openTicketsCount} / {returns.filter(r => r.status === 'Requested').length}
          </p>
          <span className="text-[9px] text-ink-muted">Tickets / Pending returns</span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: Chart and Recent Orders */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sales Chart Section */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm text-left">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-xs font-heading font-bold text-ink">Sales Trend (Last 7 Days)</h3>
                <p className="text-[10px] text-ink-muted">Daily gross orders value (Sunday updates dynamically).</p>
              </div>
              {/* Tooltip Overlay */}
              <div className="text-right h-8">
                {hoveredBar ? (
                  <div>
                    <span className="text-[10px] text-ink-muted font-medium">{hoveredBar.date}: </span>
                    <span className="text-xs font-bold text-ink">{formatINR(hoveredBar.revenue)}</span>
                    <span className="text-[9px] text-ink-muted"> ({hoveredBar.orders} orders)</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-ink-muted italic">Hover columns for metrics</span>
                )}
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="relative w-full overflow-hidden flex justify-center py-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto max-w-lg select-none"
              >
                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const yVal = chartHeight - (ratio * (chartHeight - 30)) - 20
                  const labelValue = yAxisCeiling * ratio
                  return (
                    <g key={idx}>
                      <line
                        x1="35"
                        y1={yVal}
                        x2={chartWidth - 10}
                        y2={yVal}
                        stroke="var(--color-border)"
                        strokeWidth="0.5"
                        strokeDasharray="4,4"
                      />
                      <text
                        x="30"
                        y={yVal + 3}
                        fill="var(--color-ink-muted)"
                        fontSize="8"
                        textAnchor="end"
                        className="font-mono font-bold"
                      >
                        ₹{labelValue}
                      </text>
                    </g>
                  )
                })}

                {/* Bars */}
                {salesTrendData.map((d, idx) => {
                  const barWidth = 32
                  const space = (chartWidth - 50) / salesTrendData.length
                  const xVal = 45 + idx * space
                  const barHeight = (d.revenue / yAxisCeiling) * (chartHeight - 30)
                  const yVal = chartHeight - barHeight - 20

                  const isHovered = hoveredBar?.day === d.day

                  return (
                    <g
                      key={d.day}
                      onMouseEnter={() => setHoveredBar(d)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="cursor-pointer"
                    >
                      {/* Bar Rectangle */}
                      <rect
                        x={xVal}
                        y={yVal}
                        width={barWidth}
                        height={barHeight}
                        rx="3"
                        fill={isHovered ? 'var(--color-primary)' : 'var(--color-bg)'}
                        className="transition-colors duration-150"
                      />
                      
                      {/* Revenue Label on Top of Bars */}
                      <text
                        x={xVal + barWidth / 2}
                        y={yVal - 5}
                        textAnchor="middle"
                        fill="var(--color-secondary)"
                        fontSize="8"
                        fontWeight="bold"
                        className="font-mono opacity-80"
                      >
                        ₹{Math.round(d.revenue)}
                      </text>

                      {/* X-Axis Labels */}
                      <text
                        x={xVal + barWidth / 2}
                        y={chartHeight - 5}
                        textAnchor="middle"
                        fill="var(--color-ink-muted)"
                        fontSize="9"
                        fontWeight="600"
                      >
                        {d.day}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Recent Orders Log Table */}
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface">
              <div>
                <h3 className="text-xs font-heading font-bold text-ink">Recent Activity Orders</h3>
                <p className="text-[10px] text-ink-muted">Latest sales transactions recorded.</p>
              </div>
              <button
                onClick={() => navigate('/orders')}
                className="text-[10px] font-semibold text-ink hover:underline focus:outline-none"
              >
                Manage Orders &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                    <th className="px-4 py-2">Order ID</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentOrders.map((order) => {
                    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover:bg-bg cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2 font-mono font-bold text-ink-muted hover:underline">{order.id}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-[9px] text-ink-muted">{totalItems} items</div>
                        </td>
                        <td className="px-4 py-2 text-ink-muted text-[10px]">{order.date}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">{formatINR(order.total)}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-block text-[9px] font-heading font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Inventory Alerts & Fast Utilities */}
        <div className="space-y-5 text-left">
          {/* Low Stock Alerts Box */}
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface">
              <h3 className="text-xs font-heading font-bold text-ink">Critical Low-Stock Inventory</h3>
              <p className="text-[10px] text-ink-muted">Variants currently under warning threshold (&lt; 5 units).</p>
            </div>
            <div className="divide-y divide-border/60 p-1 max-h-64 overflow-y-auto">
              {lowStockVariants.length > 0 ? (
                lowStockVariants.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-bg flex items-center justify-between rounded transition-colors"
                  >
                    <div className="space-y-0.5 pr-2">
                      <p className="text-xs font-semibold text-ink leading-tight">{item.productTitle}</p>
                      <p className="text-[10px] text-ink-muted font-medium">Variant: {item.variantName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block font-heading font-extrabold text-[10px] px-2 py-0.5 rounded ${
                        item.stock === 0
                          ? 'bg-primary text-white'
                          : 'bg-accent-yellow/20 text-ink border border-accent-yellow/30'
                      }`}>
                        {item.stock === 0 ? 'OUT OF STOCK' : `${item.stock} left`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-ink-muted text-[11px] italic">
                  All inventory stocks are above the warning limit.
                </div>
              )}
            </div>
            <div className="bg-bg p-3 border-t border-border text-center">
              <button
                onClick={() => navigate('/inventory')}
                className="text-[10px] font-heading font-bold text-ink hover:underline focus:outline-none"
              >
                Open Stock replenishment &rarr;
              </button>
            </div>
          </div>

          {/* Quick Stats Summary / Mini FAQ */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm space-y-3">
            <h3 className="text-xs font-heading font-bold text-ink">Operational Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/products')}
                className="p-2 border border-border bg-bg hover:bg-bg/10 text-center rounded font-semibold text-ink transition-colors"
              >
                ➕ Add Toy Product
              </button>
              <button
                onClick={() => navigate('/products')}
                className="p-2 border border-border bg-bg hover:bg-bg/10 text-center rounded font-semibold text-ink transition-colors"
              >
                🏷️ Manage Category
              </button>
              <button
                onClick={() => navigate('/returns')}
                className="p-2 border border-border bg-bg hover:bg-bg/10 text-center rounded font-semibold text-ink transition-colors"
              >
                🔄 Process Returns
              </button>
              <button
                onClick={() => navigate('/activity')}
                className="p-2 border border-border bg-bg hover:bg-bg/10 text-center rounded font-semibold text-ink transition-colors"
              >
                📜 Audit Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
