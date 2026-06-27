import React, { useState, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'

const FINANCE_PASS_KEY = 'financeAccessCode'
const DEFAULT_PASS = '1234'

type Tab = 'general' | 'security'

export const Settings: React.FC = () => {
  const { settings, settingsLoading, fetchSettings, updateSettings } = useAdminData()

  // ── Tab State ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('general')

  // ── General Settings State ────────────────────────────────────────────────
  const [storeName, setStoreName] = useState('')
  const [supportContact, setSupportContact] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [lowStockThreshold, setLowStockThreshold] = useState('10')
  const [codToggle, setCodToggle] = useState(true)
  const [onlineToggle, setOnlineToggle] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Security / Password State ─────────────────────────────────────────────
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState(false)
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  // ── General Settings Fetch / Sync ──────────────────────────────────────
  const handleFetch = async () => {
    setLoadError(null)
    try {
      await fetchSettings()
    } catch (err: any) {
      setLoadError(err.message || 'Failed to fetch settings configurations.')
    }
  }

  useEffect(() => { handleFetch() }, [])

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName)
      setSupportContact(settings.supportContact)
      setCurrency(settings.currency)
      setLowStockThreshold(settings.lowStockThreshold.toString())
      setCodToggle(settings.codToggle)
      setOnlineToggle(settings.onlineToggle)
    }
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName.trim() || !supportContact.trim() || !currency.trim()) {
      setSaveError('Please fill out all required fields')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateSettings({
        storeName: storeName.trim(),
        supportContact: supportContact.trim(),
        currency: currency.trim(),
        lowStockThreshold: parseInt(lowStockThreshold) || 0,
        codToggle,
        onlineToggle
      })
      setSaveSuccess(true)
    } catch (err: any) {
      setSaveError(err.message || 'Error updating settings')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Password Change Handler ───────────────────────────────────────────────
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)
    setPassSuccess(false)

    const stored = localStorage.getItem(FINANCE_PASS_KEY) || DEFAULT_PASS

    if (currentPass !== stored) {
      setPassError('Current access code is incorrect.')
      return
    }
    if (!newPass.trim() || newPass.length < 4) {
      setPassError('New access code must be at least 4 characters.')
      return
    }
    if (newPass !== confirmPass) {
      setPassError('New access codes do not match.')
      return
    }

    localStorage.setItem(FINANCE_PASS_KEY, newPass)
    // Lock any existing session so the new code is required next time
    sessionStorage.removeItem('financeUnlocked')

    setPassSuccess(true)
    setCurrentPass('')
    setNewPass('')
    setConfirmPass('')
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔐' }
  ]

  return (
    <div className="space-y-6 text-left max-w-2xl">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-ink">Global Store Settings</h2>
        <p className="text-[11px] text-ink-muted leading-normal">
          Configure general store attributes, payment gateways, and access security settings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-heading font-bold transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          {settingsLoading && !settings ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-xs text-ink-muted italic">Querying global configuration values from server...</p>
            </div>
          ) : loadError && !settings ? (
            <div className="p-8 text-center space-y-4">
              <p className="text-sm text-primary font-semibold">⚠️ {loadError}</p>
              <button
                onClick={handleFetch}
                className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="divide-y divide-border/60">
              {/* Inline Notifications */}
              {(saveError || saveSuccess) && (
                <div className="p-5 pb-0">
                  {saveError && (
                    <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                      ⚠️ {saveError}
                    </div>
                  )}
                  {saveSuccess && (
                    <div className="bg-accent-teal/10 border border-accent-teal/30 p-3 rounded-lg text-accent-teal text-xs font-semibold">
                      ✓ Global configurations updated successfully!
                    </div>
                  )}
                </div>
              )}

              {/* Identity & Support */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-ink uppercase">Store Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-ink-muted uppercase">Store Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Toy-n-Joy"
                      className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-semibold text-ink"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-ink-muted uppercase">Support Contact Email</label>
                    <input
                      type="email"
                      value={supportContact}
                      onChange={(e) => setSupportContact(e.target.value)}
                      placeholder="support@toynjoy.online"
                      className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono text-ink"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-ink-muted uppercase">Default Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono cursor-pointer"
                    >
                      <option value="USD">USD ($) - United States Dollar</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-ink-muted uppercase">Low-Stock Notification Limit</label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono text-ink"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Checkouts Payment Integrations */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-ink uppercase">Payment Gateways</h3>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Toggle checkout gateways to enable/disable payment options for customers storefront checkouts.
                </p>

                <div className="space-y-3 pt-1">
                  {/* Online gateway toggle */}
                  <div className="flex items-center justify-between bg-bg border border-border/60 p-3 rounded-lg">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-semibold text-ink">Razorpay Online Payment Gateway</span>
                      <span className="block text-[10px] text-ink-muted">Credit/Debit cards, UPI, Wallets, and Netbanking checkouts.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={onlineToggle}
                      onChange={(e) => setOnlineToggle(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                  </div>

                  {/* COD Toggle */}
                  <div className="flex items-center justify-between bg-bg border border-border/60 p-3 rounded-lg">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-semibold text-ink">Cash on Delivery (COD)</span>
                      <span className="block text-[10px] text-ink-muted">Accept cash payments from customers upon product delivery.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={codToggle}
                      onChange={(e) => setCodToggle(e.target.checked)}
                      className="h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Bar */}
              <div className="p-4 bg-bg/25 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-5 py-2.5 rounded shadow-xs focus:outline-none disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving Configurations...' : 'Save Global Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── SECURITY TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-secondary/5 border border-secondary/15 rounded-lg p-4 flex gap-3 items-start">
            <span className="text-xl mt-0.5">🔐</span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-ink">Finance Center Access Code</p>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                This code is required each time someone opens the Finance Center page.
                The default code is <strong className="font-mono text-ink">1234</strong>.
                Changes take effect immediately and will lock any active Finance sessions.
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-bg/25">
              <h3 className="text-xs font-bold text-ink uppercase">Change Finance Access Code</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="p-5 space-y-5">
              {/* Inline alerts */}
              {passError && (
                <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                  ⚠️ {passError}
                </div>
              )}
              {passSuccess && (
                <div className="bg-accent-teal/10 border border-accent-teal/30 p-3 rounded-lg text-accent-teal text-xs font-semibold">
                  ✓ Finance access code updated successfully! Any existing sessions have been locked.
                </div>
              )}

              {/* Current code */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">
                  Current Access Code
                </label>
                <div className="relative">
                  <input
                    id="settings-current-pass"
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPass}
                    onChange={(e) => { setCurrentPass(e.target.value); setPassError(null); setPassSuccess(false) }}
                    placeholder="Enter current code"
                    className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono text-ink pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-[11px] font-semibold transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrentPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* New code */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">
                  New Access Code
                </label>
                <div className="relative">
                  <input
                    id="settings-new-pass"
                    type={showNewPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => { setNewPass(e.target.value); setPassError(null); setPassSuccess(false) }}
                    placeholder="Minimum 4 characters"
                    className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono text-ink pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-[11px] font-semibold transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm code */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">
                  Confirm New Access Code
                </label>
                <div className="relative">
                  <input
                    id="settings-confirm-pass"
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); setPassError(null); setPassSuccess(false) }}
                    placeholder="Re-enter new code"
                    className={`w-full px-3 py-2 bg-bg border rounded text-xs focus:outline-none font-mono text-ink pr-10 transition-colors ${
                      confirmPass && confirmPass !== newPass
                        ? 'border-primary focus:border-primary'
                        : 'border-border focus:border-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-[11px] font-semibold transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirmPass && confirmPass !== newPass && (
                  <p className="text-[10px] text-primary font-medium">Codes do not match</p>
                )}
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={!currentPass || !newPass || !confirmPass}
                  className="bg-secondary hover:opacity-90 text-white text-xs font-extrabold px-5 py-2.5 rounded shadow-xs focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Update Access Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
