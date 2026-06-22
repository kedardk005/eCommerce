import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────
// HERO SECTION — asymmetric 2-column editorial layout
// ─────────────────────────────────────────────────────────────────
const HeroSection: React.FC = () => {
  const heroImages = [
    {
      src: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=900&fit=crop',
      alt: 'Handcrafted wooden toys',
    },
    {
      src: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=400&fit=crop',
      alt: 'Toy store collection',
    },
    {
      src: 'https://images.unsplash.com/photo-1595037969702-b464bcd0df10?w=600&h=400&fit=crop',
      alt: 'Kids playing with toys',
    },
    {
      src: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=900&fit=crop',
      alt: 'Building blocks',
    },
  ]

  return (
    <section className="w-full bg-white" aria-label="Hero">
      <div className="section-inner py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[75vh]">

          {/* LEFT — text column */}
          <div className="flex flex-col justify-center space-y-8 order-1 lg:order-1">
            {/* Eyebrow */}
            <span className="font-heading font-semibold text-[11px] tracking-[0.25em] uppercase text-ink-muted">
              Handcrafted &middot; Safe &middot; Timeless
            </span>

            {/* Headline */}
            <h1
              className="font-heading font-bold text-ink leading-[1.05]"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}
            >
              Wooden toys
              <br />
              <span className="text-secondary">for big</span>
              <br />
              imaginations.
            </h1>

            {/* Sub-copy */}
            <p
              className="font-body text-ink-muted leading-relaxed"
              style={{ maxWidth: '32ch', fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
            >
              Sustainably sourced, chemical-free and built to outlast childhood — every toy a story waiting to be written.
            </p>

            {/* CTA */}
            <div>
              <Link
                to="/products"
                id="hero-shop-now-btn"
                className="btn-pill-dark"
              >
                Shop Now
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { label: '500+', sub: 'Unique toys' },
                { label: '4.9★', sub: 'Average rating' },
                { label: 'Free', sub: 'Shipping over ₹500' },
              ].map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <p className="font-heading font-bold text-ink text-lg">{item.label}</p>
                  <p className="font-body text-ink-muted text-xs">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — asymmetric image grid */}
          <div className="order-2 lg:order-2" style={{ minHeight: '480px' }}>
            <div className="grid h-full gap-3 sm:gap-4" style={{ gridTemplateColumns: '58% 42%', minHeight: '480px', maxHeight: '680px' }}>
              {/* Left Column — 58% width */}
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Image 1: Tall */}
                <div className="flex-[3.5] rounded-2xl overflow-hidden bg-border relative">
                  <img
                    src={heroImages[0].src}
                    alt={heroImages[0].alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{ backgroundColor: '#E7E4DC' }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.style.backgroundColor = '#E7E4DC'
                      }
                    }}
                  />
                </div>
                {/* Image 2: Short */}
                <div className="flex-[2] rounded-2xl overflow-hidden bg-border relative">
                  <img
                    src={heroImages[1].src}
                    alt={heroImages[1].alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{ backgroundColor: '#E7E4DC' }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.style.backgroundColor = '#E7E4DC'
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right Column — 42% width */}
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Image 3: Short */}
                <div className="flex-[2] rounded-2xl overflow-hidden bg-border relative">
                  <img
                    src={heroImages[2].src}
                    alt={heroImages[2].alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{ backgroundColor: '#E7E4DC' }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.style.backgroundColor = '#E7E4DC'
                      }
                    }}
                  />
                </div>
                {/* Image 4: Tall */}
                <div className="flex-[3.5] rounded-2xl overflow-hidden bg-border relative">
                  <img
                    src={heroImages[3].src}
                    alt={heroImages[3].alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    style={{ backgroundColor: '#E7E4DC' }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.style.backgroundColor = '#E7E4DC'
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}


// ─────────────────────────────────────────────────────────────────
// CATEGORY STRIP
// ─────────────────────────────────────────────────────────────────
const categoryEmojis = ['🧸', '🚗', '🎨', '🧩', '📚', '🌲']
const categoryImages = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=80&h=80&fit=crop',
]

interface CategoryStripProps {
  categories: string[]
}

const CategoryStrip: React.FC<CategoryStripProps> = ({ categories }) => {
  if (categories.length === 0) return null

  return (
    <section className="w-full bg-white border-y border-border" id="categories" aria-label="Product categories">
      <div className="section-inner py-10">
        <div className="flex flex-wrap items-center justify-center gap-0">
          {categories.map((cat, idx) => (
            <React.Fragment key={cat}>
              <Link
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="flex flex-col sm:flex-row items-center gap-3 px-6 sm:px-8 py-4 group hover:bg-bg/60 transition-colors duration-150 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-border flex items-center justify-center shrink-0">
                  <img
                    src={categoryImages[idx % categoryImages.length]}
                    alt={cat}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      if (target.parentElement) {
                        target.parentElement.textContent = categoryEmojis[idx % 6]
                      }
                    }}
                  />
                </div>
                <span className="font-heading font-semibold text-sm text-ink group-hover:text-primary transition-colors tracking-wide">
                  {cat}
                </span>
              </Link>
              {idx < categories.length - 1 && (
                <div className="cat-divider hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}


// ─────────────────────────────────────────────────────────────────
// CURATED WITH CARE — split section
// ─────────────────────────────────────────────────────────────────
const CuratedSection: React.FC = () => {
  return (
    <section className="w-full bg-white" aria-label="About our craft">
      <div className="section-inner py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Image side */}
          <div className="order-2 lg:order-1 rounded-2xl overflow-hidden bg-border" style={{ minHeight: '420px', maxHeight: '560px' }}>
            <img
              src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=900&h=700&fit=crop"
              alt="Handcrafted wooden toys in our workshop"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              style={{ minHeight: '420px', backgroundColor: '#E7E4DC' }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                if (target.parentElement) {
                  target.parentElement.style.backgroundColor = '#E7E4DC'
                }
              }}
            />
          </div>

          {/* Text side */}
          <div className="order-1 lg:order-2 space-y-6">
            <span className="font-heading font-semibold text-[11px] tracking-[0.25em] uppercase text-ink-muted block">
              Our Promise
            </span>
            <h2 className="font-heading font-bold text-ink" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: 1.15 }}>
              Curated with care,<br />crafted with love.
            </h2>
            <p className="font-body text-ink-muted text-sm sm:text-base leading-relaxed">
              Every toy in our collection is sourced from workshops that share our commitment to safety, sustainability, and developmental quality. We test each piece against rigorous child-safety standards before it ever reaches your hands.
            </p>
            <p className="font-body text-ink-muted text-sm sm:text-base leading-relaxed">
              From the forests that give us our timber to the artisans who shape every curve — we believe great toys begin long before they reach the toy chest. That's why we trace every piece back to its roots.
            </p>
            <Link
              to="/about"
              id="curated-learn-more-link"
              className="inline-flex items-center gap-2 font-heading font-semibold text-sm text-ink border-b border-ink/30 pb-0.5 hover:border-ink transition-colors duration-150 group"
            >
              Learn more about us
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-150 group-hover:translate-x-1">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// EDITORIAL PRODUCT CARD
// ─────────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: {
    id: string
    title: string
    slug: string
    price: number
    discountPrice: number
    category: string
    rating: number
    stockStatus: string
    image?: string
  }
  badge?: string
}

const EditorialProductCard: React.FC<ProductCardProps> = ({ product, badge }) => {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 w-full"
      style={{ boxShadow: '0 1px 4px rgba(32,33,43,0.05)' }}
    >
      {/* Image area */}
      <div
        className="relative overflow-hidden bg-bg flex items-center justify-center w-full"
        style={{ aspectRatio: '4/3' }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="text-6xl filter drop-shadow transition-transform duration-500 group-hover:scale-110 select-none">🧸</span>
        )}

        {/* Minimal text tags — replace heavy pills */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {badge && (
            <span className="font-heading font-bold text-[10px] uppercase tracking-wider text-white bg-primary px-2 py-0.5 rounded shadow-sm">
              {badge}
            </span>
          )}
          {product.discountPrice < product.price && (
            <span className="font-heading font-bold text-[10px] uppercase tracking-wider text-primary bg-white/90 px-2 py-0.5 rounded">
              Sale
            </span>
          )}
          {product.stockStatus === 'Out of Stock' && (
            <span className="font-heading font-bold text-[10px] uppercase tracking-wider text-ink-muted bg-white/90 px-2 py-0.5 rounded">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Info block */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <span className="font-heading font-semibold text-[10px] uppercase tracking-widest text-ink-muted block">
            {product.category}
          </span>
          <h3 className="font-heading font-semibold text-ink text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {product.title}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-ink text-base">
              ₹{product.discountPrice.toFixed(2)}
            </span>
            {product.price > product.discountPrice && (
              <span className="font-body text-ink-muted line-through text-xs">
                ₹{product.price.toFixed(2)}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-heading font-semibold text-ink">
            <span className="text-accent-yellow">★</span>
            {product.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────
// SHOP BY AGE — playful stages
// ─────────────────────────────────────────────────────────────────
const ShopByAgeSection: React.FC = () => {
  const ages = [
    { range: '0-1 years', label: 'Baby', emoji: '👶', bg: 'bg-[#FFF0EF]', border: 'border-[#FFD5D2]', text: 'text-[#FF5C4D]' },
    { range: '1-3 years', label: 'Toddler', emoji: '🧸', bg: 'bg-[#FFF9EB]', border: 'border-[#FFE9C2]', text: 'text-[#FFB01F]' },
    { range: '3-5 years', label: 'Preschool', emoji: '🧩', bg: 'bg-[#EBFDF5]', border: 'border-[#C3F4DE]', text: 'text-[#2BBBA0]' },
    { range: '5-7 years', label: 'Explorer', emoji: '🚗', bg: 'bg-[#EBF5FF]', border: 'border-[#C2E0FF]', text: 'text-[#4D8DFF]' },
    { range: '8+ years', label: 'Creative', emoji: '🧠', bg: 'bg-[#FAF0FF]', border: 'border-[#EED4FF]', text: 'text-[#B85CFF]' }
  ]

  return (
    <section className="w-full bg-white border-b border-border" aria-label="Shop by age">
      <div className="section-inner py-16 md:py-20 text-center space-y-10">
        <div className="space-y-3">
          <span className="font-heading font-semibold text-[11px] tracking-[0.25em] uppercase text-ink-muted block">
            Age Finder
          </span>
          <h2 className="font-heading font-bold text-ink" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: 1.15 }}>
            Shop by Age
          </h2>
          <p className="font-body text-ink-muted text-sm sm:text-base max-w-xl mx-auto">
            Find the perfect developmental wooden toy to inspire your child's milestones.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {ages.map((item) => (
            <Link
              key={item.range}
              to={`/products?ageGroup=${encodeURIComponent(item.range)}`}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 ${item.bg} ${item.border} hover-bounce-subtle shadow-playful transition duration-300`}
            >
              <span className="text-5xl mb-3 filter drop-shadow-sm select-none">{item.emoji}</span>
              <span className={`font-heading font-bold text-lg ${item.text}`}>{item.label}</span>
              <span className="font-body text-xs text-ink-muted font-medium mt-1">{item.range}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// WHY US?! — brand play values
// ─────────────────────────────────────────────────────────────────
const WhyUsSection: React.FC = () => {
  const benefits = [
    {
      title: '100% Sustainable Wood',
      desc: 'Sourced from certified, renewable forests. Gorgeous, natural beechwood and maple grains.',
      emoji: '🌲',
      borderColor: 'border-[#FF5C4D]', // primary
      shadowColor: 'hover:shadow-[#FF5C4D]/10'
    },
    {
      title: 'Child-Safe & Non-Toxic',
      desc: 'Finished with organic linseed oil and water-based paints. Safe for curious little teeth.',
      emoji: '🎨',
      borderColor: 'border-[#4D8DFF]', // accent blue
      shadowColor: 'hover:shadow-[#4D8DFF]/10'
    },
    {
      title: 'Handmade to Outlast',
      desc: 'Crafted by master artisans with soft rounded edges. Made to survive generations of play.',
      emoji: '🔨',
      borderColor: 'border-[#FFC53D]', // accent yellow
      shadowColor: 'hover:shadow-[#FFC53D]/10'
    },
    {
      title: 'Plastic-Free Shipping',
      desc: 'We pack and ship exclusively with biodegradable, recycled materials to protect their future.',
      emoji: '📦',
      borderColor: 'border-[#2BBBA0]', // accent teal
      shadowColor: 'hover:shadow-[#2BBBA0]/10'
    }
  ]

  return (
    <section className="w-full bg-white border-b border-border" aria-label="Why Choose Us">
      <div className="section-inner py-20 md:py-24 text-center space-y-12">
        <div className="space-y-3">
          <span className="font-heading font-semibold text-[11px] tracking-[0.25em] uppercase text-ink-muted block">
            Our Play Values
          </span>
          <h2 className="font-heading font-bold text-ink" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: 1.15 }}>
            Why Us?!
          </h2>
          <p className="font-body text-ink-muted text-sm sm:text-base max-w-xl mx-auto">
            We believe toys should trigger creativity, not clutter. Safe materials, safe planet, happy families.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {benefits.map((item) => (
            <div
              key={item.title}
              className={`bg-surface p-6 rounded-2xl border border-border border-b-4 ${item.borderColor} shadow-playful shadow-playful-hover transition-all duration-300`}
            >
              <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-2xl mb-4 select-none">
                {item.emoji}
              </div>
              <h3 className="font-heading font-bold text-lg text-ink mb-2">
                {item.title}
              </h3>
              <p className="font-body text-sm text-ink-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// CUSTOMER TESTIMONIALS
// ─────────────────────────────────────────────────────────────────
const ReviewsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Emily S.',
      role: 'Verified Parent',
      text: 'The craftsmanship is absolutely beautiful. The train set has no sharp edges, smells of real forest pine, and has survived several drops. Truly heirloom quality!',
      rating: 5
    },
    {
      name: 'Jane D.',
      role: 'Verified Parent',
      text: 'It is so hard to find plastic-free toys that actually keep kids engaged. The nesting blocks are brilliant and the colors are gorgeous. Highly recommend!',
      rating: 5
    },
    {
      name: 'Alice W.',
      role: 'Verified Parent',
      text: 'Super fast shipping, beautiful eco-friendly packaging, and my teething daughter loves chewing on the cherrywood duck. 100% safe and trusted.',
      rating: 5
    }
  ]

  return (
    <section className="w-full bg-bg border-b border-border" aria-label="Customer Reviews">
      <div className="section-inner py-20 md:py-24 text-center space-y-12">
        <div className="space-y-3">
          <span className="font-heading font-semibold text-[11px] tracking-[0.25em] uppercase text-ink-muted block">
            Parent Feedback
          </span>
          <h2 className="font-heading font-bold text-ink" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: 1.15 }}>
            Loved by parents &amp; kids
          </h2>
          <p className="font-body text-ink-muted text-sm sm:text-base max-w-xl mx-auto">
            Hear from families who brought our sustainable wooden toys into their playroom.
          </p>
        </div>

        {/* Global score */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white px-8 py-5 rounded-2xl border border-border shadow-playful">
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-heading font-extrabold text-ink">4.9</span>
            <span className="text-3xl font-heading font-extrabold text-accent-yellow">★</span>
          </div>
          <div className="w-px h-6 bg-border hidden sm:block" />
          <div className="text-left">
            <p className="font-heading font-bold text-sm text-ink">Excellent Overall Rating</p>
            <p className="font-body text-xs text-ink-muted mt-0.5">Based on 10,000+ happy parent reviews</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {reviews.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-2xl border border-border shadow-playful relative flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Rating */}
                <div className="flex text-accent-yellow text-base">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                {/* Text */}
                <p className="font-body text-sm text-ink leading-relaxed italic relative z-10">
                  “{item.text}”
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-heading font-bold text-sm text-primary uppercase select-none">
                  {item.name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm text-ink">{item.name}</h4>
                  <p className="font-body text-[11px] text-accent-teal font-semibold">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// HOME PAGE — main component
// ─────────────────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [bestsellerProducts, setBestsellerProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomeData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, featRes, bestRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products?limit=4&sort=newest'),
        fetch('/api/products?limit=4&sort=rating')
      ])

      if (catRes.ok) {
        const cats = await catRes.json()
        setCategories(cats.map((c: any) => c.name))
      }

      const formatProduct = (p: any) => {
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
      }

      if (featRes.ok) {
        const featData = await featRes.json()
        setFeaturedProducts((featData.items || featData.data || []).map(formatProduct))
      }

      if (bestRes.ok) {
        const bestData = await bestRes.json()
        setBestsellerProducts((bestData.items || bestData.data || []).map(formatProduct))
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

  return (
    <div className="w-full animate-fade-in">
      {/* Loading state */}
      {loading && featuredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-secondary border-t-transparent" />
          <p className="text-sm font-heading font-bold text-ink-muted">Polishing wooden toys in the workshop...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="section-inner py-16">
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
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── 1. HERO — always shown, editorial 2-column layout ── */}
          <HeroSection />

          {/* ── 2. CATEGORY STRIP ── */}
          <CategoryStrip categories={categories} />

          {/* ── 3. SHOP BY AGE SECTION ── */}
          <ShopByAgeSection />

          {/* ── 4. FEATURED COLLECTION SECTION (Newest arrivals) ── */}
          {featuredProducts.length > 0 && (
            <section className="w-full bg-bg border-b border-border" aria-label="Featured collection">
              <div className="section-inner py-20 md:py-24 text-center space-y-12">
                {/* Heading details */}
                <div className="space-y-4">
                  <span className="font-heading font-semibold text-[11px] tracking-[0.25em] uppercase text-ink-muted block">
                    New Arrivals
                  </span>
                  <h2 className="font-heading font-bold text-ink" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}>
                    Featured Collection
                  </h2>
                  <p className="font-body text-ink-muted text-sm sm:text-base max-w-xl mx-auto">
                    Our freshest handcrafted wooden playthings, fresh out of the workshop.
                  </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                  {featuredProducts.map((product) => (
                    <EditorialProductCard key={product.id} product={product} badge="New" />
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="pt-4">
                  <Link
                    to="/products"
                    id="featured-view-all-btn"
                    className="inline-flex items-center gap-2 font-heading font-bold text-sm text-white rounded-full px-7 py-3.5 transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 2px 10px rgba(255,92,77,0.3)' }}
                  >
                    View All Products
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ── 5. BESTSELLERS SECTION ── */}
          {bestsellerProducts.length > 0 && (
            <section className="w-full bg-bg border-b border-border" aria-label="Bestsellers collection">
              <div className="section-inner py-20 md:py-24 text-center space-y-12">
                {/* Heading details */}
                <div className="space-y-4">
                  <span className="font-heading font-semibold text-[11px] tracking-[0.25em] uppercase text-accent-teal block">
                    🔥 Highly Rated
                  </span>
                  <h2 className="font-heading font-bold text-ink" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}>
                    Bestsellers
                  </h2>
                  <p className="font-body text-ink-muted text-sm sm:text-base max-w-xl mx-auto">
                    Our most-loved, organic creations that keep little hands busy and playrooms happy.
                  </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                  {bestsellerProducts.map((product) => (
                    <EditorialProductCard key={product.id} product={product} badge="Bestseller" />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 6. CURATED WITH CARE ── */}
          <CuratedSection />

          {/* ── 7. WHY US?! SECTION ── */}
          <WhyUsSection />

          {/* ── 8. OVERALL REVIEWS FROM CUSTOMERS SECTION ── */}
          <ReviewsSection />

          {/* ── PROMO STRIP (retained from original, minimal restyle) ── */}
          <section className="w-full bg-secondary" aria-label="Promotion">
            <div className="section-inner py-14 text-center space-y-4">
              <span className="font-heading font-bold text-[11px] tracking-[0.25em] uppercase text-white/70 block">
                Limited Time
              </span>
              <h2 className="font-heading font-bold text-white text-2xl sm:text-3xl">
                Organic &amp; Child-Safe Play
              </h2>
              <p className="font-body text-white/80 text-sm sm:text-base max-w-lg mx-auto">
                Get an extra <strong className="text-white">20% off</strong> your first order. Use{' '}
                <code className="bg-white/15 px-2 py-0.5 rounded font-heading text-xs text-white tracking-wider">
                  WOODTOY20
                </code>{' '}
                at checkout.
              </p>
              <Link
                to="/products"
                id="promo-browse-btn"
                className="inline-flex items-center gap-2 font-heading font-bold text-sm text-secondary bg-white rounded-full px-7 py-3.5 transition-all duration-200 hover:bg-bg mt-2"
              >
                Browse Collections
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Home
