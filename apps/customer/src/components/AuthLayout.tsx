import React from 'react'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center min-h-[75vh] px-4 py-12 bg-bg">
      <div className="max-w-md w-full card-workshop p-8 bg-surface border-b-[3.5px] border-primary shadow-xs space-y-6">
        {/* Brand logo & header */}
        <div className="text-center flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-border flex items-center justify-center border border-border shadow-xs">
            <span className="text-3xl filter drop-shadow">🧸</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-heading text-ink tracking-tight font-bold">{title}</h2>
            {subtitle && <p className="text-xs sm:text-sm text-ink-muted font-body mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
