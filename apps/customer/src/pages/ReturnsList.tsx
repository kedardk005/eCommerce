import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'
import EmptyState from '../components/EmptyState'

interface ReturnRequest {
  id: string
  orderId: string
  customerName: string
  reason: string
  rejectReason?: string
  status: 'Requested' | 'Approved' | 'Rejected' | 'Refunded'
  refundAmount: number
  refundStatus: string
  date: string
  items: {
    id: string
    productTitle: string
    variantName: string
    quantity: number
    price: number
  }[]
}

export const ReturnsList: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchReturnsList = async (cursorToUse?: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const url = cursorToUse
        ? `/api/returns?cursor=${cursorToUse}&limit=10`
        : '/api/returns?limit=10'
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error('Failed to load return requests')
      }
      const data = await res.json()
      const rawReturns = data.items || data.returns || []
      if (cursorToUse) {
        setReturns(prev => [...prev, ...rawReturns])
      } else {
        setReturns(rawReturns)
      }
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturnsList()
  }, [])

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

  if (loading && returns.length === 0) {
    return (
      <PageContainer className="text-center py-20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <h2 className="text-xl font-heading text-ink">Loading Return Requests...</h2>
        </div>
      </PageContainer>
    )
  }

  if (error && returns.length === 0) {
    return (
      <PageContainer className="text-center py-20">
        <div className="bg-primary/10 border border-primary/25 p-6 rounded-lg text-primary text-sm font-semibold max-w-md mx-auto text-center space-y-4">
          <p>⚠️ Failed to load return requests: {error}</p>
          <button
            onClick={() => fetchReturnsList()}
            className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      </PageContainer>
    )
  }

  if (returns.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          title="No Return Requests Logged"
          message="You haven't requested any returns or replacements yet."
          buttonText="View My Orders"
          buttonLink="/orders"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Returns Tracker</span>
        <h1 className="text-3xl sm:text-4xl font-heading text-ink tracking-tight mb-1 font-bold">My Returns</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Check the status of your return requests and processed refunds.</p>
      </div>

      {error && (
        <div className="bg-primary/10 border border-primary/25 p-4 rounded-lg text-primary text-xs mb-3 text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-semibold">
          <span className="flex items-center">
            <span className="mr-2 text-sm">⚠️</span> {error}
          </span>
          <button
            onClick={() => fetchReturnsList()}
            className="bg-primary text-white font-heading font-bold text-[10px] px-3.5 py-1.5 rounded uppercase hover:bg-primary-hover tracking-wider select-none shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      <div className="space-y-5 text-left">
        {returns.map((ret) => {
          const totalItemsCount = ret.items.reduce((acc, item) => acc + item.quantity, 0)
          
          return (
            <div
              key={ret.id}
              className="card-workshop p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-[2.5px] border-border/60 bg-surface shadow-xs"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-heading font-bold text-base sm:text-lg text-ink">
                    Request ID: {ret.id}
                  </span>
                  <BadgeTag text={ret.status} variant={getStatusVariant(ret.status)} />
                </div>
                <div className="text-xs sm:text-sm font-body text-ink flex flex-wrap gap-x-6 gap-y-1">
                  <p>
                    <span className="text-ink-muted">Order ID:</span> <strong className="font-mono">{ret.orderId}</strong>
                  </p>
                  <p>
                    <span className="text-ink-muted">Date:</span> <strong>{ret.date}</strong>
                  </p>
                  <p>
                    <span className="text-ink-muted">Items:</span> <strong>{totalItemsCount} toys</strong>
                  </p>
                  <p>
                    <span className="text-ink-muted">Est. Refund:</span>{' '}
                    <strong className="text-primary">₹{ret.refundAmount.toFixed(2)}</strong>
                  </p>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto select-none">
                <Link
                  to={`/returns/${ret.id}`}
                  className="w-full sm:w-auto text-center py-2 px-6 btn-primary bg-surface hover:bg-bg border border-border text-ink font-heading font-bold text-xs rounded"
                >
                  View Status &rarr;
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={() => fetchReturnsList(nextCursor || undefined)}
            className="btn-primary bg-primary hover:bg-primary-hover/95 text-white font-heading font-bold px-8 py-3 rounded-lg shadow-sm"
          >
            Load More Returns
          </button>
        </div>
      )}
    </PageContainer>
  )
}

export default ReturnsList
