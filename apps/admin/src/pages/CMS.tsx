import React, { useState, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import type { AdminStaticPage } from '../context/AdminDataContext'

export const CMS: React.FC = () => {
  const { cmsPages, cmsLoading, fetchCmsPages, updateCmsPage } = useAdminData()
  const [selectedPage, setSelectedPage] = useState<AdminStaticPage | null>(null)
  
  // Editor state
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleFetch = async () => {
    setLoadError(null)
    try {
      await fetchCmsPages()
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load CMS pages.')
    }
  }

  useEffect(() => {
    handleFetch()
  }, [])

  // Update editor values when page selection changes
  useEffect(() => {
    setSaveError(null)
    setSaveSuccess(false)
    if (selectedPage) {
      setEditTitle(selectedPage.title)
      setEditContent(selectedPage.content)
      setEditIsActive(selectedPage.isActive)
    } else {
      setEditTitle('')
      setEditContent('')
      setEditIsActive(true)
    }
  }, [selectedPage])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPage) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateCmsPage(selectedPage.slug, {
        title: editTitle,
        content: editContent,
        isActive: editIsActive
      })
      setSaveSuccess(true)
      await fetchCmsPages()
    } catch (err: any) {
      setSaveError(err.message || 'Error saving page content')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-ink">Content Management System</h2>
        <p className="text-[11px] text-ink-muted leading-normal">
          Edit policy information, FAQs, and static text pages served dynamically across the customer storefront.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Page Selector */}
        <div className="bg-surface border border-border rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold text-ink-muted uppercase">Select Store Page</h3>
          <div className="space-y-1.5">
            {cmsLoading && cmsPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-[10px] text-ink-muted italic">Fetching CMS directory...</p>
              </div>
            ) : loadError && cmsPages.length === 0 ? (
              <div className="p-3 text-center space-y-2 bg-primary/10 border border-primary/25 rounded">
                <p className="text-[10px] text-primary font-semibold">⚠️ {loadError}</p>
                <button
                  onClick={handleFetch}
                  className="bg-primary text-white text-[9px] font-bold py-1 px-3.5 rounded uppercase hover:bg-primary-hover tracking-wider"
                >
                  Retry
                </button>
              </div>
            ) : cmsPages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page)}
                className={`w-full text-left px-3 py-2.5 rounded text-xs font-semibold border transition-all flex justify-between items-center ${
                  selectedPage?.id === page.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-bg text-ink border-border/60 hover:border-border hover:bg-bg/50'
                }`}
              >
                <span>{page.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  page.isActive 
                    ? (selectedPage?.id === page.id ? 'bg-white/20 text-white' : 'bg-accent-teal/10 text-accent-teal')
                    : (selectedPage?.id === page.id ? 'bg-white/10 text-white/70' : 'bg-ink-muted/10 text-ink-muted')
                }`}>
                  {page.isActive ? 'Active' : 'Disabled'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Markdown Editor Panel */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          {selectedPage ? (
            <form onSubmit={handleSave} className="divide-y divide-border/60">
              <div className="p-4 bg-bg/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-ink uppercase">Editor: {selectedPage.title}</h3>
                  <p className="text-[10px] text-ink-muted font-mono mt-0.5">Route URL: /pages/{selectedPage.slug}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pageActiveToggle"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                  />
                  <label htmlFor="pageActiveToggle" className="text-xs font-semibold text-ink cursor-pointer select-none">
                    Make Page Public
                  </label>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {saveError && (
                  <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                    ⚠️ {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="bg-accent-teal/10 border border-accent-teal/30 p-3 rounded-lg text-accent-teal text-xs font-semibold">
                    ✓ CMS static page updated successfully!
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Page Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-semibold text-ink"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-semibold text-ink-muted uppercase">HTML / Markdown Content Body</label>
                    <span className="text-[9px] text-ink-muted">Markdown rendering is supported on customer frontend.</span>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono h-[320px] resize-y leading-relaxed text-ink"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-bg/20 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-5 py-2.5 rounded shadow-xs focus:outline-none disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Page Content'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-ink-muted italic">
              <span className="text-3xl block mb-2">📄</span>
              Please choose a static page from the sidebar list to inspect and edit its contents.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CMS
