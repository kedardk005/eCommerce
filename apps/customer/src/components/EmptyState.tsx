import React from 'react'
import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  message: string
  buttonText: string
  buttonLink?: string
  onClick?: () => void
  icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  buttonText,
  buttonLink,
  onClick,
  icon
}) => {
  const buttonClasses = "btn-primary"

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface border border-border rounded-2xl shadow-sm max-w-lg mx-auto space-y-6 animate-fade-in my-8">
      {icon ? (
        icon
      ) : (
        /* Illustrated empty wooden crate SVG */
        <svg
          className="w-20 h-20 text-ink-muted animate-pulse"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Crate bottom/back */}
          <path d="M3 8v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
          {/* Crate lid/open flaps */}
          <path d="M21 8H3" />
          <path d="M3 8l3-5h12l3 5" />
          {/* Wooden planks lines on the crate */}
          <line x1="8" y1="8" x2="8" y2="21" />
          <line x1="16" y1="8" x2="16" y2="21" />
          <line x1="3" y1="14" x2="21" y2="14" />
          {/* Diagonal wooden cross-braces */}
          <line x1="8" y1="10" x2="16" y2="19" strokeOpacity="0.4" />
        </svg>
      )}
      
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-heading text-ink">{title}</h3>
        <p className="text-sm font-body text-ink-muted max-w-xs mx-auto leading-relaxed">{message}</p>
      </div>

      {onClick ? (
        <button onClick={onClick} className={buttonClasses}>
          {buttonText}
        </button>
      ) : buttonLink ? (
        <Link to={buttonLink} className={buttonClasses}>
          {buttonText}
        </Link>
      ) : null}
    </div>
  )
}

export default EmptyState
