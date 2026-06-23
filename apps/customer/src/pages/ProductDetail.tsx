import React, { useState, useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Variant, Review } from '../mockData'
import { useRequireAuth } from '../hooks/useRequireAuth'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'

const AGE_COLORS: Record<string, string> = {
  '0-2': 'var(--color-age-0)',
  '3-5': 'var(--color-age-3)',
  '6-8': 'var(--color-age-6)',
  '9-12': 'var(--color-age-9)',
  '0-1 years': 'var(--color-age-0)',
  '1-3 years': 'var(--color-age-3)',
  '3-5 years': 'var(--color-age-3)',
  '5-7 years': 'var(--color-age-6)',
  '8+ years': 'var(--color-age-9)'
}

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { isLoggedIn, user, authFetch } = useAuth()
  const { addToCart } = useCart()
  const { addToWishlist } = useWishlist()
  
  // Real catalog product states
  const [product, setProduct] = useState<any | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Write review form state
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState('')
  const [editingRating, setEditingRating] = useState(5)
  const [isSubmittingEditReview, setIsSubmittingEditReview] = useState(false)
  const [editReviewError, setEditReviewError] = useState<string | null>(null)

  // Simulated action success states
  const [cartSuccess, setCartSuccess] = useState('')
  const [wishlistSuccess, setWishlistSuccess] = useState('')

  // Quantity counter state
  const [quantity, setQuantity] = useState(1)
  const decrease = () => setQuantity((prev) => Math.max(1, prev - 1))
  const increase = () => setQuantity((prev) => Math.min(selectedVariant?.stock || 99, prev + 1))

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant])

  // Authentication check helper
  const checkAuth = useRequireAuth()

  const fetchProductDetail = async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/products/${slug}`)
      if (!res.ok) {
        throw new Error('Product not found.')
      }
      const data = await res.json()
      
      const p = data.product
      const formattedProduct = {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.basePrice / 100,
        discountPrice: (p.discountPrice ?? p.basePrice) / 100,
        brand: p.brand?.name || 'Handcrafted',
        category: p.category?.name || 'Toys',
        ageGroup: p.ageGroup,
        rating: p.rating,
        stockStatus: p.variants && p.variants.some((v: any) => v.stock > 0) ? 'In Stock' : 'Out of Stock',
        variants: p.variants ? p.variants.map((v: any) => ({
          name: v.attributes?.name || v.name || 'Standard',
          stock: v.stock
        })) : [],
        reviews: [],
        image: p.images && p.images.length > 0 ? p.images[0].url : undefined,
        images: p.images ? p.images.map((img: any) => ({
          id: img.id,
          r2Key: img.r2Key,
          url: img.url,
          position: img.position
        })) : []
      }

      setProduct(formattedProduct)

      const formattedReviews = (data.reviews?.data || []).map((r: any) => ({
        id: r.id,
        reviewerName: r.user?.name || 'Customer',
        rating: r.rating,
        comment: r.text,
        date: r.createdAt.substring(0, 10),
        userId: r.userId
      }))
      setReviews(formattedReviews)

      // Fetch related products
      const relRes = await fetch(`/api/products/${slug}/related`)
      if (relRes.ok) {
        const relData = await relRes.json()
        const formattedRel = relData.map((rp: any) => {
          const defaultVar = rp.variants?.[0] || { stock: 0 }
          return {
            id: rp.id,
            title: rp.title,
            slug: rp.slug,
            description: rp.description,
            price: rp.basePrice / 100,
            discountPrice: (rp.discountPrice ?? rp.basePrice) / 100,
            brand: rp.brand?.name || 'Handcrafted',
            category: rp.category?.name || 'Toys',
            ageGroup: rp.ageGroup,
            rating: rp.rating,
            stockStatus: defaultVar.stock > 0 ? 'In Stock' : 'Out of Stock',
            variants: rp.variants ? rp.variants.map((v: any) => ({
              name: v.attributes?.name || v.name || 'Standard',
              stock: v.stock
            })) : [],
            reviews: [],
            imageColor: 'bg-primary',
            image: rp.images && rp.images.length > 0 ? rp.images[0].url : undefined,
            images: rp.images ? rp.images.map((img: any) => ({
              id: img.id,
              r2Key: img.r2Key,
              url: img.url,
              position: img.position
            })) : []
          }
        })
        setRelatedProducts(formattedRel)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reload product details when slug changes
  useEffect(() => {
    fetchProductDetail()
  }, [slug])

  // Sync selected variant when product changes
  useEffect(() => {
    if (product && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    } else {
      setSelectedVariant(null)
    }
  }, [product])

  // Determine stock text
  const stockText = useMemo(() => {
    if (!selectedVariant) return 'Out of Stock'
    if (selectedVariant.stock === 0) return 'Out of Stock'
    if (selectedVariant.stock < 5) return `Low Stock (Only ${selectedVariant.stock} left!)`
    return 'In Stock'
  }, [selectedVariant])

  // If loading or error states occur
  if (loading) {
    return (
      <PageContainer className="text-center py-20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <h2 className="text-xl font-heading text-ink">Loading product details...</h2>
        </div>
      </PageContainer>
    )
  }

  if (error || !product || !selectedVariant) {
    return (
      <PageContainer className="text-center py-20">
        <h2 className="text-3xl font-heading text-ink">Product Not Found</h2>
        <p className="text-ink-muted font-body mt-2">The toy you are looking for has wandered out of the cabin.</p>
        {error && (
          <p className="text-primary text-xs font-semibold mt-1">Error: {error}</p>
        )}
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => fetchProductDetail()}
            className="bg-accent-blue hover:bg-accent-blue/90 text-white font-heading px-6 py-2 rounded-md shadow-xs"
          >
            Retry Connection
          </button>
          <Link
            to="/products"
            className="bg-primary hover:bg-primary-hover/90 text-white font-heading px-6 py-2 rounded-md shadow-xs"
          >
            Back to Shop
          </Link>
        </div>
      </PageContainer>
    )
  }

  // Actions wrapped in login checks
  const handleAddToCart = () => {
    checkAuth(() => {
      addToCart(product, selectedVariant, quantity)
      setCartSuccess(`Success: ${quantity}x "${product.title}" (${selectedVariant.name}) added to Cart!`)
      setWishlistSuccess('')
      setTimeout(() => setCartSuccess(''), 2000)
    })
  }

  const handleAddToWishlist = () => {
    checkAuth(() => {
      addToWishlist(product)
      setWishlistSuccess(`Success: Added "${product.title}" to your Wishlist!`)
      setCartSuccess('')
      setTimeout(() => setWishlistSuccess(''), 2000)
    })
  }

  // Review Actions
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError(null)
    if (!newComment.trim()) return

    const token = localStorage.getItem('accessToken')
    if (!token) {
      setReviewError('Please sign in to submit a review.')
      return
    }

    setIsSubmittingReview(true)
    try {
      const res = await authFetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: newRating,
          text: newComment.trim()
        })
      })

      if (res.ok) {
        setNewComment('')
        setNewRating(5)
        await fetchProductDetail()
      } else {
        const err = await res.json()
        setReviewError(err.error || 'Failed to submit review.')
      }
    } catch (err: any) {
      setReviewError(err.message || 'Error submitting review.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleDeleteReview = async (revId: string) => {
    if (window.confirm('Delete this review?')) {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      try {
        const res = await authFetch(`/api/reviews/${revId}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          await fetchProductDetail()
        } else {
          const err = await res.json()
          setReviewError(err.error || 'Failed to delete review.')
        }
      } catch (err: any) {
        setReviewError(err.message || 'Error deleting review.')
      }
    }
  }

  const handleSaveEditReview = async (e: React.FormEvent, revId: string) => {
    e.preventDefault()
    setEditReviewError(null)
    if (!editingComment.trim()) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    setIsSubmittingEditReview(true)
    try {
      const res = await authFetch(`/api/reviews/${revId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: editingRating,
          text: editingComment.trim()
        })
      })
      if (res.ok) {
        setEditingReviewId(null)
        await fetchProductDetail()
      } else {
        const err = await res.json()
        setEditReviewError(err.error || 'Failed to update review.')
      }
    } catch (err: any) {
      setEditReviewError(err.message || 'Error updating review.')
    } finally {
      setIsSubmittingEditReview(false)
    }
  }

  const startEdit = (rev: Review) => {
    setEditingReviewId(rev.id)
    setEditingComment(rev.comment)
    setEditingRating(rev.rating)
  }

  return (
    <PageContainer className="space-y-12 pb-16">
      {/* Back button */}
      <div className="text-left">
        <Link to="/products" className="text-ink-muted hover:text-ink font-heading font-bold text-sm transition">
          &larr; Back to Toy Chest
        </Link>
      </div>

      {/* Main product card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className="h-[350px] sm:h-[450px] bg-bg rounded-2xl shadow-md overflow-hidden relative w-full flex items-center justify-center">
            {product.images && product.images.length > 0 && product.images[activeImageIndex]?.url ? (
              <img
                src={product.images[activeImageIndex].url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl filter drop-shadow">🧸</span>
            )}
            <div className="absolute top-4 left-4">
              {product.discountPrice < product.price && (
                <BadgeTag text={`save ₹${(product.price - product.discountPrice).toFixed(0)}`} variant="red" />
              )}
            </div>
          </div>

          {/* Mini thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg border-2 transition-all overflow-hidden shrink-0 ${
                    idx === activeImageIndex 
                      ? 'border-primary' 
                      : 'border-transparent hover:border-primary'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover cursor-pointer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="text-left space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <BadgeTag text={product.category} variant="secondary" />
              <BadgeTag text={product.brand} variant="blue" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black leading-tight text-ink tracking-tight">{product.title}</h1>
            {product.ageGroup && (
              <span className="badge-age inline-block mt-2 animate-pop-in"
                    style={{ 
                      backgroundColor: AGE_COLORS[product.ageGroup] ?? 'var(--color-accent-teal)',
                      color: (product.ageGroup.includes('0-2') || product.ageGroup.includes('0-1')) ? 'var(--color-secondary)' : '#ffffff'
                    }}
              >
                Ages {product.ageGroup}
              </span>
            )}
            
            {/* Rating summary */}
            <div className="flex items-center space-x-2 font-body text-sm font-semibold pt-1">
              <span className="text-accent-yellow text-lg">★</span>
              <span className="font-heading font-bold text-ink">{product.rating.toFixed(1)}</span>
              <span className="text-ink-muted">({reviews.length} reviews)</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline space-x-3 border-y border-border/60 py-4">
            <span className="text-4xl font-heading font-black text-primary">
              ₹{product.discountPrice.toFixed(2)}
            </span>
            {product.price > product.discountPrice && (
              <span className="text-xl font-body text-ink-muted line-through">
                ₹{product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Select Variant</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: Variant) => {
                  const isSelected = selectedVariant?.name === v.name
                  return (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariant(v)}
                      className={`min-w-[56px] min-h-[44px] px-4 py-2 border-2 transition duration-150 rounded-md font-heading font-bold text-sm select-none ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border text-ink-muted bg-surface hover:border-primary/50'
                      }`}
                    >
                      {v.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector Stepper */}
          <div className="flex flex-col space-y-2.5">
            <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Quantity</span>
            <div className="flex items-center gap-3 rounded-pill border-2 border-border w-fit px-3 py-1 bg-surface shadow-sm">
              <button onClick={decrease} className="text-2xl font-black text-ink w-10 h-10 flex items-center justify-center hover:text-primary active:scale-95 transition-transform" aria-label="Decrease quantity">−</button>
              <span className="font-heading font-black text-xl w-8 text-center">{quantity}</span>
              <button onClick={increase} className="text-2xl font-black text-ink w-10 h-10 flex items-center justify-center hover:text-primary active:scale-95 transition-transform" aria-label="Increase quantity">+</button>
            </div>
          </div>

          {/* Dynamic Stock Status */}
          <div className="flex items-center space-x-2 font-body text-sm font-semibold">
            <span className="font-heading font-bold text-ink">Stock:</span>
            <span
              className={`font-semibold ${
                selectedVariant.stock === 0
                  ? 'text-primary'
                  : selectedVariant.stock < 5
                  ? 'text-accent-yellow'
                  : 'text-accent-teal'
              }`}
            >
              {stockText}
            </span>
          </div>

          {/* Notification Alerts */}
          {cartSuccess && (
            <div className="p-3.5 bg-accent-teal/10 border border-accent-teal/30 text-accent-teal rounded-lg font-body text-sm font-semibold animate-fade-in">
              {cartSuccess}
            </div>
          )}
          {wishlistSuccess && (
            <div className="p-3.5 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-lg font-body text-sm font-semibold animate-fade-in">
              {wishlistSuccess}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col gap-4 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={selectedVariant.stock === 0}
              className={`w-full min-h-[56px] text-lg font-heading font-black text-white rounded-pill transition-all duration-200 active:scale-95 shadow flex items-center justify-center gap-2 ${
                cartSuccess
                  ? 'bg-accent-green hover:bg-accent-green'
                  : 'bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-ink-muted'
              }`}
            >
              <span>{cartSuccess ? '✅' : '🛒'}</span>
              <span>{cartSuccess ? 'Added!' : 'Add to Cart'}</span>
            </button>
            
            <button
              onClick={handleAddToWishlist}
              className="w-full min-h-[48px] border-2 border-primary text-primary font-heading font-bold rounded-pill hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <span>❤️</span>
              <span>Save to Wishlist</span>
            </button>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-4 border-t border-border/60">
            <h4 className="font-heading font-bold text-ink text-lg">Description</h4>
            <p className="font-body text-ink leading-relaxed text-justify text-sm sm:text-base">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="border-t border-border/60 pt-10 text-left space-y-6">
        <h3 className="text-2xl font-heading text-ink">Customer Reviews</h3>
        
        {/* Write a Review form (Only visible when logged in) */}
        {isLoggedIn ? (
          <form onSubmit={handleAddReview} className="card-workshop p-6 space-y-4 max-w-2xl bg-surface border-b-[3px] border-primary shadow-xs">
            <h4 className="font-heading font-bold text-ink text-lg">Write a Review</h4>
            {reviewError && (
              <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                ⚠️ {reviewError}
              </div>
            )}
            <div className="flex items-center space-x-3">
              <span className="font-body text-sm font-semibold text-ink-muted">Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => setNewRating(star)}
                    className="text-3xl cursor-pointer transition disabled:opacity-50 select-none"
                  >
                    {star <= newRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <textarea
                required
                rows={3}
                disabled={isSubmittingReview}
                placeholder="Share your thoughts about this toy..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="input-workshop disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="btn-primary bg-secondary hover:bg-primary-hover disabled:bg-border disabled:text-ink-muted text-white font-heading font-bold text-xs px-5 py-2.5 rounded shadow-xs flex items-center justify-center space-x-1.5"
            >
              {isSubmittingReview && <span className="animate-spin mr-1">⌛</span>}
              <span>Submit Review</span>
            </button>
          </form>
        ) : (
          <p className="text-xs font-body text-ink-muted bg-bg/40 p-4 rounded-lg border border-border/40 max-w-2xl">
            Please <Link to="/login" className="text-accent-blue font-bold hover:underline">Sign In</Link> to share your review.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="font-body text-ink-muted text-sm">No reviews yet for this product. Be the first to leave one!</p>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {reviews.map((rev) => {
              const isEditing = editingReviewId === rev.id
              const isAuthor = isLoggedIn && rev.userId === user?.id

              return (
                  <div key={rev.id} className="rounded-xl border border-border p-4 bg-surface space-y-3">
                    <div className="flex justify-between items-center text-xs sm:text-sm border-b border-border/40 pb-2">
                      <span className="font-heading font-bold text-ink text-sm">{rev.reviewerName}</span>
                      <span className="font-body text-ink-muted">{rev.date}</span>
                    </div>

                    {isEditing ? (
                      <form onSubmit={(e) => handleSaveEditReview(e, rev.id)} className="space-y-3">
                        {editReviewError && (
                          <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                            ⚠️ {editReviewError}
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="font-body text-xs text-ink-muted">Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={isSubmittingEditReview}
                                onClick={() => setEditingRating(star)}
                                className="text-3xl cursor-pointer transition disabled:opacity-50 select-none"
                              >
                                {star <= editingRating ? '⭐' : '☆'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          required
                          rows={2}
                          disabled={isSubmittingEditReview}
                          value={editingComment}
                          onChange={(e) => setEditingComment(e.target.value)}
                          className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isSubmittingEditReview}
                            className="bg-accent-blue text-white font-heading text-[11px] px-3.5 py-1.5 rounded-lg shadow-xs flex items-center justify-center space-x-1"
                          >
                            {isSubmittingEditReview && <span className="animate-spin mr-1">⌛</span>}
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingEditReview}
                            onClick={() => setEditingReviewId(null)}
                            className="bg-bg text-ink border border-border font-heading text-[11px] px-3.5 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex text-accent-yellow text-sm" aria-label={`${rev.rating} out of 5 stars`}>
                          {'⭐'.repeat(rev.rating)}
                        </div>
                      <p className="font-body text-ink text-sm sm:text-base leading-relaxed text-justify">{rev.comment}</p>
                      
                      {isAuthor && (
                        <div className="flex gap-3 text-xs font-heading font-bold pt-2 border-t border-border/40 select-none">
                          <button
                            onClick={() => startEdit(rev)}
                            className="text-accent-blue hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="text-primary hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-border/60 pt-10 text-left space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Similar Playthings</span>
            <h3 className="text-2xl font-heading text-ink">Related Toys</h3>
            <p className="text-ink-muted font-body text-xs sm:text-sm">Other items in the {product.category} collection</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                to={`/products/${rel.slug}`}
                className="card-workshop overflow-hidden flex flex-col group border-b-[3px]"
              >
                {/* Image Placeholder with wood grain */}
                <div className="h-40 bg-border flex items-center justify-center relative border-b border-border overflow-hidden select-none w-full">
                  {rel.image ? (
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform duration-300">🧸</span>
                  )}
                </div>
                {/* Product Info */}
                <div className="p-3 flex-1 flex flex-col justify-between text-left space-y-1.5">
                  <h4 className="font-heading text-ink text-base line-clamp-1 group-hover:text-accent-blue transition duration-200">
                    {rel.title}
                  </h4>
                  <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
                    <span className="font-heading font-bold text-ink text-sm sm:text-base">
                      ₹{rel.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-heading font-bold text-ink flex items-center space-x-0.5">
                      <span className="text-accent-yellow">★</span>
                      <span>{rel.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  )
}

export default ProductDetail
