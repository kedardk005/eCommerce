import React, { useState, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'

export const Finance: React.FC = () => {
  const {
    financeSummary,
    financeTransactions,
    financeLoading,
    fetchFinanceSummary,
    fetchFinanceTransactions
  } = useAdminData()

  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'refund'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const [loadError, setLoadError] = useState<string | null>(null)

  const handleFetchAll = async () => {
    setLoadError(null)
    try {
      await Promise.all([
        fetchFinanceSummary(),
        fetchFinanceTransactions({
          type: filterType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page
        })
      ])
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load financial records.')
    }
  }

  useEffect(() => {
    handleFetchAll()
  }, [filterType, startDate, endDate, page])

  const handleResetFilters = () => {
    setFilterType('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-ink">Finance Center</h2>
        <p className="text-[11px] text-ink-muted leading-normal">
          Real-time aggregate totals, net profit margins, and detailed records derived dynamically from Payments and Return Refunds.
        </p>
      </div>

      {loadError && !financeSummary ? (
        <div className="bg-primary/10 border border-primary/25 p-6 rounded-lg text-primary text-sm font-semibold max-w-md mx-auto text-center space-y-4">
          <p>⚠️ Failed to load finance data: {loadError}</p>
          <button
            onClick={handleFetchAll}
            className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      ) : financeLoading && !financeSummary ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-surface border border-border rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-xs text-ink-muted italic">Querying financial records from server...</p>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">🟢 Total Revenue</span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-ink">
              ${financeSummary?.revenue.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-accent-teal font-medium bg-accent-teal/10 px-1.5 py-0.5 rounded">Paid Payments</span>
          </div>
        </div>

        {/* Total Refunds */}
        <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">🔴 Total Refunds</span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-primary">
              ${financeSummary?.refunds.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">Processed Returns</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">💎 Net Margin</span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-accent-teal">
              ${financeSummary?.net.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-accent-teal font-medium bg-accent-teal/10 px-1.5 py-0.5 rounded">Revenue - Refunds</span>
          </div>
        </div>

        {/* Pending COD Collections */}
        <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">📦 Pending COD Collections</span>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-ink-muted">
              ${financeSummary?.pendingCod.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-ink-muted font-medium bg-bg px-1.5 py-0.5 rounded">In-transit COD</span>
          </div>
        </div>
      </div>

      {/* Filters & Transaction Logs */}
      <div className="space-y-4">
        {/* Filters Header block */}
        <div className="bg-surface border border-border p-3.5 rounded-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Filter by Type */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-ink-muted uppercase">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as any)
                  setPage(1)
                }}
                className="px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">All Transactions</option>
                <option value="payment">🟢 Payments Only</option>
                <option value="refund">🔴 Refunds Only</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-ink-muted uppercase">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer font-mono"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-ink-muted uppercase">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
                className="px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-bg border border-border hover:bg-bg/40 text-xs font-semibold rounded focus:outline-none transition-colors"
            >
              🔄 Reset Filters
            </button>
            <button
              onClick={() => fetchFinanceSummary()}
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold rounded focus:outline-none transition-colors"
            >
              ⚡ Sync KPI Summary
            </button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                  <th className="px-4 py-2.5">Transaction ID</th>
                  <th className="px-4 py-2.5">Order ID</th>
                  <th className="px-4 py-2.5">Customer Name</th>
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Gateway / Method</th>
                  <th className="px-4 py-2.5 text-center">Type</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {financeLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ink-muted italic">
                      Querying transactions records...
                    </td>
                  </tr>
                ) : financeTransactions.length > 0 ? (
                  financeTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-bg/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">{tx.id}</td>
                      <td className="px-4 py-3 font-mono text-ink-muted">{tx.orderId}</td>
                      <td className="px-4 py-3 font-bold text-ink">{tx.customerName}</td>
                      <td className="px-4 py-3 font-mono text-ink-muted">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{tx.method}</td>
                      <td className="px-4 py-3 text-center">
                        {tx.type === 'payment' ? (
                          <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-accent-teal/20 text-accent-teal border-accent-teal/30">
                            Payment
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-primary/20 text-primary border-primary/30">
                            Refund
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold text-sm ${
                        tx.type === 'payment' ? 'text-accent-teal' : 'text-primary'
                      }`}>
                        {tx.type === 'payment' ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ink-muted italic">
                      No matching transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simple pagination footer */}
        <div className="flex justify-between items-center text-xs text-ink-muted px-1">
          <span>Viewing filtered transactional logs</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-2 py-1 border border-border rounded hover:bg-bg disabled:opacity-40"
            >
              ◀ Previous
            </button>
            <span className="font-mono text-ink font-semibold">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={financeTransactions.length < 50}
              className="px-2 py-1 border border-border rounded hover:bg-bg disabled:opacity-40"
            >
              Next ▶
            </button>
          </div>
          </div>
        </div>
      </>
      )}
    </div>
  )
}

export default Finance
