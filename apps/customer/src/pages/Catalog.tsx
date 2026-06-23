import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const AGE_COLORS: Record<string, string> = {
  '0-2': 'var(--color-age-0)',
  '3-5': 'var(--color-age-3)',
  '6-8': 'var(--color-age-6)',
  '9-12': 'var(--color-age-9)',
  '0-1': 'var(--color-age-0)',
  '1-3': 'var(--color-age-3)',
  '5-7': 'var(--color-age-6)',
  '8+': 'var(--color-age-9)'
}

const getAgeGroupColor = (age?: string) => {
  if (!age) return 'var(--color-accent-teal)'
  const clean = age.toLowerCase().trim()
  if (clean.includes('0-2') || clean.includes('0-1')) return AGE_COLORS['0-2']
  if (clean.includes('3-5') || clean.includes('1-3')) return AGE_COLORS['3-5']
  if (clean.includes('6-8') || clean.includes('5-7')) return AGE_COLORS['6-8']
  if (clean.includes('9-12') || clean.includes('8+')) return AGE_COLORS['9-12']
  return 'var(--color-accent-teal)'
}

const isYellowAge = (age?: string) => {
  if (!age) return false
  const clean = age.toLowerCase().trim()
  return clean.includes('0-2') || clean.includes('0-1')
}

export const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToCart } = useCart()
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist()
  
  // Sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Metadata states
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  const initialCategory = searchParams.get('category') || ''
  const initialAgeGroup = searchParams.get('ageGroup') || ''
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(initialAgeGroup)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)

  // Sorting state
  const [sortBy, setSortBy] = useState('rating') // default sort by rating

  // Paginated list states
  const [products, setProducts] = useState<any[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories & brands metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands')
        ])
        if (catRes.ok) {
          const cats = await catRes.json()
          setCategories(cats.map((c: any) => c.name))
        }
        if (brandRes.ok) {
          const brs = await brandRes.json()
          setBrands(brs.map((b: any) => b.name))
        }
      } catch (err) {
        console.error('Failed to fetch catalog metadata:', err)
      }
    }
    fetchMetadata()
  }, [])

  // Listen to URL search param changes (e.g. from Home page category strip/age clicks)
  useEffect(() => {
    const cat = searchParams.get('category') || ''
    setSelectedCategory(cat)
    const age = searchParams.get('ageGroup') || ''
    let cleanAge = age
    if (age.includes('0-1') || age.includes('1-3') || age === '0-2') cleanAge = '0-2'
    else if (age.includes('3-5') || age === '3-5') cleanAge = '3-5'
    else if (age.includes('5-7') || age === '6-8') cleanAge = '6-8'
    else if (age.includes('8+') || age === '9-12') cleanAge = '9-12'
    setSelectedAgeGroup(cleanAge)
  }, [searchParams])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Primary API products fetch function
  const fetchProductsList = async (cursorToUse?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedQuery.trim()) params.append('search', debouncedQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedBrand) params.append('brand', selectedBrand)
      if (selectedAgeGroup) {
        let mappedAgeGroup = selectedAgeGroup
        if (selectedAgeGroup === '0-2') mappedAgeGroup = '1-3 years'
        else if (selectedAgeGroup === '3-5') mappedAgeGroup = '3-5 years'
        else if (selectedAgeGroup === '6-8') mappedAgeGroup = '5-7 years'
        else if (selectedAgeGroup === '9-12') mappedAgeGroup = '8+ years'
        params.append('ageGroup', mappedAgeGroup)
      }
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (minRating > 0) params.append('minRating', minRating.toString())
      if (inStockOnly) params.append('inStock', 'true')
      
      const mappedSort = sortBy.replace('-', '_')
      params.append('sort', mappedSort)
      params.append('limit', '12')

      if (cursorToUse) {
        params.append('cursor', cursorToUse)
      }

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch products list')
      }
      const data = await res.json()

      const formatted = (data.items || data.data || []).map((p: any) => {
        const defaultVar = p.variants?.[0] || { stock: 0 }
        return {
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
          stockStatus: defaultVar.stock > 0 ? 'In Stock' : 'Out of Stock',
          variants: p.variants ? p.variants.map((v: any) => ({
            name: v.attributes?.name || v.name || 'Standard',
            stock: v.stock
          })) : [],
          reviews: [],
          imageColor: 'bg-primary',
          image: p.images && p.images.length > 0 ? p.images[0].url : undefined,
          images: p.images ? p.images.map((img: any) => ({
            id: img.id,
            r2Key: img.r2Key,
            url: img.url,
            position: img.position
          })) : []
        }
      })

      if (cursorToUse) {
        setProducts(prev => [...prev, ...formatted])
      } else {
        setProducts(formatted)
      }
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reload products list when filters change
  useEffect(() => {
    fetchProductsList()
  }, [debouncedQuery, selectedCategory, selectedBrand, selectedAgeGroup, minPrice, maxPrice, minRating, inStockOnly, sortBy])

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchProductsList(nextCursor)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedAgeGroup('')
    setMinPrice('')
    setMaxPrice('')
    setMinRating(0)
    setInStockOnly(false)
    setSearchParams({})
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Heirloom Creations</span>
        <h1 className="text-4xl sm:text-5xl font-heading mb-1 text-ink select-none">Toy Chest</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Browse, filter, and discover your next wooden heirloom.</p>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface p-4 border border-border rounded-xl shadow-xs border-b-[3px] border-primary">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search toys... 🔍"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 text-base font-body rounded-pill border-2 border-border focus:border-primary px-5 shadow-sm focus:outline-none"
          />
        </div>

        {/* Action Controls */}
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-4">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden btn-primary bg-bg/30 border border-border px-5 py-2.5 rounded-md font-heading font-bold text-ink text-sm"
          >
            Filters ⚙️
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="font-body text-sm text-ink-muted hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg border border-border py-2.5 px-3 rounded-md font-body text-sm text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent-blue/45"
            >
              <option value="rating">Highest Rating</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-8 relative">
        {/* FILTER SIDEBAR (Desktop: Sidebar, Mobile: Modal drawer overlay) */}
        <aside
          className={`
            fixed lg:sticky top-0 lg:top-20 z-40 lg:z-0 left-0 h-full lg:h-auto w-80 lg:w-64 bg-surface lg:bg-transparent border-r lg:border-r-0 border-border lg:border-none p-6 lg:p-0 transition-transform duration-300 transform lg:transform-none overflow-y-auto lg:overflow-visible
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile Close Button */}
          <div className="flex justify-between items-center mb-6 lg:hidden">
            <h3 className="text-xl font-heading text-ink">Filters</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="text-2xl text-ink font-bold">
              &times;
            </button>
          </div>

          <div className="space-y-6 text-left bg-surface lg:p-5 border border-border rounded-xl lg:shadow-xs border-b-[3px] border-primary">
            {/* Header with Clear button */}
            <div className="flex justify-between items-center pb-2">
              <h3 className="font-heading font-black text-lg text-ink hidden lg:block">Filters</h3>
              <button
                onClick={handleClearFilters}
                className="text-xs font-heading font-bold text-ink-muted border border-border px-3 py-1.5 rounded-pill hover:bg-bg transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="font-heading font-black text-base text-ink block">Category</span>
              <div className="flex flex-col gap-2 pt-1">
                {categories.map((cat) => {
                  const CATEGORY_EMOJIS: Record<string, string> = {
                    Puzzles: '🧩', Cars: '🚗', Animals: '🦁', Blocks: '🧱',
                    Dolls: '🪆', Art: '🎨', Outdoor: '⛺', Science: '🔬',
                    Music: '🎵', default: '🪀'
                  }
                  const matchingKey = Object.keys(CATEGORY_EMOJIS).find(key => 
                    cat.toLowerCase().includes(key.toLowerCase())
                  ) || 'default'
                  const emoji = CATEGORY_EMOJIS[matchingKey] ?? CATEGORY_EMOJIS.default

                  const isSelected = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? '' : cat)}
                      className={`flex items-center gap-2 px-4 py-2 font-heading font-bold text-sm transition-all duration-150 select-none text-left w-full border-2 rounded-pill ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface border-transparent text-ink hover:text-primary'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{cat}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="font-heading font-black text-base text-ink block">Brand</span>
              <div className="space-y-1.5">
                {brands.map((br) => (
                  <label key={br} className="flex items-center space-x-2.5 font-body text-ink text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === br}
                      onChange={() => setSelectedBrand(br)}
                      className="text-ink-muted focus:ring-primary"
                    />
                    <span>{br}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Group Filter */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="font-heading font-black text-base text-ink block">Age Group</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '0–2 yrs', query: '0-2', color: 'var(--color-age-0)' },
                  { label: '3–5 yrs', query: '3-5', color: 'var(--color-age-3)' },
                  { label: '6–8 yrs', query: '6-8', color: 'var(--color-age-6)' },
                  { label: '9–12 yrs', query: '9-12', color: 'var(--color-age-9)' },
                ].map((item) => {
                  const isSelected = selectedAgeGroup === item.query
                  return (
                    <button
                      key={item.query}
                      type="button"
                      onClick={() => setSelectedAgeGroup(isSelected ? '' : item.query)}
                      className="px-4 py-2 rounded-pill font-heading font-bold text-sm transition-all select-none"
                      style={{
                        backgroundColor: isSelected ? item.color : 'var(--color-surface)',
                        borderColor: isSelected ? 'transparent' : 'var(--color-border)',
                        borderWidth: isSelected ? '0' : '2px',
                        color: isSelected 
                          ? (item.query === '0-2' ? 'var(--color-secondary)' : '#ffffff') 
                          : 'var(--color-ink-muted)'
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="font-heading font-black text-base text-ink block">Price Range (₹)</span>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-bg rounded-md border-2 border-border focus:border-primary focus:outline-none text-xs font-body text-ink"
                />
                <span className="text-ink-muted select-none">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-bg rounded-md border-2 border-border focus:border-primary focus:outline-none text-xs font-body text-ink"
                />
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="font-heading font-black text-base text-ink block">Minimum Rating</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMinRating(star === minRating ? 0 : star)}
                    className={`text-lg transition ${
                      star <= minRating ? 'text-accent-yellow' : 'text-border hover:text-accent-yellow/40'
                    }`}
                  >
                    ★
                  </button>
                ))}
                {minRating > 0 && (
                  <span className="text-[11px] font-body text-ink-muted ml-1 select-none">({minRating}+)</span>
                )}
              </div>
            </div>

            {/* In Stock Only */}
            <div className="space-y-2 border-t border-border/60 pt-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${inStockOnly ? 'bg-primary' : 'bg-[#EAE3D5]'}`}></div>
                  <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${inStockOnly ? 'transform translate-x-5' : ''}`}></div>
                </div>
                <span className="font-body font-semibold text-ink">In Stock Only</span>
              </label>
            </div>

            {/* Mobile close apply button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-full mt-4 btn-primary rounded-pill bg-primary text-white font-heading font-bold py-2.5 text-sm lg:hidden"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar backdrop */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* PRODUCTS LIST GRID AREA */}
        <main className="flex-grow space-y-6">
          <div className="text-left font-body text-ink-muted text-xs font-bold uppercase tracking-wider">
            Showing {products.length} items
          </div>

          {error && (
            <div className="bg-primary/10 border border-primary/25 p-4 rounded-lg text-primary text-xs mb-3 text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-semibold">
              <span className="flex items-center">
                <span className="mr-2 text-sm">⚠️</span> {error}
              </span>
              <button
                onClick={() => fetchProductsList()}
                className="bg-primary text-white font-heading font-bold text-[10px] px-3.5 py-1.5 rounded uppercase hover:bg-primary-hover tracking-wider select-none shrink-0"
              >
                Retry Connection
              </button>
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-surface border border-border rounded-2xl p-4 space-y-4 animate-pulse">
                  <div className="aspect-square w-full bg-border rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-border rounded w-1/4"></div>
                    <div className="h-4 bg-border rounded w-3/4"></div>
                    <div className="h-4 bg-border rounded w-1/3"></div>
                  </div>
                  <div className="h-10 bg-border rounded-pill w-full"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No Products Found"
              message="Try widening your price range, typing a different keyword, or clearing filters."
              buttonText="Reset Filters"
              onClick={handleClearFilters}
              icon={<span className="text-6xl select-none" role="img" aria-label="yoyo">🪀</span>}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => {
                const isWishlisted = wishlistItems.some((item) => item.id === product.id)
                
                const handleWishlist = (e: React.MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (isWishlisted) {
                    removeFromWishlist(product.id)
                  } else {
                    addToWishlist(product)
                  }
                }

                const handleAddToCart = (e: React.MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const defaultVariant = product.variants?.[0] || { name: 'Standard', stock: 1 }
                  addToCart(product, defaultVariant, 1)
                }

                return (
                  <div
                    key={product.id}
                    className="card-workshop overflow-hidden flex flex-col group rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-surface border border-border"
                  >
                    <Link to={`/products/${product.slug}`} className="flex flex-col h-full">
                      {/* Image container */}
                      <div className="relative aspect-square rounded-t-2xl overflow-hidden bg-bg select-none w-full">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-5xl filter drop-shadow select-none">🧸</span>
                        )}

                        {/* Wishlist heart button */}
                        <button
                          onClick={handleWishlist}
                          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-lg hover:scale-110 active:scale-90 transition-all z-10 border border-border"
                          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <span>{isWishlisted ? '❤️' : '🤍'}</span>
                        </button>

                        {/* Age badge */}
                        {product.ageGroup && (
                          <span
                            className="badge-age absolute bottom-2 left-2 shadow-sm"
                            style={{ 
                              backgroundColor: getAgeGroupColor(product.ageGroup),
                              color: isYellowAge(product.ageGroup) ? 'var(--color-secondary)' : '#ffffff'
                            }}
                          >
                            Ages {product.ageGroup.replace(' years', '')}
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2 text-left">
                        <div className="space-y-1">
                          <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-wider block">
                            {product.category}
                          </span>
                          <h3 className="font-heading font-bold text-base line-clamp-2 text-ink group-hover:text-primary transition-colors leading-snug">
                            {product.title}
                          </h3>
                          {/* Stars */}
                          <div className="flex text-sm text-accent-yellow" aria-label={`${product.rating.toFixed(1)} out of 5 stars`}>
                            {"⭐".repeat(Math.round(product.rating || 5))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-1.5 border-t border-border/40">
                          <p className="font-heading font-black text-xl text-primary leading-none">
                            ₹{product.discountPrice.toFixed(2)}
                          </p>

                          <button
                            onClick={handleAddToCart}
                            disabled={product.stockStatus === 'Out of Stock'}
                            className="w-full rounded-pill bg-primary hover:bg-primary-hover active:scale-95 transition-all text-white font-heading font-bold text-sm min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <span>🛒</span>
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* Load More Trigger */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={handleLoadMore}
                className="btn-primary bg-primary hover:bg-primary-hover/95 text-white font-heading font-bold px-8 py-3 rounded-lg shadow-sm"
              >
                Load More Toys
              </button>
            </div>
          )}
        </main>
      </div>
    </PageContainer>
  )
}

export default Catalog
