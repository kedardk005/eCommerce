import React, { useState, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'

export const Settings: React.FC = () => {
  const { settings, settingsLoading, fetchSettings, updateSettings } = useAdminData()

  // Form values
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

  const handleFetch = async () => {
    setLoadError(null)
    try {
      await fetchSettings()
    } catch (err: any) {
      setLoadError(err.message || 'Failed to fetch settings configurations.')
    }
  }

  useEffect(() => {
    handleFetch()
  }, [])

  // Sync state values with fetched settings
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
  };

  return (
    <div className="space-y-6 text-left max-w-2xl">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-ink">Global Store Settings</h2>
        <p className="text-[11px] text-ink-muted leading-normal">
          Configure general store attributes, stock notification triggers, and active checkout gateway toggles.
        </p>
      </div>

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
                    placeholder="Toy Cabin"
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
                    placeholder="support@toycabin.com"
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
    </div>
  )
}

export default Settings
