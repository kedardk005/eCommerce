import React, { useState } from 'react'
import { useAdminData } from '../context/AdminDataContext'

export const Returns: React.FC = () => {
  const { returns, processReturn } = useAdminData()

  // Currently inspected request state
  const [selectedReqId, setSelectedReqId] = useState<string | null>(returns[0]?.id || null)
  const [rejectReasonText, setRejectReasonText] = useState('')
  const [returnError, setReturnError] = useState<string | null>(null)
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const activeRequest = returns.find(r => r.id === selectedReqId)

  const handleApprove = async (id: string) => {
    setIsProcessing(true)
    setReturnError(null)
    setReturnSuccess(null)
    try {
      await processReturn(id, 'approve')
      setReturnSuccess('Return request approved successfully!')
    } catch (err: any) {
      setReturnError(err.message || 'Failed to approve return request.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!rejectReasonText.trim()) {
      setReturnError('Please specify a rejection reason.')
      return
    }
    setIsProcessing(true)
    setReturnError(null)
    setReturnSuccess(null)
    try {
      await processReturn(id, 'reject', rejectReasonText.trim())
      setRejectReasonText('')
      setReturnSuccess('Return request rejected successfully!')
    } catch (err: any) {
      setReturnError(err.message || 'Failed to reject return request.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkRefunded = async (id: string) => {
    setIsProcessing(true)
    setReturnError(null)
    setReturnSuccess(null)
    try {
      await processReturn(id, 'refund')
      setReturnSuccess('Return marked as refunded successfully!')
    } catch (err: any) {
      setReturnError(err.message || 'Failed to mark return as refunded.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Get status tag color classes
  const getReturnStatusBadge = (status: string) => {
    switch (status) {
      case 'Requested':
        return 'bg-accent-yellow/10 text-ink border border-accent-yellow/30'
      case 'Approved':
        return 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20'
      case 'Rejected':
        return 'bg-primary/15 text-primary border border-primary/25'
      case 'Refunded':
        return 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30'
      default:
        return 'bg-bg text-ink-muted border border-border'
    }
  }

  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="border-b border-border pb-3 text-left">
        <h2 className="text-xl font-heading font-extrabold text-ink">Returns & Refunds Manager</h2>
        <p className="text-[11px] text-ink-muted leading-normal">
          Review buyer return queries, verify packaging issues, and log settlement overrides.
        </p>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-left">
        {/* Left 2 Columns: Requests Listing Table */}
        <div className="lg:col-span-2 bg-surface border border-border rounded shadow-sm overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-border bg-bg/25">
            <h3 className="text-xs font-heading font-bold text-ink">Return Requests Directory</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-bg/60 border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                  <th className="px-4 py-2.5">Request ID</th>
                  <th className="px-4 py-2.5">Order ID</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-center">Date</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {returns.length > 0 ? (
                  returns.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`hover:bg-bg cursor-pointer transition-colors ${
                        selectedReqId === req.id ? 'bg-primary/10 font-medium' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-ink">{req.id}</td>
                      <td className="px-4 py-3 font-mono text-ink-muted">{req.orderId}</td>
                      <td className="px-4 py-3 text-ink font-semibold">{req.customerName}</td>
                      <td className="px-4 py-3 text-center text-ink-muted">{req.date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded-full border ${getReturnStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-muted italic">
                      No return requests logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Selected Request Inspection/Action Panel */}
        <div className="space-y-4">
          <div className="bg-surface border border-border p-4 rounded shadow-sm text-xs">
            <h3 className="text-xs font-heading font-bold text-ink border-b border-border pb-2 mb-3">
              Request Details Inspection
            </h3>

            {returnError && (
              <div className="bg-primary/10 border border-primary/25 p-2.5 rounded-lg text-primary text-xs font-semibold mb-3">
                ⚠️ {returnError}
              </div>
            )}
            {returnSuccess && (
              <div className="bg-accent-teal/10 border border-accent-teal/30 p-2.5 rounded-lg text-accent-teal text-xs font-semibold mb-3">
                ✓ {returnSuccess}
              </div>
            )}

            {activeRequest ? (
              <div className="space-y-4">
                {/* ID codes & Dates */}
                <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2 text-[11px]">
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase font-semibold block">Request ID</span>
                    <strong className="font-mono text-ink">{activeRequest.id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase font-semibold block">Order Ref</span>
                    <strong className="font-mono text-ink">{activeRequest.orderId}</strong>
                  </div>
                </div>

                {/* Customer name */}
                <div>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">Buyer Name</span>
                  <span className="font-semibold text-ink">{activeRequest.customerName}</span>
                </div>

                {/* Returned items */}
                <div>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block mb-1">Items for return</span>
                  <div className="bg-bg border border-border p-2 rounded space-y-1">
                    {activeRequest.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-ink">
                        <span className="font-semibold">{item.productTitle}</span>
                        <span className="text-ink-muted font-mono font-bold">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return reason */}
                <div>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block mb-0.5">Return Reason</span>
                  <p className="text-ink leading-relaxed bg-bg/40 p-2 rounded border border-border/40 text-[11px]">
                    "{activeRequest.reason}"
                  </p>
                </div>

                {/* Status indicator */}
                <div className="border-t border-border/60 pt-3">
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block mb-1">Status State</span>
                  <div className="flex items-center justify-between">
                    <span className={`inline-block text-[10px] font-heading font-extrabold px-3 py-0.5 rounded-full border ${getReturnStatusBadge(activeRequest.status)}`}>
                      {activeRequest.status}
                    </span>
                    <span className="text-[10px] text-ink-muted font-mono">{activeRequest.date}</span>
                  </div>
                </div>

                {/* Rejection Reason display if rejected */}
                {activeRequest.status === 'Rejected' && activeRequest.rejectReason && (
                  <div className="bg-primary/5 border border-primary/20 text-primary p-2.5 rounded">
                    <strong className="block text-[10px] uppercase font-semibold">Rejection Reason:</strong>
                    <p className="mt-0.5 leading-normal text-[11px]">{activeRequest.rejectReason}</p>
                  </div>
                )}

                {/* --- ACTION GATES --- */}
                {/* 1. If Requested: show Approve and Reject options */}
                {activeRequest.status === 'Requested' && (
                  <div className="border-t border-border pt-4 space-y-4">
                    {/* Approve button */}
                    <button
                      onClick={() => handleApprove(activeRequest.id)}
                      disabled={isProcessing}
                      className="w-full bg-accent-blue hover:opacity-90 text-white font-heading font-bold py-2 px-4 rounded text-xs transition-colors shadow-sm focus:outline-none disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : '✓ Approve Return Request'}
                    </button>

                    {/* Reject form panel */}
                    <div className="bg-bg border border-border p-3 rounded space-y-2">
                      <h4 className="font-heading font-bold text-ink text-[10px] uppercase">Reject Request Form</h4>
                      <form onSubmit={(e) => handleReject(e, activeRequest.id)} className="space-y-2">
                        <input
                          type="text"
                          value={rejectReasonText}
                          disabled={isProcessing}
                          onChange={(e) => setRejectReasonText(e.target.value)}
                          placeholder="Rejection reason details..."
                          className="w-full px-2 py-1.5 bg-surface border border-border rounded text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full bg-primary hover:opacity-90 text-white font-heading font-bold py-1.5 px-3 rounded text-[11px] transition-colors focus:outline-none disabled:opacity-50"
                        >
                          &times; Reject Request
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* 2. If Approved: show Mark Refunded options */}
                {activeRequest.status === 'Approved' && (
                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => handleMarkRefunded(activeRequest.id)}
                      disabled={isProcessing}
                      className="w-full bg-accent-teal hover:opacity-90 text-white font-heading font-bold py-2 px-4 rounded text-xs transition-colors shadow-sm focus:outline-none disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : '💵 Mark as Refunded'}
                    </button>
                    <p className="text-[10px] text-ink-muted mt-2 leading-normal italic text-center">
                      * Note: This will trigger the Razorpay refund transaction and update the billing parameters on the order record.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-ink-muted italic">
                Select a return request from the directory to review details and take actions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Returns
