import React from 'react'
import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`animate-fade-in max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 ${className}`}>
      {children}
    </div>
  )
}

export default PageContainer
