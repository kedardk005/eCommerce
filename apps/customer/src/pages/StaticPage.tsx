import React, { useState, useEffect } from 'react'
import PageContainer from '../components/PageContainer'

interface StaticPageProps {
  slug: string
}

export const StaticPage: React.FC<StaticPageProps> = ({ slug }) => {
  const [pageData, setPageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/pages/${slug}`)
      if (!res.ok) {
        throw new Error('Static page not found or disabled.')
      }
      const data = await res.json()
      setPageData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage()
  }, [slug])

  // Simple formatter to parse headers (#) and bold text (**)
  const renderFormattedContent = (content: string) => {
    if (!content) return null
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="text-base font-bold text-ink mt-4 mb-2">{trimmed.replace(/^###\s*/, '')}</h4>
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} className="text-lg font-bold text-ink mt-5 mb-2.5">{trimmed.replace(/^##\s*/, '')}</h3>
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={idx} className="text-2xl font-heading font-extrabold text-ink mt-6 mb-3 pb-2 border-b border-border">{trimmed.replace(/^#\s*/, '')}</h2>
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return <li key={idx} className="ml-4 list-disc text-sm text-ink-muted leading-relaxed my-1">{trimmed.replace(/^[*+-]\s*/, '')}</li>
      }

      // Handle bold **text** in lines
      const parts = line.split('**')
      if (parts.length > 1) {
        return (
          <p key={idx} className="text-sm text-ink-muted leading-relaxed my-2.5">
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-ink font-bold">{part}</strong> : part)}
          </p>
        )
      }

      return <p key={idx} className="text-sm text-ink-muted leading-relaxed my-2.5 min-h-[1em]">{line}</p>
    })
  }

  return (
    <PageContainer className="py-12 max-w-3xl text-left">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <h2 className="text-xl font-heading text-ink">Loading page content...</h2>
        </div>
      ) : error ? (
        <div className="bg-primary/10 border border-primary/20 text-primary text-sm p-6 rounded-lg leading-relaxed text-center space-y-4">
          <p>⚠️ {error}</p>
          <button
            onClick={fetchPage}
            className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border p-6 sm:p-10 rounded-xl shadow-xs space-y-6">
          <div className="prose max-w-none text-ink leading-relaxed">
            {renderFormattedContent(pageData?.content || '')}
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default StaticPage
