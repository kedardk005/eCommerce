import React, { useState, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'

const FINANCE_PASS_KEY = 'financeAccessCode'
const DEFAULT_PASS = '1234'

// ─── Password Gate ────────────────────────────────────────────────────────────
const FinancePasswordGate: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const stored = localStorage.getItem(FINANCE_PASS_KEY) || DEFAULT_PASS
    if (input === stored) {
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className={`bg-surface border border-border rounded-xl shadow-lg p-8 w-full max-w-sm text-center space-y-6 ${shake ? 'animate-[shake_0.6s_ease]' : ''}`}
        style={shake ? { animation: 'shake 0.6s ease' } : {}}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-heading font-extrabold text-ink">Finance Center</h2>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            This section contains sensitive financial data.<br />
            Please enter your access code to continue.
          </p>
        </div>

        {/* PIN input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <input
              id="finance-access-code"
              type="password"
              inputMode="numeric"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false) }}
              placeholder="Enter access code"
              autoFocus
              className={`w-full text-center tracking-[0.4em] text-lg font-mono px-4 py-2.5 rounded-lg border focus:outline-none transition-colors ${
                error
                  ? 'border-primary bg-primary/5 text-primary placeholder-primary/40'
                  : 'border-border bg-bg text-ink focus:border-secondary'
              }`}
              maxLength={8}
            />
            {error && (
              <p className="text-[11px] text-primary font-semibold animate-fade-in-down">
                ⚠️ Incorrect access code. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full bg-secondary hover:opacity-90 text-white font-heading font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Unlock Finance Center
          </button>
        </form>

        <p className="text-[10px] text-ink-muted italic">
          You can change the access code under Settings → Security.
        </p>
      </div>

      {/* Keyframe for shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

// ─── Main Finance Page ────────────────────────────────────────────────────────
export const Finance: React.FC = () => {
  const {
    financeSummary,
    financeTransactions,
    financeLoading,
    fetchFinanceSummary,
    fetchFinanceTransactions
  } = useAdminData()

  // Password gate state — persisted for the browser session
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem('financeUnlocked') === 'true'
  })

  const handleUnlock = () => {
    sessionStorage.setItem('financeUnlocked', 'true')
    setUnlocked(true)
  }

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
    if (unlocked) {
      handleFetchAll()
    }
  }, [unlocked, filterType, startDate, endDate, page])



  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val)

  const handleResetFilters = () => {
    setFilterType('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  // Show gate if locked
  if (!unlocked) {
    return <FinancePasswordGate onUnlock={handleUnlock} />
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Finance Center</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Real-time aggregate totals, net profit margins, and detailed transaction records.
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('financeUnlocked')
            setUnlocked(false)
          }}
          className="mt-2 sm:mt-0 text-[10px] text-ink-muted hover:text-primary font-semibold flex items-center gap-1 transition-colors"
        >
          🔒 Lock Finance
        </button>
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
          {/* ── Overall Revenue Till Date — Hero Card ── */}
          <div className="bg-secondary text-white rounded-xl shadow-md p-5 relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -left-4 -bottom-6 h-24 w-24 rounded-full bg-white/5 blur-xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">💰 Overall Revenue Till Date</p>
                {financeSummary ? (
                  <>
                    <p className="text-4xl font-heading font-extrabold mt-2 text-white">
                      {formatINR(financeSummary.revenue)}
                    </p>
                    <span className="text-[10px] text-white/50 mt-1 block">
                      All captured payments · Net margin: {formatINR(financeSummary.net)}
                    </span>
                  </>
                ) : (
                  <div className="mt-2 space-y-2 animate-pulse">
                    <div className="h-9 w-48 bg-white/15 rounded-lg" />
                    <div className="h-3 w-64 bg-white/10 rounded" />
                  </div>
                )}
              </div>

              {financeSummary && (
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-left min-w-[110px]">
                    <p className="text-[9px] uppercase font-semibold text-white/55">Total Refunds</p>
                    <p className="text-base font-mono font-bold text-white/90 mt-0.5">{formatINR(financeSummary.refunds)}</p>
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-left min-w-[110px]">
                    <p className="text-[9px] uppercase font-semibold text-white/55">Pending COD</p>
                    <p className="text-base font-mono font-bold text-white/90 mt-0.5">{formatINR(financeSummary.pendingCod)}</p>
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-left min-w-[110px]">
                    <p className="text-[9px] uppercase font-semibold text-white/55">Net Margin</p>
                    <p className="text-base font-mono font-bold text-white/90 mt-0.5">{formatINR(financeSummary.net)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">🟢 Total Revenue</span>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-ink">
                  {financeSummary ? formatINR(financeSummary.revenue) : '₹0.00'}
                </span>
                <span className="text-[10px] text-accent-teal font-medium bg-accent-teal/10 px-1.5 py-0.5 rounded">Paid Payments</span>
              </div>
            </div>

            {/* Total Refunds */}
            <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">🔴 Total Refunds</span>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-primary">
                  {financeSummary ? formatINR(financeSummary.refunds) : '₹0.00'}
                </span>
                <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">Processed Returns</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">💎 Net Margin</span>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-accent-teal">
                  {financeSummary ? formatINR(financeSummary.net) : '₹0.00'}
                </span>
                <span className="text-[10px] text-accent-teal font-medium bg-accent-teal/10 px-1.5 py-0.5 rounded">Revenue - Refunds</span>
              </div>
            </div>

            {/* Pending COD Collections */}
            <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">📦 Pending COD Collections</span>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-ink-muted">
                  {financeSummary ? formatINR(financeSummary.pendingCod) : '₹0.00'}
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
                    onChange={(e) => { setFilterType(e.target.value as any); setPage(1) }}
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
                    onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                    className="px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer font-mono"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-ink-muted uppercase">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
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
                      <th className="px-4 py-2.5">Date &amp; Time</th>
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
                            {tx.type === 'payment'
                              ? `+${formatINR(tx.amount)}`
                              : `-${formatINR(tx.amount)}`}
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
