import React from 'react'
import { Link } from 'react-router-dom'

export const CheckoutPlaceholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-lg border border-border shadow-sm text-center space-y-6">
        <span className="text-6xl block">🚚</span>
        <h1 className="text-3xl font-heading text-ink">Checkout</h1>
        <h2 className="text-xl font-heading text-accent-yellow font-semibold">Phase 1 Placeholder — Coming Soon!</h2>
        <p className="text-ink-muted font-body text-sm">
          Simulated checkout forms, delivery address selection, and payment gateway widgets will be fully integrated during Phase 4 & Phase 7 blocks.
        </p>
        <Link
          to="/"
          className="inline-block bg-secondary hover:bg-primary-hover text-white font-heading font-semibold py-2.5 px-6 rounded-md shadow-xs transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default CheckoutPlaceholder
