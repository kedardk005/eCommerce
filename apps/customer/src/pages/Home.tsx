import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'

export const Home: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomeData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, prodRes, bannerRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products?limit=4&sort=rating'),
        fetch('/api/banners')
      ])
      if (catRes.ok) {
        const cats = await catRes.json()
        setCategories(cats.map((c: any) => c.name))
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        const formatted = (prodData.items || prodData.data || []).map((p: any) => {
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
            imageColor: 'bg-primary'
          }
        })
        setFeaturedProducts(formatted)
      }
      if (bannerRes.ok) {
        const bannerData = await bannerRes.json()
        setBanners(bannerData)
      }
    } catch (err) {
      console.error('Failed to load home page data:', err)
      setError('Could not establish connection to the toy cabin server. Please verify your network.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomeData()
  }, [])

  // Auto-advance banner slides
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners])

  return (
    <PageContainer className="space-y-24 pb-20">
      {loading && featuredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          <p className="text-sm font-heading font-bold text-ink-muted">Polishing wooden toys in the workshop...</p>
        </div>
      )}

      {error && (
        <div className="max-w-xl mx-auto bg-primary/10 border border-primary/20 p-8 rounded-xl text-center space-y-4 shadow-sm">
          <p className="text-sm text-primary font-bold">⚠️ Connection Issue</p>
          <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
          <button
            onClick={() => fetchHomeData()}
            className="btn-primary bg-primary hover:bg-primary-hover text-white px-6 py-2.5 text-xs rounded-lg font-heading font-bold"
          >
            Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* a. HERO SECTION / BANNERS CAROUSEL */}
          {banners.length > 0 ? (
            <section className="relative h-[65vh] min-h-[400px] w-full overflow-hidden bg-bg rounded-2xl border border-border shadow-xs group">
              {/* Slider Container */}
              <div 
                className="w-full h-full flex transition-transform duration-500 ease-out" 
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {banners.map((banner) => (
                  <div key={banner.id} className="w-full h-full shrink-0 relative">
                    {banner.link ? (
                      <Link to={banner.link} className="block w-full h-full">
                        <img src={banner.url} alt="Showcase Slider" className="w-full h-full object-cover" />
                      </Link>
                    ) : (
                      <img src={banner.url} alt="Showcase Slider" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>

              {/* Previous/Next Arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-bg/80 hover:bg-bg border border-border p-2 rounded-full shadow-xs text-xs font-bold z-10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-bg/80 hover:bg-bg border border-border p-2 rounded-full shadow-xs text-xs font-bold z-10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ▶
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        idx === currentSlide ? 'bg-primary w-5' : 'bg-ink-muted/50 hover:bg-ink-muted/80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="relative h-[75vh] min-h-[500px] w-full overflow-hidden bg-bg rounded-2xl border border-border shadow-xs flex items-center px-6 sm:px-16">
              {/* Background Spline 3D iframe */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <iframe
                  src="https://my.spline.design/airplanecopy-pH4tfCaVMAv3K6UfPUCdPwUr/"
                  frameBorder="0"
                  width="100%"
                  height="100%"
                  title="Spline 3D Airplane Model"
                ></iframe>
              </div>

              {/* Cover element to hide "Built with Spline" watermark badge */}
              <div className="absolute bottom-0 right-0 w-[140px] h-[40px] bg-bg z-10 pointer-events-none" />

              {/* Content Panel */}
              <div className="relative z-10 max-w-lg text-left space-y-6">
                <div className="space-y-3">
                  <span className="bg-primary/15 text-primary text-xs font-heading font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block">
                    Grand Opening 🧸
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-ink leading-tight">
                    Pure Joy in Every Grain.
                  </h1>
                  <p className="font-body text-ink-muted text-sm sm:text-base leading-relaxed">
                    Organic, chemical-free toys handcrafted in our family workshop. Designed to foster logic, creativity, and lifetime milestones.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3.5">
                  <Link
                    to="/products"
                    className="btn-primary bg-primary hover:bg-primary-hover/95 text-white font-heading font-bold py-3 px-8 rounded-lg shadow-sm text-sm"
                  >
                    Browse Workshop
                  </Link>
                  <a
                    href="#categories"
                    className="bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 text-secondary font-heading font-bold py-3 px-8 rounded-lg text-sm transition-colors"
                  >
                    Explore Categories
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* b. POPULAR CATEGORIES */}
          <section id="categories" className="space-y-6 scroll-mt-20">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">Explore Categories</h2>
              <p className="text-[11px] sm:text-xs text-ink-muted font-body">Tailored wood crafts built for developmental ages and interactive play.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat, idx) => (
                <Link
                  key={cat}
                  to={`/products?category=${encodeURIComponent(cat)}`}
                  className="card-workshop bg-surface border border-border p-4.5 rounded-xl text-center space-y-3 hover:scale-102 hover:shadow-sm duration-200 block group"
                >
                  <div className="h-12 w-12 rounded-full bg-secondary/5 flex items-center justify-center mx-auto text-xl group-hover:bg-primary/15 transition-colors select-none">
                    {['🧸', '🚗', '🎨', '🧩', '📚', '🌲'][idx % 6]}
                  </div>
                  <span className="font-heading font-bold text-xs text-ink block line-clamp-1">
                    {cat}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* c. FEATURED WORKSHOP PRODUCTS */}
          <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-border/60 pb-3.5">
              <div className="text-left space-y-1">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink">Staff Favorites</h2>
                <p className="text-[11px] sm:text-xs text-ink-muted font-body">Our highest rated, organic wood masterpieces from this season.</p>
              </div>
              <Link
                to="/products"
                className="text-xs font-heading font-bold text-accent-teal hover:underline uppercase tracking-wider select-none shrink-0"
              >
                View Catalog ➜
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="card-workshop overflow-hidden flex flex-col group"
                >
                  <div className="h-44 bg-border flex items-center justify-center relative border-b border-border overflow-hidden select-none">
                    <span className="text-5xl filter drop-shadow transition-transform duration-300 group-hover:scale-110">🧸</span>
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.discountPrice < product.price && (
                        <BadgeTag text="sale" variant="red" />
                      )}
                      {product.stockStatus === 'Out of Stock' && (
                        <BadgeTag text="sold out" variant="secondary" />
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="font-heading text-ink text-base line-clamp-1 group-hover:text-accent-blue transition duration-200">
                        {product.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                      <div className="flex items-baseline space-x-1">
                        <span className="font-heading font-bold text-ink text-base">
                          ${product.discountPrice.toFixed(2)}
                        </span>
                        {product.price > product.discountPrice && (
                          <span className="font-body text-ink-muted line-through text-xs">
                            ${product.price.toFixed(2)}
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
          </section>

          {/* d. BANNER/PROMO SECTION */}
          <section>
            <div className="bg-accent-teal/15 border border-accent-teal/30 rounded-xl p-8 sm:p-12 text-center space-y-5 max-w-4xl mx-auto shadow-xs">
              <span className="bg-accent-teal/20 text-accent-teal text-xs font-heading font-bold px-3.5 py-1 rounded-full uppercase tracking-widest">
                Limited Time Promo
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading text-ink">Organic & Child Safe Play</h2>
              <p className="text-ink font-body text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Get an extra <strong className="text-ink">20% off</strong> on your first order. Use the coupon code <code className="bg-surface px-2.5 py-1 border border-border text-primary font-bold rounded font-heading text-xs tracking-wider">WOODTOY20</code> at simulated checkout.
              </p>
              <div className="pt-2">
                <Link
                  to="/products"
                  className="btn-primary bg-accent-teal hover:bg-accent-teal/95 text-white font-heading font-bold py-2.5 px-8 rounded-lg shadow-sm"
                >
                  Browse Collections
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </PageContainer>
  )
}

export default Home
