import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AGE_GROUPS } from '../mockData'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'
import EmptyState from '../components/EmptyState'

export const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Sidebar visibility on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Metadata states
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  const initialCategory = searchParams.get('category') || ''
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('')
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

  // Listen to URL search param changes (e.g. from Home page category strip clicks)
  useEffect(() => {
    const cat = searchParams.get('category') || ''
    setSelectedCategory(cat)
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
      if (selectedAgeGroup) params.append('ageGroup', selectedAgeGroup)
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
            placeholder="Search toys by name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-md font-body text-ink placeholder-ink-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent-blue/45"
          />
          <span className="absolute left-3.5 top-3 text-ink-muted text-sm select-none">🔍</span>
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
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-ink text-base hidden lg:block">Filters</h3>
              <button
                onClick={handleClearFilters}
                className="text-xs font-heading font-bold text-primary hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-widest block">Category</span>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center space-x-2.5 font-body text-ink text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="text-ink-muted focus:ring-primary"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-widest block">Brand</span>
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
              <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-widest block">Age Group</span>
              <div className="space-y-1.5">
                {AGE_GROUPS.map((age) => (
                  <label key={age} className="flex items-center space-x-2.5 font-body text-ink text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="ageGroup"
                      checked={selectedAgeGroup === age}
                      onChange={() => setSelectedAgeGroup(age)}
                      className="text-ink-muted focus:ring-primary"
                    />
                    <span>{age}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-widest block font-medium">Price Range (₹)</span>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-accent-blue/45"
                />
                <span className="text-ink-muted select-none">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-accent-blue/45"
                />
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-2.5 border-t border-border/60 pt-4">
              <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-widest block font-medium">Minimum Rating</span>
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
              <label className="flex items-center space-x-2.5 font-body text-ink text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-ink-muted focus:ring-primary"
                />
                <span className="font-heading font-bold text-sm text-ink">In-Stock Only</span>
              </label>
            </div>
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
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <h2 className="text-xl font-heading text-ink">Loading toys from the cabin workshop...</h2>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No Products Found"
              message="Try widening your price range, typing a different keyword, or clearing filters."
              buttonText="Reset Filters"
              onClick={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="card-workshop overflow-hidden flex flex-col group"
                >
                  {/* Image placeholder */}
                  <div className="h-40 sm:h-48 bg-border flex items-center justify-center relative border-b border-border overflow-hidden select-none w-full">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-4xl sm:text-5xl filter drop-shadow transition-transform duration-300 group-hover:scale-110">🧸</span>
                    )}
                    {/* Corner Tag Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2.5 items-start">
                      {product.discountPrice < product.price && (
                        <BadgeTag text="sale" variant="red" />
                      )}
                      {product.stockStatus === 'Out of Stock' && (
                        <BadgeTag text="sold out" variant="secondary" />
                      )}
                      {product.stockStatus === 'Low Stock' && (
                        <BadgeTag text="low stock" variant="yellow" />
                      )}
                    </div>
                  </div>

                  {/* Info Block */}
                  <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="font-heading text-ink text-base sm:text-lg line-clamp-1 group-hover:text-accent-blue transition duration-200">
                        {product.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="font-heading font-bold text-ink text-base sm:text-lg">
                          ₹{product.discountPrice.toFixed(2)}
                        </span>
                        {product.price > product.discountPrice && (
                          <span className="font-body text-ink-muted line-through text-xs">
                            ₹{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-heading font-bold text-ink flex items-center space-x-0.5">
                        <span className="text-accent-yellow text-sm">★</span>
                        <span>{product.rating.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
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
