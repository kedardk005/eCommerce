import React, { useState, useEffect } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import type { AdminCoupon, AdminCampaign, AdminBanner } from '../context/AdminDataContext'

export const Marketing: React.FC = () => {
  const {
    coupons,
    couponsLoading,
    couponsError,
    fetchCoupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    // Banners
    banners,
    bannersLoading,
    fetchBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    // Campaigns
    campaigns,
    campaignsLoading,
    fetchCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign
  } = useAdminData()

  // Tab state: 'coupons' | 'campaigns' | 'banners'
  const [activeTab, setActiveTab] = useState<'coupons' | 'campaigns' | 'banners'>('coupons')

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false)

  // In-flight & Validation States
  const [isCouponSubmitting, setIsCouponSubmitting] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  
  const [isCampaignSubmitting, setIsCampaignSubmitting] = useState(false)
  const [campaignError, setCampaignError] = useState<string | null>(null)

  const [isBannerSubmitting, setIsBannerSubmitting] = useState(false)
  const [bannerError, setBannerError] = useState<string | null>(null)

  // 1. Coupon Form State
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'flat' | 'percent'>('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('0')
  const [expiry, setExpiry] = useState('')
  const [usageLimit, setUsageLimit] = useState('1')
  const [isActiveCoupon, setIsActiveCoupon] = useState(true)

  // 2. Campaign Form State
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignDesc, setCampaignDesc] = useState('')
  const [campaignDiscount, setCampaignDiscount] = useState('')
  const [campaignCouponId, setCampaignCouponId] = useState('')
  const [campaignBannerId, setCampaignBannerId] = useState('')
  const [campaignStart, setCampaignStart] = useState('')
  const [campaignEnd, setCampaignEnd] = useState('')
  const [isActiveCampaign, setIsActiveCampaign] = useState(true)

  // 3. Banner Form State
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerKey, setBannerKey] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [bannerPosition, setBannerPosition] = useState('0')
  const [isActiveBanner, setIsActiveBanner] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Initial loads
  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons(searchQuery)
    } else if (activeTab === 'campaigns') {
      fetchCampaigns()
      fetchCoupons()
      fetchBanners()
    } else if (activeTab === 'banners') {
      fetchBanners()
    }
  }, [searchQuery, activeTab])

  // --- COUPON HANDLERS ---
  const openAddCouponModal = () => {
    setCouponError(null)
    setIsCouponSubmitting(false)
    setEditingCouponId(null)
    setCode('')
    setType('percent')
    setValue('')
    setMinOrder('0')
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setMinutes(nextWeek.getMinutes() - nextWeek.getTimezoneOffset())
    setExpiry(nextWeek.toISOString().slice(0, 16))
    setUsageLimit('100')
    setIsActiveCoupon(true)
    setIsCouponModalOpen(true)
  }

  const openEditCouponModal = (c: AdminCoupon) => {
    setCouponError(null)
    setIsCouponSubmitting(false)
    setEditingCouponId(c.id)
    setCode(c.code)
    setType(c.type)
    setValue(c.value.toString())
    setMinOrder(c.minOrder.toString())
    const dateObj = new Date(c.expiry)
    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset())
    setExpiry(dateObj.toISOString().slice(0, 16))
    setUsageLimit(c.usageLimit.toString())
    setIsActiveCoupon(c.isActive)
    setIsCouponModalOpen(true)
  }

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCouponSubmitting(true)
    setCouponError(null)
    const parsedValue = parseFloat(value) || 0
    const parsedMinOrder = parseFloat(minOrder) || 0
    const parsedLimit = parseInt(usageLimit) || 1

    if (parsedValue <= 0) {
      setCouponError('Discount value must be a positive number.')
      setIsCouponSubmitting(false)
      return
    }
    if (type === 'percent' && parsedValue > 100) {
      setCouponError('Percentage discount cannot exceed 100%.')
      setIsCouponSubmitting(false)
      return
    }
    const futureDate = new Date(expiry)
    if (futureDate <= new Date()) {
      setCouponError('Expiry date must be in the future.')
      setIsCouponSubmitting(false)
      return
    }

    const payload = {
      code: code.toUpperCase().trim(),
      type,
      value: parsedValue,
      minOrder: parsedMinOrder,
      expiry: futureDate.toISOString(),
      usageLimit: parsedLimit,
      isActive: isActiveCoupon
    }

    try {
      if (editingCouponId) {
        await updateCoupon(editingCouponId, payload)
      } else {
        await addCoupon(payload)
      }
      setIsCouponModalOpen(false)
    } catch (err: any) {
      setCouponError(err.message || 'Server validation failed')
    } finally {
      setIsCouponSubmitting(false)
    }
  }

  // --- CAMPAIGN HANDLERS ---
  const openAddCampaignModal = () => {
    setCampaignError(null)
    setIsCampaignSubmitting(false)
    setEditingCampaignId(null)
    setCampaignTitle('')
    setCampaignDesc('')
    setCampaignDiscount('')
    setCampaignCouponId('')
    setCampaignBannerId('')
    const start = new Date()
    start.setMinutes(start.getMinutes() - start.getTimezoneOffset())
    setCampaignStart(start.toISOString().slice(0, 16))
    const end = new Date()
    end.setDate(end.getDate() + 30)
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset())
    setCampaignEnd(end.toISOString().slice(0, 16))
    setIsActiveCampaign(true)
    setIsCampaignModalOpen(true)
  }

  const openEditCampaignModal = (c: AdminCampaign) => {
    if (c.status === 'sent') {
      alert('Sent campaigns cannot be modified.')
      return
    }
    setCampaignError(null)
    setIsCampaignSubmitting(false)
    setEditingCampaignId(c.id)
    setCampaignTitle(c.title)
    setCampaignDesc(c.description)
    setCampaignDiscount(c.discountValue?.toString() || '')
    setCampaignCouponId(c.couponId || '')
    setCampaignBannerId(c.bannerId || '')
    
    const startObj = new Date(c.startDate)
    startObj.setMinutes(startObj.getMinutes() - startObj.getTimezoneOffset())
    setCampaignStart(startObj.toISOString().slice(0, 16))

    const endObj = new Date(c.endDate)
    endObj.setMinutes(endObj.getMinutes() - endObj.getTimezoneOffset())
    setCampaignEnd(endObj.toISOString().slice(0, 16))

    setIsActiveCampaign(c.isActive)
    setIsCampaignModalOpen(true)
  }

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCampaignSubmitting(true)
    setCampaignError(null)
    const payload = {
      title: campaignTitle,
      description: campaignDesc,
      discountValue: campaignDiscount ? parseInt(campaignDiscount) : null,
      couponId: campaignCouponId || null,
      bannerId: campaignBannerId || null,
      startDate: new Date(campaignStart).toISOString(),
      endDate: new Date(campaignEnd).toISOString(),
      isActive: isActiveCampaign
    }

    try {
      if (editingCampaignId) {
        await updateCampaign(editingCampaignId, payload)
      } else {
        await addCampaign(payload)
      }
      setIsCampaignModalOpen(false)
    } catch (err: any) {
      setCampaignError(err.message || 'Server validation failed')
    } finally {
      setIsCampaignSubmitting(false)
    }
  }

  // --- BANNER HANDLERS ---
  const openAddBannerModal = () => {
    setBannerError(null)
    setIsBannerSubmitting(false)
    setEditingBannerId(null)
    setBannerUrl('')
    setBannerKey('')
    setBannerLink('')
    setBannerPosition(banners.length.toString())
    setIsActiveBanner(true)
    setIsBannerModalOpen(true)
  }

  const openEditBannerModal = (b: AdminBanner) => {
    setBannerError(null)
    setIsBannerSubmitting(false)
    setEditingBannerId(b.id)
    setBannerUrl(b.url)
    setBannerKey(b.r2Key)
    setBannerLink(b.link || '')
    setBannerPosition(b.position.toString())
    setIsActiveBanner(b.isActive)
    setIsBannerModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const token = localStorage.getItem('admin_accessToken')

    try {
      // 1. Get presigned URL
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'banners'
        })
      })

      if (!presignRes.ok) {
        throw new Error('Failed to get presigned upload URL')
      }

      const { uploadUrl, publicUrl, key } = await presignRes.json()

      // 2. Put file to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      })

      if (!uploadRes.ok) {
        throw new Error('Upload payload failed to deliver to object storage')
      }

      setBannerUrl(publicUrl)
      setBannerKey(key)
    } catch (err: any) {
      setBannerError(err.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBannerSubmitting(true)
    setBannerError(null)
    if (!bannerUrl) {
      setBannerError('Please upload a banner image first.')
      setIsBannerSubmitting(false)
      return
    }

    const payload = {
      url: bannerUrl,
      r2Key: bannerKey,
      link: bannerLink || null,
      position: parseInt(bannerPosition) || 0,
      isActive: isActiveBanner
    }

    try {
      if (editingBannerId) {
        await updateBanner(editingBannerId, payload)
      } else {
        await addBanner(payload)
      }
      setIsBannerModalOpen(false)
    } catch (err: any) {
      setBannerError(err.message || 'Server validation failed')
    } finally {
      setIsBannerSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 text-left">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Marketing & Promotions</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Manage discount codes, construct email campaigns, and configure homepage showcase banners.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="mt-3 sm:mt-0 flex space-x-1.5 bg-surface border border-border p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              activeTab === 'coupons'
                ? 'bg-primary text-white font-extrabold shadow-xs'
                : 'text-ink-muted hover:bg-bg hover:text-ink'
            }`}
          >
            🎫 Coupons
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              activeTab === 'campaigns'
                ? 'bg-primary text-white font-extrabold shadow-xs'
                : 'text-ink-muted hover:bg-bg hover:text-ink'
            }`}
          >
            ✉️ Campaigns
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              activeTab === 'banners'
                ? 'bg-primary text-white font-extrabold shadow-xs'
                : 'text-ink-muted hover:bg-bg hover:text-ink'
            }`}
          >
            🖼️ Banners
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT: COUPONS --- */}
      {activeTab === 'coupons' && (
        <div className="space-y-4 text-left">
          {couponError && (
            <div className="bg-primary/10 border border-primary/25 p-3 rounded text-primary text-xs font-semibold">
              ⚠️ {couponError}
            </div>
          )}
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface border border-border p-3 rounded-lg shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search coupon codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
              />
              <span className="absolute left-2.5 top-2 text-ink-muted text-xs select-none">🔍</span>
            </div>

            <button
              onClick={openAddCouponModal}
              className="btn-primary bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs shrink-0"
            >
              ➕ Create Coupon Code
            </button>
          </div>

          {/* Table list */}
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                    <th className="px-4 py-2.5">Promo Code</th>
                    <th className="px-4 py-2.5">Discount Type</th>
                    <th className="px-4 py-2.5 text-center">Discount Value</th>
                    <th className="px-4 py-2.5 text-center">Min Order Threshold</th>
                    <th className="px-4 py-2.5">Expiration</th>
                    <th className="px-4 py-2.5 text-center font-mono">Redemptions</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {couponsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-ink-muted italic">
                        Loading coupons data from API...
                      </td>
                    </tr>
                  ) : couponsError ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-primary italic">
                        Error loading coupons: {couponsError}
                      </td>
                    </tr>
                  ) : coupons.length > 0 ? (
                    coupons.map((c) => {
                      const isExpired = new Date(c.expiry) <= new Date()
                      return (
                        <tr key={c.id} className="hover:bg-bg transition-colors">
                          <td className="px-4 py-3 font-bold text-primary tracking-wide">{c.code}</td>
                          <td className="px-4 py-3 capitalize text-ink">
                            {c.type === 'percent' ? 'Percentage' : 'Flat Amount'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold font-mono text-ink">
                            {c.type === 'percent' ? `${c.value}%` : `$${c.value.toFixed(2)}`}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-ink-muted">
                            ${c.minOrder.toFixed(2)}
                          </td>
                          <td className={`px-4 py-3 font-medium ${isExpired ? 'text-primary line-through' : 'text-ink'}`}>
                            {new Date(c.expiry).toLocaleDateString()} {new Date(c.expiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-ink-muted">
                            {c.usedCount} / {c.usageLimit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isExpired ? (
                              <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-primary text-white border-primary">
                                Expired
                              </span>
                            ) : c.isActive ? (
                              <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-accent-teal/20 text-accent-teal border-accent-teal/30">
                                Active
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-ink-muted/10 text-ink-muted border-ink-muted/20">
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => openEditCouponModal(c)}
                                className="text-[10px] font-bold text-ink-muted hover:text-ink hover:underline focus:outline-none"
                              >
                                Edit
                              </button>
                              <span className="text-border">|</span>
                              <button
                                onClick={async () => {
                                  setCouponError(null)
                                  if (confirm(`Are you sure you want to permanently delete coupon "${c.code}"?`)) {
                                    try {
                                      await deleteCoupon(c.id)
                                    } catch (err: any) {
                                      setCouponError(err.message || 'Failed to delete coupon')
                                    }
                                  }
                                }}
                                className="text-[10px] font-bold text-primary hover:text-primary-hover hover:underline focus:outline-none"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-ink-muted italic">
                        No promotional coupons found. Click "Create Coupon Code" to build one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: CAMPAIGNS --- */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4 text-left">
          {campaignError && (
            <div className="bg-primary/10 border border-primary/25 p-3 rounded text-primary text-xs font-semibold">
              ⚠️ {campaignError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface border border-border p-3 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold text-ink-muted uppercase">Email Broadcast Campaigns</h3>
            <button
              onClick={openAddCampaignModal}
              className="btn-primary bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs shrink-0"
            >
              ➕ Create Campaign
            </button>
          </div>

          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-center">Discount</th>
                  <th className="px-4 py-2.5">Schedule Range</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5">Sent At</th>
                  <th className="px-4 py-2.5 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaignsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ink-muted italic">
                      Loading campaigns...
                    </td>
                  </tr>
                ) : campaigns.length > 0 ? (
                  campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-bg transition-colors">
                      <td className="px-4 py-3 font-bold text-ink">{c.title}</td>
                      <td className="px-4 py-3 text-ink-muted">{c.description}</td>
                      <td className="px-4 py-3 text-center font-mono text-ink">
                        {c.discountValue ? `$${c.discountValue}` : 'None'}
                      </td>
                      <td className="px-4 py-3 font-mono text-ink-muted">
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.status === 'sent' ? (
                          <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-accent-teal/20 text-accent-teal border-accent-teal/30">
                            Sent
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-ink-muted">
                        {c.sentAt ? new Date(c.sentAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {c.status === 'draft' && (
                            <>
                              <button
                                onClick={async () => {
                                  setCampaignError(null)
                                  try {
                                    await sendCampaign(c.id)
                                  } catch (err: any) {
                                    setCampaignError(err.message || 'Failed to send campaign')
                                  }
                                }}
                                className="text-[10px] font-bold text-accent-teal hover:underline focus:outline-none"
                              >
                                Send
                              </button>
                              <span className="text-border">|</span>
                              <button
                                onClick={() => openEditCampaignModal(c)}
                                className="text-[10px] font-bold text-ink-muted hover:text-ink hover:underline focus:outline-none"
                              >
                                Edit
                              </button>
                              <span className="text-border">|</span>
                            </>
                          )}
                          <button
                            onClick={async () => {
                              setCampaignError(null)
                              if (confirm(`Delete campaign "${c.title}"?`)) {
                                try {
                                  await deleteCampaign(c.id)
                                } catch (err: any) {
                                  setCampaignError(err.message || 'Failed to delete campaign')
                                }
                              }
                            }}
                            className="text-[10px] font-bold text-primary hover:text-primary-hover hover:underline focus:outline-none"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ink-muted italic">
                      No campaigns found. Create one to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: BANNERS --- */}
      {activeTab === 'banners' && (
        <div className="space-y-4 text-left">
          {bannerError && (
            <div className="bg-primary/10 border border-primary/25 p-3 rounded text-primary text-xs font-semibold">
              ⚠️ {bannerError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface border border-border p-3 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold text-ink-muted uppercase">Showcase Banner Sliders</h3>
            <button
              onClick={openAddBannerModal}
              className="btn-primary bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs shrink-0"
            >
              ➕ Upload Banner
            </button>
          </div>

          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                  <th className="px-4 py-2.5">Banner Image</th>
                  <th className="px-4 py-2.5">Redirect URL/Link</th>
                  <th className="px-4 py-2.5 text-center">Position</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {bannersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-muted italic">
                      Loading banners...
                    </td>
                  </tr>
                ) : banners.length > 0 ? (
                  banners.map((b) => (
                    <tr key={b.id} className="hover:bg-bg transition-colors">
                      <td className="px-4 py-3">
                        <img src={b.url} alt="Showcase Banner" className="h-12 w-32 object-cover rounded border border-border" />
                      </td>
                      <td className="px-4 py-3 font-mono text-ink-muted">{b.link || 'None'}</td>
                      <td className="px-4 py-3 text-center font-bold text-ink">{b.position}</td>
                      <td className="px-4 py-3 text-center">
                        {b.isActive ? (
                          <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-accent-teal/20 text-accent-teal border-accent-teal/30">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded border bg-ink-muted/10 text-ink-muted border-ink-muted/20">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditBannerModal(b)}
                            className="text-[10px] font-bold text-ink-muted hover:text-ink hover:underline focus:outline-none"
                          >
                            Edit
                          </button>
                          <span className="text-border">|</span>
                          <button
                            onClick={async () => {
                              setBannerError(null)
                              if (confirm('Delete this banner image?')) {
                                try {
                                  await deleteBanner(b.id)
                                } catch (err: any) {
                                  setBannerError(err.message || 'Failed to delete banner')
                                }
                              }
                            }}
                            className="text-[10px] font-bold text-primary hover:text-primary-hover hover:underline focus:outline-none"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-muted italic">
                      No banners found. Upload one to display on the customer home page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT COUPON MODAL --- */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsCouponModalOpen(false)} />
          <div className="bg-surface border border-border w-full max-w-md rounded-lg shadow-xl overflow-hidden z-10 text-left animate-fade-in-up">
            <div className="bg-secondary py-4 px-5 text-white flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm tracking-wide">
                {editingCouponId ? '🎫 Edit Coupon' : '🎫 Create Coupon'}
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-white hover:opacity-85 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleCouponSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Coupon Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="WELCOME10"
                  className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary uppercase font-mono tracking-wider"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'flat' | 'percent')}
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount ($)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Discount Value</label>
                  <input
                    type="number"
                    step={type === 'flat' ? '0.01' : '1'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Min Order ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Expiration Date</label>
                <input
                  type="datetime-local"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCoupon"
                  checked={isActiveCoupon}
                  onChange={(e) => setIsActiveCoupon(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                />
                <label htmlFor="isActiveCoupon" className="text-xs font-semibold text-ink cursor-pointer select-none">
                  Enable coupon code
                </label>
              </div>

              {couponError && (
                <div className="bg-primary/10 border border-primary/20 p-2.5 rounded text-primary text-xs font-semibold">
                  ⚠️ {couponError}
                </div>
              )}

              <div className="flex justify-end space-x-2.5 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  disabled={isCouponSubmitting}
                  className="bg-bg border border-border text-ink text-xs font-bold px-4 py-2 rounded focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCouponSubmitting}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs focus:outline-none disabled:opacity-55 flex items-center space-x-1"
                >
                  {isCouponSubmitting && <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />}
                  <span>{isCouponSubmitting ? 'Saving...' : 'Save Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT CAMPAIGN MODAL --- */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsCampaignModalOpen(false)} />
          <div className="bg-surface border border-border w-full max-w-md rounded-lg shadow-xl overflow-hidden z-10 text-left animate-fade-in-up">
            <div className="bg-secondary py-4 px-5 text-white flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm tracking-wide">
                {editingCampaignId ? '✉️ Edit Campaign' : '✉️ Create Campaign'}
              </h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-white hover:opacity-85 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleCampaignSubmit} className="p-5 space-y-4">
              {campaignError && (
                <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                  ⚠️ {campaignError}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Campaign Title</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="Summer Toys Bonanza"
                  className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Description</label>
                <textarea
                  value={campaignDesc}
                  onChange={(e) => setCampaignDesc(e.target.value)}
                  placeholder="Newsletter copy or promo outline details..."
                  className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Discount Value ($)</label>
                  <input
                    type="number"
                    value={campaignDiscount}
                    onChange={(e) => setCampaignDiscount(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Linked Coupon</label>
                  <select
                    value={campaignCouponId}
                    onChange={(e) => setCampaignCouponId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">-- Select Coupon (Optional) --</option>
                    {coupons.map(c => (
                      <option key={c.id} value={c.id}>{c.code} ({c.type === 'percent' ? `${c.value}%` : `$${c.value}`})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Linked Banner Slider</label>
                <select
                  value={campaignBannerId}
                  onChange={(e) => setCampaignBannerId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">-- Select Banner (Optional) --</option>
                  {banners.map((b) => (
                    <option key={b.id} value={b.id}>Banner Position #{b.position} ({b.link || 'No Redirect Link'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Start Date</label>
                  <input
                    type="datetime-local"
                    value={campaignStart}
                    onChange={(e) => setCampaignStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">End Date</label>
                  <input
                    type="datetime-local"
                    value={campaignEnd}
                    onChange={(e) => setCampaignEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCampaign"
                  checked={isActiveCampaign}
                  onChange={(e) => setIsActiveCampaign(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                />
                <label htmlFor="isActiveCampaign" className="text-xs font-semibold text-ink cursor-pointer select-none">
                  Enable Campaign Slider immediately
                </label>
              </div>

              <div className="flex justify-end space-x-2.5 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  disabled={isCampaignSubmitting}
                  className="bg-bg border border-border text-ink text-xs font-bold px-4 py-2 rounded focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCampaignSubmitting}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs focus:outline-none disabled:opacity-50"
                >
                  {isCampaignSubmitting ? 'Saving...' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT BANNER MODAL --- */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsBannerModalOpen(false)} />
          <div className="bg-surface border border-border w-full max-w-md rounded-lg shadow-xl overflow-hidden z-10 text-left animate-fade-in-up">
            <div className="bg-secondary py-4 px-5 text-white flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm tracking-wide">
                {editingBannerId ? '🖼️ Edit Banner' : '🖼️ Upload Banner'}
              </h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="text-white hover:opacity-85 text-lg font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleBannerSubmit} className="p-5 space-y-4">
              {bannerError && (
                <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                  ⚠️ {bannerError}
                </div>
              )}
              {/* File Upload Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Upload Banner Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-ink-muted file:mr-3 file:py-1 file:px-2 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-bg file:text-ink hover:file:bg-bg/20 cursor-pointer"
                />
                {uploadingImage && (
                  <p className="text-[10px] text-accent-teal animate-pulse">Delivering image asset payload to R2 bucket...</p>
                )}
              </div>

              {/* URL preview */}
              {bannerUrl && (
                <div className="space-y-1">
                  <span className="block text-[9px] font-semibold text-ink-muted uppercase">Preview</span>
                  <img src={bannerUrl} alt="Preview" className="w-full h-24 object-cover border border-border rounded" />
                </div>
              )}

              {/* Banner Position */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Slide Order Position</label>
                  <input
                    type="number"
                    value={bannerPosition}
                    onChange={(e) => setBannerPosition(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Redirect Link (Optional)</label>
                  <input
                    type="text"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="/products/wooden-blocks"
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveBanner"
                  checked={isActiveBanner}
                  onChange={(e) => setIsActiveBanner(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                />
                <label htmlFor="isActiveBanner" className="text-xs font-semibold text-ink cursor-pointer select-none">
                  Make Banner Slider Active
                </label>
              </div>

              <div className="flex justify-end space-x-2.5 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  disabled={isBannerSubmitting || uploadingImage}
                  className="bg-bg border border-border text-ink text-xs font-bold px-4 py-2 rounded focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBannerSubmitting || uploadingImage}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded shadow-xs focus:outline-none disabled:opacity-50"
                >
                  {isBannerSubmitting ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Marketing
