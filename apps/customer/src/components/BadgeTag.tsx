import React from 'react'

interface BadgeTagProps {
  text: string
  variant?: 'red' | 'yellow' | 'green' | 'blue' | 'secondary' | 'default'
  className?: string
}

export const BadgeTag: React.FC<BadgeTagProps> = ({ text, variant = 'default', className = '' }) => {
  // Map variant to background colors using Bright Workshop tokens
  const colorMap = {
    red: 'bg-primary text-white border-primary/30',
    yellow: 'bg-accent-yellow text-ink border-accent-yellow/30',
    green: 'bg-accent-teal text-white border-accent-teal/30',
    blue: 'bg-accent-blue text-white border-accent-blue/30',
    secondary: 'bg-secondary text-white border-secondary/30',
    default: 'bg-bg/35 text-ink border-border/40'
  }

  const colorClasses = colorMap[variant] || colorMap.default

  return (
    <span className={`relative inline-flex items-center text-[10px] sm:text-xs font-heading font-bold px-2.5 py-1 rounded-r-md rounded-l-xs shadow-xs border border-l-0 pl-4 shrink-0 select-none ${colorClasses} ${className}`}>
      {/* Tiny circle cutout for the string */}
      <span className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-bg border-r border-black/10"></span>
      {/* String hanging line */}
      <span className="absolute -left-1 w-1 h-[1px] bg-secondary/40 origin-right rotate-[-15deg]"></span>
      <span className="leading-none tracking-wider uppercase">{text}</span>
    </span>
  )
}

export default BadgeTag
