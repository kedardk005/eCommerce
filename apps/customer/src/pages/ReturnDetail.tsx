import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'

interface ReturnDetailItem {
  id: string
  productTitle: string
  variantName: string
  quantity: number
  price: number
  productImage?: string | null
}

interface ReturnRequestDetail {
  id: string
  orderId: string
  customerName: string
  reason: string
  rejectReason?: string
  status: 'Requested' | 'Approved' | 'Rejected' | 'Refunded'
  refundAmount: number
  refundStatus: string
  date: string
  items: ReturnDetailItem[]
}

export const ReturnDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [ret, setRet] = useState<ReturnRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReturnDetail = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/returns/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error('Failed to load return request details')
      }
      const data = await res.json()
      setRet(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturnDetail()
  }, [id])

  const getStatusVariant = (status: string): 'red' | 'yellow' | 'green' | 'blue' | 'secondary' | 'default' => {
    switch (status) {
      case 'Requested':
        return 'yellow'
      case 'Approved':
        return 'blue'
      case 'Rejected':
        return 'red'
      case 'Refunded':
        return 'green'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <PageContainer className="text-center py-20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <h2 className="text-xl font-heading text-ink">Loading Return Details...</h2>
        </div>
      </PageContainer>
    )
  }

  if (error || !ret) {
    return (
      <PageContainer className="text-center py-20 space-y-4">
        <h2 className="text-3xl font-heading text-ink font-bold">Return Request Not Found</h2>
        <p className="text-ink-muted font-body">{error || "We couldn't retrieve the logs for this return request."}</p>
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => fetchReturnDetail()}
            className="bg-accent-blue hover:bg-accent-blue/90 text-white font-heading px-6 py-2 rounded-md shadow-xs"
          >
            Retry Connection
          </button>
          <Link
            to="/returns"
            className="bg-primary hover:bg-primary-hover text-white font-heading px-6 py-2 rounded-md shadow-xs transition"
          >
            Back to My Returns
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      {/* Back button */}
      <div className="text-left">
        <Link to="/returns" className="text-ink-muted hover:text-ink font-heading font-bold text-sm transition">
          &larr; Back to My Returns
        </Link>
      </div>

      {/* Header card */}
      <div className="card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl sm:text-3xl font-heading text-ink font-bold">
            Return Request #{ret.id.substring(ret.id.length - 6).toUpperCase()}
          </h1>
          <p className="text-sm font-body text-ink-muted">Requested on {ret.date}</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto select-none">
          <BadgeTag text={ret.status} variant={getStatusVariant(ret.status)} className="text-sm px-4 py-1.5" />
        </div>
      </div>

      {/* Rejection notice if rejected */}
      {ret.status === 'Rejected' && ret.rejectReason && (
        <div className="p-4 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-sm text-left">
          <strong className="block text-xs uppercase font-heading font-bold mb-1">Rejection Reason Details:</strong>
          {ret.rejectReason}
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
        {/* Left 2 columns: Returned Items List */}
        <div className="lg:col-span-2 card-workshop p-6 bg-surface border-b-[3px] border-primary shadow-xs space-y-4">
          <h3 className="text-lg font-heading text-ink border-b border-border/40 pb-3 font-bold">
            Items for Return
          </h3>
          <div className="divide-y divide-border/60">
            {ret.items.map((item) => (
              <div key={item.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-border rounded flex items-center justify-center border border-border shrink-0 select-none overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🧸</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading text-ink text-sm font-bold">{item.productTitle}</h4>
                    <p className="text-xs font-body text-ink-muted mt-0.5">Variant: {item.variantName}</p>
                    <p className="text-xs font-body text-ink-muted">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-heading font-bold text-ink">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 column: Summary and Status Steps */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="card-workshop p-6 bg-surface border-b-[2.5px] border-border shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-ink text-base border-b border-border/40 pb-2">
              Return Details
            </h3>
            
            <div className="space-y-3 font-body text-xs sm:text-sm text-ink">
              <div>
                <span className="text-ink-muted block text-[10px] uppercase font-bold mb-0.5">Associated Order</span>
                <Link to={`/orders/${ret.orderId}`} className="font-mono font-bold text-accent-blue hover:underline">
                  #{ret.orderId.substring(ret.orderId.length - 6).toUpperCase()}
                </Link>
              </div>

              <div>
                <span className="text-ink-muted block text-[10px] uppercase font-bold mb-0.5">Return Reason / Notes</span>
                <p className="bg-bg/50 border border-border/50 p-2.5 rounded text-xs leading-relaxed italic">
                  "{ret.reason}"
                </p>
              </div>

              <div className="border-t border-border/30 pt-3 flex justify-between items-center font-heading text-base font-bold text-ink">
                <span>Est. Refund Total</span>
                <span className="text-primary">₹{ret.refundAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default ReturnDetail
