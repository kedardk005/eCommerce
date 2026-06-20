import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAdminData } from '../context/AdminDataContext'
import type { AdminOrder } from '../context/AdminDataContext'

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { orders, updateOrderStatus, retryShipment } = useAdminData()

  // Find order in live context
  const order = orders.find(o => o.id === id)

  // Status modifier states
  const [newStatus, setNewStatus] = useState<AdminOrder['status']>('Placed')
  const [statusNote, setStatusNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)

  // Invoice toast state
  const [invoiceToast, setInvoiceToast] = useState(false)

  // Sync state with active order status
  useEffect(() => {
    if (order) {
      setNewStatus(order.status)
    }
  }, [order])

  // Automatically hide toast
  useEffect(() => {
    if (invoiceToast) {
      const timer = setTimeout(() => {
        setInvoiceToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [invoiceToast])

  if (!order) {
    return (
      <div className="bg-surface border border-border p-8 rounded shadow-sm text-center font-body text-ink-muted text-xs max-w-md mx-auto my-12">
        <span className="text-3xl block mb-2">⚠️</span>
        <h3 className="font-heading font-extrabold text-sm text-ink mb-2">Order Not Found</h3>
        <p className="mb-4">The order code you requested does not exist in the administrative registry.</p>
        <Link to="/orders" className="text-ink-muted hover:underline font-bold">
          &larr; Back to Orders Directory
        </Link>
      </div>
    )
  }

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (id) {
      updateOrderStatus(id, newStatus, statusNote.trim() || `Status updated to ${newStatus}.`)
      setStatusNote('')
      setShowNoteInput(false)
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
      {/* Toast Notification */}
      {invoiceToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center bg-secondary text-white text-xs font-semibold px-4 py-3 rounded shadow-lg animate-fade-in-up">
          <span className="mr-2">🧾</span>
          <span>Invoice generation and PDF download is coming soon in Phase 3.</span>
          <button onClick={() => setInvoiceToast(false)} className="ml-4 hover:opacity-80 focus:outline-none">
            &times;
          </button>
        </div>
      )}

      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 text-left">
        <div>
          <div className="flex items-center space-x-2">
            <Link to="/orders" className="text-ink-muted hover:underline text-xs font-semibold">
              &larr; Orders
            </Link>
            <span className="text-border">/</span>
            <span className="text-xs text-ink-muted font-mono">{order.id}</span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-ink mt-1">Order Details</h2>
        </div>
        <div className="mt-2 sm:mt-0 flex space-x-2">
          {/* Generate Invoice button */}
          <button
            onClick={() => setInvoiceToast(true)}
            className="px-3.5 py-1.5 border border-border bg-surface hover:bg-bg/10 text-ink font-heading font-bold text-xs rounded transition-colors shadow-sm focus:outline-none"
          >
            🧾 Generate Invoice
          </button>
        </div>
      </div>

      {/* Main details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-left">
        {/* Left Column - Items List & Timeline */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Items card */}
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-bg/25">
              <h3 className="text-xs font-heading font-bold text-ink">Purchased Items</h3>
            </div>
            
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-bg/60 border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                  <th className="px-4 py-2">Toy product</th>
                  <th className="px-4 py-2 font-mono text-center">Qty</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-bg/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{item.productTitle}</div>
                      <div className="text-[10px] text-ink-muted">Variant: {item.variantName}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatINR(item.price)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                      {formatINR(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Price calculation block */}
            <div className="p-4 bg-bg/15 border-t border-border flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono">{formatINR(order.subtotal ?? order.total)}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Shipping Fee:</span>
                  <span className="font-mono">{formatINR(order.shipping ?? 0)}</span>
                </div>
                <div className="flex justify-between text-ink-muted border-b border-border pb-1.5">
                  <span>Discount Coupon:</span>
                  <span className="font-mono">-{formatINR(order.discount ?? 0)}</span>
                </div>
                <div className="flex justify-between font-heading font-extrabold text-ink text-sm pt-0.5">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatINR(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Tracking cards */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm">
            <h3 className="text-xs font-heading font-bold text-ink mb-4 border-b border-border pb-2">
              Chronological Status History
            </h3>
            
            <div className="relative border-l border-border pl-5 ml-2.5 space-y-4">
              {order.statusHistory.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline bullet indicator */}
                  <span className="absolute -left-[27px] top-1 bg-surface border-2 border-primary h-3.5 w-3.5 rounded-full flex items-center justify-center">
                    <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                  </span>
                  
                  <div className="space-y-0.5 text-xs text-left">
                    <div className="flex flex-wrap items-center space-x-2">
                      <span className="font-heading font-bold text-ink">{step.status}</span>
                      <span className="text-[10px] text-ink-muted font-mono">{step.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted">{step.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Status Modifier dropdown, Customer & Shipping details */}
        <div className="space-y-4">
          
          {/* Status modifier deck */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm">
            <h3 className="text-xs font-heading font-bold text-ink mb-3">Order Status Controller</h3>
            
            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Update State</label>
                <select
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value as AdminOrder['status'])
                    setShowNoteInput(true)
                  }}
                  className="w-full mt-1 px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer text-ink font-medium"
                >
                  <option value="Placed">Placed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Optional Status note input */}
              {showNoteInput && (
                <div className="space-y-1 animate-fade-in-down">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Status Action Note</label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Dispatched via courier partners"
                    className="w-full px-2 py-1 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={newStatus === order.status && !statusNote}
                className="w-full bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs py-1.5 px-3 rounded transition-colors shadow-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update status & log
              </button>
            </form>
          </div>

          {/* Shiprocket Shipment Card */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm text-xs space-y-3">
            <h3 className="text-xs font-heading font-bold text-ink border-b border-border pb-1.5 flex justify-between items-center">
              <span>Shipping Log (Shiprocket)</span>
              {order.shipment && (
                <span className={`text-[9px] font-heading font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                  order.shipment.status === 'failed'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-accent-teal/10 text-accent-teal border-accent-teal/20'
                }`}>
                  {order.shipment.status}
                </span>
              )}
            </h3>

            {order.shipment ? (
              order.shipment.status === 'failed' || !order.shipment.awb ? (
                <div className="space-y-3">
                  <div className="p-2.5 bg-primary/5 border border-primary/10 rounded text-primary leading-normal font-medium">
                    ⚠️ Shiprocket registration failed. You can attempt to retry the API call below.
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await retryShipment(order.id)
                      } catch (err) {}
                    }}
                    className="w-full bg-accent-yellow hover:bg-accent-yellow/95 text-ink font-heading font-bold text-xs py-1.5 px-3 rounded shadow-xs focus:outline-none"
                  >
                    🔄 Retry Shiprocket Booking
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 leading-relaxed">
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase font-semibold block">Shiprocket Order Ref</span>
                    <strong className="font-mono text-ink text-[11px]">{order.shipment.shiprocketOrderId}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase font-semibold block">AWB Code (Courier)</span>
                    <strong className="font-mono text-ink text-[11px]">{order.shipment.awb} ({order.shipment.courier})</strong>
                  </div>
                  {order.shipment.trackingUrl && (
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-accent-blue hover:underline font-bold text-xs"
                    >
                      🔗 Track on Shiprocket Website &rarr;
                    </a>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-ink-muted italic leading-normal">
                  No shipping manifest has been created yet. Updates to <strong>Packed</strong> will trigger booking.
                </p>
                {(order.status === 'Packed' || order.status === 'Shipped' || order.status === 'Out for Delivery' || order.status === 'Delivered') && (
                  <button
                    onClick={async () => {
                      try {
                        await retryShipment(order.id)
                      } catch (err) {}
                    }}
                    className="w-full bg-surface hover:bg-bg/20 text-ink border border-border font-heading font-bold text-[11px] py-1.5 px-3 rounded transition focus:outline-none"
                  >
                    🚀 Trigger Manual Booking
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customer profiles details card */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm text-xs space-y-3">
            <h3 className="text-xs font-heading font-bold text-ink border-b border-border pb-1.5">
              Customer Information
            </h3>
            
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-ink-muted uppercase font-semibold">Name</p>
                <p className="font-semibold text-ink">{order.customerName}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase font-semibold">Email Address</p>
                <p className="font-mono text-ink">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase font-semibold">Phone Number</p>
                <p className="font-mono text-ink">{order.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Shipping addresses details card */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm text-xs space-y-3">
            <h3 className="text-xs font-heading font-bold text-ink border-b border-border pb-1.5">
              Delivery Address
            </h3>
            
            <div className="space-y-1 text-ink font-medium leading-relaxed">
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>
          </div>

          {/* Billing metadata details card */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm text-xs space-y-3">
            <h3 className="text-xs font-heading font-bold text-ink border-b border-border pb-1.5">
              Payment Parameters
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-ink-muted uppercase font-semibold">Method</p>
                <p className="font-semibold text-ink">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase font-semibold">Billing Status</p>
                <span className={`inline-block text-[9px] font-heading font-extrabold px-1.5 py-0.5 rounded border mt-0.5 uppercase tracking-wider ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-accent-teal/10 text-accent-teal border-accent-teal/20'
                    : order.paymentStatus === 'Refunded'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-accent-yellow/10 text-ink border-accent-yellow/20'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default OrderDetail
