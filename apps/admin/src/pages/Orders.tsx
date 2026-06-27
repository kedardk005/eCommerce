import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminData } from '../context/AdminDataContext'

export const Orders: React.FC = () => {
  const { orders, fetchOrders } = useAdminData()
  const navigate = useNavigate()

  // Filter states
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Unique status list for filter dropdown
  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    orders.forEach(o => set.add(o.status))
    return ['All', ...Array.from(set)]
  }, [orders])

  // Client-side filtering logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Search term match
      if (
        search &&
        !o.id.toLowerCase().includes(search.toLowerCase()) &&
        !o.customerName.toLowerCase().includes(search.toLowerCase())
      ) {
        return false
      }

      // Status match
      if (selectedStatus !== 'All' && o.status !== selectedStatus) {
        return false
      }

      // Date match
      if (startDate && o.date < startDate) {
        return false
      }
      if (endDate && o.date > endDate) {
        return false
      }

      return true
    })
  }, [orders, search, selectedStatus, startDate, endDate])

  const handleResetFilters = () => {
    setSearch('')
    setSelectedStatus('All')
    setStartDate('')
    setEndDate('')
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
        return 'bg-accent-blue/40 text-ink border border-accent-blue/60'
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

  // Format currency
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val)
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="border-b border-border pb-3 flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-xl font-heading font-extrabold text-ink">Order Management</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Track customer purchases, oversee dispatch pipelines, and process billing states.
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await fetchOrders();
            } catch (err: any) {
              console.error('Failed to refresh orders:', err);
            }
          }}
          className="text-xs font-heading font-bold text-ink hover:text-primary flex items-center gap-1.5 px-3 py-1.5 border border-border rounded bg-surface hover:bg-bg transition-colors"
        >
          🔄 Refresh Orders
        </button>
      </div>

      {/* Filter Control Console */}
      <div className="bg-surface border border-border p-4 rounded shadow-sm text-left">
        <h3 className="text-xs font-heading font-bold text-ink mb-3">Order Query Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">Search Client/ID</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Emily Stone, ORD-9025"
              className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Status Select */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">Order Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer text-ink font-medium"
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt === 'All' ? 'All Statuses' : opt}
                </option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>

          {/* Date End */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-ink-muted uppercase font-heading">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Filter Summary Actions */}
        <div className="flex justify-between items-center mt-4 border-t border-border/60 pt-3">
          <p className="text-[10px] text-ink-muted">
            Showing <strong className="text-ink">{filteredOrders.length}</strong> of {orders.length} orders.
          </p>
          {(search || selectedStatus !== 'All' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-primary hover:underline focus:outline-none"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Directory Table */}
      <div className="bg-surface border border-border rounded shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Customer details</th>
                <th className="px-4 py-2.5">Purchase Date</th>
                <th className="px-4 py-2.5 text-center font-mono">Items</th>
                <th className="px-4 py-2.5 text-right font-mono">Total Paid</th>
                <th className="px-4 py-2.5 text-center">Method</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-bg cursor-pointer transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-ink-muted hover:underline">
                        {order.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{order.customerName}</div>
                        <div className="text-[10px] text-ink-muted font-mono">{order.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{order.date}</td>
                      <td className="px-4 py-3 text-center font-mono">{totalItems} toys</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                        {formatINR(order.total)}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-ink-muted">
                        {order.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted italic">
                    No orders match the selected search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Orders
