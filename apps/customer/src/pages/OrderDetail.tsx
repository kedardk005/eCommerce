import React, { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useOrders } from '../context/OrdersContext'
import { useCart } from '../context/CartContext'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { orders, loading, error, cancelOrder, fetchOrders } = useOrders()
  const { updateCartItemsRaw } = useCart()
  const navigate = useNavigate()

  // Find order by ID
  const order = useMemo(() => {
    return orders.find((o) => o.id === id)
  }, [orders, id])

  // Return request states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({})
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({})
  const [generalComments, setGeneralComments] = useState('')

  // Action feedback states
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Tracking states
  const [trackingInfo, setTrackingInfo] = useState<any>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)

  React.useEffect(() => {
    if (order?.shipment?.awb) {
      const fetchTracking = async () => {
        setTrackingLoading(true)
        try {
          const token = localStorage.getItem('accessToken')
          const res = await fetch(`/api/orders/${order.id}/tracking`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (res.ok) {
            const data = await res.json()
            setTrackingInfo(data)
          }
        } catch (err) {
          console.error('Failed to fetch shipment tracking info:', err)
        } finally {
          setTrackingLoading(false)
        }
      }
      fetchTracking()
    }
  }, [order])

  if (loading && !order) {
    return (
      <PageContainer className="text-center py-20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <h2 className="text-xl font-heading text-ink">Loading order details...</h2>
        </div>
      </PageContainer>
    )
  }

  if (error && !order) {
    return (
      <PageContainer className="text-center py-20">
        <div className="bg-primary/10 border border-primary/25 p-6 rounded-lg text-primary text-sm font-semibold max-w-md mx-auto text-center space-y-4">
          <p>⚠️ Failed to load order: {error}</p>
          <button
            onClick={() => fetchOrders()}
            className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      </PageContainer>
    )
  }

  if (!order) {
    return (
      <PageContainer className="text-center py-20">
        <h2 className="text-3xl font-heading text-ink">Order Not Found</h2>
        <p className="text-ink-muted font-body mt-2">We couldn't locate this order detail log.</p>
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => fetchOrders()}
            className="bg-accent-blue hover:bg-accent-blue/90 text-white font-heading px-6 py-2 rounded-md shadow-xs"
          >
            Retry Connection
          </button>
          <Link
            to="/orders"
            className="bg-primary hover:bg-primary-hover text-white font-heading px-6 py-2 rounded-md shadow-xs transition"
          >
            Back to Orders
          </Link>
        </div>
      </PageContainer>
    )
  }

  const orderDate = new Date(order.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Horizontal tracker states definition
  const steps = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']
  const getStepIndex = (status: string) => {
    const cleanStatus = (status || '').toLowerCase().trim()
    if (cleanStatus === 'out for delivery') return 3 // map out for delivery near shipped
    return steps.indexOf(cleanStatus)
  }
  const currentStepIndex = getStepIndex(order.status)
  const isCancelled = (order.status || '').toLowerCase() === 'cancelled'

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setActionLoading(true)
      setActionError(null)
      setActionSuccess(null)
      try {
        await cancelOrder(order!.id)
        setActionSuccess('Order cancelled successfully.')
      } catch (err: any) {
        setActionError(err.message || 'Failed to cancel order.')
      } finally {
        setActionLoading(false)
      }
    }
  }

  const hasReturnWindowExpired = useMemo(() => {
    if (!order || order.status !== 'delivered') return true
    const deliveredHistory = (order as any).statusHistory?.find((h: any) => h.status?.toLowerCase() === 'delivered')
    const deliveryTime = deliveredHistory ? new Date(deliveredHistory.createdAt || deliveredHistory.timestamp).getTime() : new Date(order.timestamp).getTime()
    return (Date.now() - deliveryTime) > 7 * 24 * 60 * 60 * 1000
  }, [order])

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)
    const selectedItems = Object.keys(checkedItems).filter(key => checkedItems[key])
    if (selectedItems.length === 0) {
      setActionError('Please select at least one item to return.')
      return
    }

    // Ensure reason is specified for all selected items
    const itemsPayload = []
    for (const orderItemId of selectedItems) {
      const reason = returnReasons[orderItemId] || ''
      if (!reason.trim()) {
        setActionError('Please specify a reason for all selected return items.')
        return
      }
      itemsPayload.push({
        orderItemId,
        quantity: returnQuantities[orderItemId] || 1,
        reason: reason.trim()
      })
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/orders/${order!.id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: itemsPayload,
          comments: generalComments
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to submit return request.')
      }

      setActionSuccess('Return request submitted successfully!')
      setIsReturnModalOpen(false)
      navigate('/returns')
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit return request.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReorder = async () => {
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/orders/${order!.id}/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to reorder.')
      }
      const data = await res.json()
      
      // Update cart
      updateCartItemsRaw(data.cart)
      
      if (data.skippedItems && data.skippedItems.length > 0) {
        setActionError(`Reorder complete, but some items were skipped (out of stock or discontinued):\n${data.skippedItems.map((si: any) => `- ${si.title}`).join('\n')}`)
      } else {
        setActionSuccess('Items from this order have been added back to your cart!')
      }
      navigate('/cart')
    } catch (err: any) {
      setActionError(err.message || 'Failed to reorder.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadInvoice = () => {
    alert('Invoice Download: Simulated document compilation. Invoices are compiled server-side during Phase 4.')
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      {/* Back button */}
      <div className="text-left">
        <Link to="/orders" className="text-ink-muted hover:text-ink font-heading font-bold text-sm transition">
          &larr; Back to My Orders
        </Link>
      </div>

      {actionError && (
        <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold text-left">
          ⚠️ {actionError.split('\n').map((line, idx) => <span key={idx} className="block">{line}</span>)}
        </div>
      )}
      {actionSuccess && (
        <div className="bg-accent-teal/10 border border-accent-teal/30 p-3 rounded-lg text-accent-teal text-xs font-semibold text-left">
          ✓ {actionSuccess}
        </div>
      )}

      {/* Header Info */}
      <div className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl sm:text-3xl font-heading text-ink font-bold">
            Order #{order.id.split('-')[1] || order.id}
          </h1>
          <p className="text-sm font-body text-ink-muted">Placed on {orderDate}</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto select-none">
          {/* Cancel button (placed or confirmed status only) */}
          {(order.status === 'placed' || order.status === 'confirmed') && (
            <button
              onClick={handleCancelOrder}
              disabled={actionLoading}
              className="flex-grow md:flex-none btn-primary bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 font-heading font-bold text-xs px-5 py-2.5 rounded disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}

          {/* Request Return button */}
          {order.status === 'delivered' && !hasReturnWindowExpired && (
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="flex-grow md:flex-none btn-primary bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs px-5 py-2.5 rounded shadow-sm focus:outline-none"
            >
              Request Return ↩
            </button>
          )}

          {/* Reorder button */}
          <button
            onClick={handleReorder}
            className="flex-grow md:flex-none btn-primary bg-accent-yellow hover:bg-accent-yellow/95 text-ink font-heading font-bold text-xs px-5 py-2.5 rounded"
          >
            Reorder Items
          </button>

          {/* Invoice button stub */}
          <button
            onClick={handleDownloadInvoice}
            className="flex-grow md:flex-none btn-primary bg-surface hover:bg-bg/40 text-ink font-heading font-bold text-xs px-5 py-2.5 border border-border rounded"
          >
            Invoice 📄
          </button>
        </div>
      </div>

      {/* Horizontal Status Tracker */}
      <div className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-6 text-left">
        <h3 className="text-lg font-heading text-ink font-bold border-b border-border/40 pb-2">Order Status</h3>
        
        {isCancelled ? (
          <div className="p-4 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-sm text-center font-bold">
            ✖ This order has been cancelled and cannot be processed further.
          </div>
        ) : (
          <div className="relative pt-6 pb-2 select-none">
            {/* Status bar line */}
            <div className="absolute top-[42px] left-[18px] right-[18px] h-1.5 bg-border/60 z-0 rounded-full" />
            <div
              className="absolute top-[42px] left-[18px] h-1.5 bg-accent-teal z-0 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(Math.max(0, currentStepIndex) / 4) * 100}%` }}
            />

            {/* Steps circles */}
            <div className="relative z-10 flex justify-between">
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex
                const isActive = idx === currentStepIndex

                const formattedLabel = step === 'placed' ? 'Placed'
                                      : step === 'confirmed' ? 'Confirmed'
                                      : step === 'packed' ? 'Packed'
                                      : step === 'shipped' ? 'Shipped'
                                      : 'Delivered'

                return (
                  <div key={step} className="flex flex-col items-center text-center space-y-3">
                    <div
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-heading text-sm font-black transition-all duration-300 ${
                        isActive
                          ? 'bg-primary border-primary text-white scale-110 shadow-md ring-4 ring-primary/20 z-20'
                          : isCompleted
                          ? 'bg-accent-teal border-accent-teal text-white shadow-sm z-10'
                          : 'bg-surface border-border text-ink-muted/40 z-10'
                      }`}
                    >
                      {isCompleted && !isActive ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-heading font-black tracking-wide ${
                        isActive ? 'text-primary' : isCompleted ? 'text-ink font-bold' : 'text-ink-muted/70 font-semibold'
                      }`}
                    >
                      {formattedLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Shiprocket Tracking Details */}
      <div className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4 text-left">
        <h3 className="text-lg font-heading text-ink font-bold border-b border-border/40 pb-2">Shipping Details</h3>
        {order.shipment && order.shipment.awb ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-body">
              <div>
                <span className="text-ink-muted uppercase font-bold block mb-0.5">Courier Partner</span>
                <strong>{order.shipment.courier || 'Shiprocket Partner'}</strong>
              </div>
              <div>
                <span className="text-ink-muted uppercase font-bold block mb-0.5">AWB Tracking Number</span>
                <strong className="font-mono">{order.shipment.awb}</strong>
              </div>
              {order.shipment.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent-yellow hover:bg-accent-yellow/95 text-ink font-heading font-bold px-4 py-2 rounded text-xs transition focus:outline-none"
                >
                  Track Package 🔗
                </a>
              )}
            </div>

            {/* Tracking Log Timeline */}
            <div className="border-t border-border/40 pt-4">
              <span className="text-xs uppercase font-heading tracking-wider text-ink-muted font-bold block mb-3">Live Tracking Updates</span>
              {trackingLoading ? (
                <p className="text-xs italic text-ink-muted animate-pulse">Querying Shiprocket tracking network...</p>
              ) : trackingInfo?.events && trackingInfo.events.length > 0 ? (
                <div className="relative border-l border-border pl-5 ml-2.5 space-y-4">
                  {trackingInfo.events.map((event: any, idx: number) => (
                    <div key={idx} className="relative text-xs">
                      <span className="absolute -left-[27px] top-1 bg-surface border-2 border-primary h-3.5 w-3.5 rounded-full flex items-center justify-center">
                        <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                      </span>
                      <div className="flex flex-wrap items-center space-x-2">
                        <span className="font-heading font-bold text-ink">{event.activity}</span>
                        <span className="text-[10px] text-ink-muted font-mono">{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-ink-muted">Location: {event.location}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-ink-muted">Tracking not yet available. Package is being prepared for dispatch.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-ink-muted font-body">Tracking not yet available for this order.</p>
        )}
      </div>

      {/* Product Items List & Invoice Math Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
        {/* Purchased Products */}
        <div className="lg:col-span-2 card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4">
          <h3 className="text-lg font-heading text-ink border-b border-border/40 pb-3 font-bold">
            Items Ordered
          </h3>
          <div className="divide-y divide-border/60">
            {order.items.map((item) => (
              <div
                key={`${item.product.id}-${item.variant.name}`}
                className="py-4 flex items-center justify-between first:pt-0 last:pb-0"
              >
                <div className="flex items-center space-x-4">
                  {/* Thumbnail with wood grain */}
                  <div className="w-14 h-14 bg-border rounded flex items-center justify-center border border-border shrink-0 select-none overflow-hidden">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🧸</span>
                    )}
                  </div>
                  <div>
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="font-heading text-ink text-base hover:text-accent-blue transition line-clamp-1 font-bold"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-xs font-body text-ink-muted mt-0.5">Variant: {item.variant.name}</p>
                    <p className="text-xs font-body text-ink-muted">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-heading font-bold text-ink">
                  ₹{(item.product.discountPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address and Invoice Math Summary */}
        <div className="space-y-6">
          {/* Shipping address details */}
          <div className="card-workshop p-6 bg-surface border-b-[2.5px] border-border shadow-xs space-y-3">
            <h3 className="font-heading font-bold text-ink text-base border-b border-border/40 pb-2">
              Delivery Address
            </h3>
            <div className="text-xs sm:text-sm font-body text-ink space-y-1.5 leading-relaxed">
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              <p className="text-ink-muted font-bold mt-2 pt-1.5 border-t border-border/20">Phone: {order.address.phone}</p>
            </div>
          </div>

          {/* Payment Method / Status */}
          <div className="card-workshop p-6 bg-surface border-b-[2.5px] border-border shadow-xs space-y-3">
            <h3 className="font-heading font-bold text-ink text-base border-b border-border/40 pb-2">
              Payment Details
            </h3>
            <div className="text-xs sm:text-sm font-body text-ink space-y-1.5 leading-relaxed">
              <p>
                <span className="text-ink-muted">Method:</span> <strong>{order.paymentMethod}</strong>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-ink-muted">Status:</span>
                <BadgeTag text={order.paymentStatus} variant={order.paymentStatus === 'paid' ? 'green' : 'yellow'} className="scale-90 origin-left" />
              </p>
            </div>
          </div>

          {/* Summary calculations */}
          <div className="card-workshop p-6 bg-surface border-b-[2.5px] border-border shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-ink text-base border-b border-border/40 pb-2">
              Price Breakdown
            </h3>
            <div className="space-y-2.5 font-body text-xs sm:text-sm text-ink">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-accent-teal font-semibold">
                  <span>Discount</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>
                  {order.deliveryFee === 0 ? (
                    <span className="text-accent-teal font-bold">Free</span>
                  ) : (
                    `₹${order.deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2.5 font-heading text-sm sm:text-base font-bold text-ink">
                <span>Total</span>
                <span className="text-primary">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Return Request Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-surface border border-border rounded-lg shadow-xl max-w-lg w-full overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg/25">
              <h3 className="font-heading font-extrabold text-lg text-ink">Request Return</h3>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-ink-muted hover:text-ink text-xl font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="flex-grow overflow-y-auto p-6 space-y-4">
              {actionError && (
                <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold text-left">
                  ⚠️ {actionError}
                </div>
              )}
              <p className="text-xs text-ink-muted leading-relaxed">
                Select the items you wish to return, specifying the quantity and reason for each. Returns are subject to inspection.
              </p>

              <div className="space-y-4 border border-border/60 bg-bg/10 rounded-md p-4 max-h-[300px] overflow-y-auto">
                {order.items.map((item) => {
                  const isChecked = checkedItems[item.id] || false;
                  const maxQty = item.quantity;
                  const selectedQty = returnQuantities[item.id] || 1;
                  const reason = returnReasons[item.id] || '';

                  return (
                    <div key={item.id} className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0 space-y-2">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setCheckedItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="mt-1 accent-primary"
                        />
                        <div>
                          <p className="font-heading font-bold text-ink text-sm leading-tight">{item.product.title}</p>
                          <p className="text-xs text-ink-muted font-body mt-0.5">Variant: {item.variant.name} | Purchased: {item.quantity}</p>
                        </div>
                      </label>

                      {isChecked && (
                        <div className="pl-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <div>
                            <span className="block text-[10px] text-ink-muted uppercase font-bold mb-1">Return Qty</span>
                            <select
                              value={selectedQty}
                              onChange={(e) => setReturnQuantities(prev => ({ ...prev, [item.id]: parseInt(e.target.value) }))}
                              className="w-full bg-surface border border-border rounded p-1 text-xs focus:outline-none"
                            >
                              {Array.from({ length: maxQty }, (_, i) => i + 1).map(q => (
                                <option key={q} value={q}>{q}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="block text-[10px] text-ink-muted uppercase font-bold mb-1">Reason for Return</span>
                            <input
                              type="text"
                              value={reason}
                              onChange={(e) => setReturnReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="e.g., Damaged item"
                              className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs focus:outline-none"
                              required={isChecked}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase mb-1">General Comments / Notes (Optional)</label>
                <textarea
                  value={generalComments}
                  onChange={(e) => setGeneralComments(e.target.value)}
                  placeholder="Provide any additional comments here..."
                  className="w-full bg-surface border border-border rounded p-2 text-xs h-16 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="border-t border-border pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  disabled={actionLoading}
                  className="bg-surface hover:bg-bg/40 text-ink font-heading font-bold text-xs px-4 py-2 border border-border rounded focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs px-4 py-2 rounded focus:outline-none disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default OrderDetail
