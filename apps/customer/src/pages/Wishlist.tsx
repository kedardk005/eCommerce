import React from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'

export const Wishlist: React.FC = () => {
  const { wishlistItems, removeFromWishlist, moveToCart } = useWishlist()

  const getAgeGroupColor = (ageGroup?: string) => {
    if (!ageGroup) return 'var(--color-accent-teal)'
    if (ageGroup.includes('0-2')) return 'var(--color-age-0)'
    if (ageGroup.includes('3-5')) return 'var(--color-age-3)'
    if (ageGroup.includes('6-8')) return 'var(--color-age-6)'
    if (ageGroup.includes('9-12')) return 'var(--color-age-9)'
    return 'var(--color-accent-teal)'
  }

  if (wishlistItems.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          title="Your Wishlist is Empty"
          message="Save items that catch your eye in the wishlist to revisit and buy them later."
          buttonText="Explore Toys"
          buttonLink="/products"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Saved Favorites</span>
        <h1 className="font-heading font-black text-3xl text-ink tracking-tight mb-1">My Wishlist</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Manage your favorite wooden toys and add them to your cart.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-left">
        {wishlistItems.map((product) => (
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

                {/* Remove from wishlist button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeFromWishlist(product.id)
                  }}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow border border-border text-primary hover:scale-110 active:scale-90 transition-transform flex items-center justify-center text-lg z-10"
                  aria-label="Remove from wishlist"
                  title="Remove from wishlist"
                >
                  ❤️
                </button>

                {/* Age badge */}
                {product.ageGroup && (
                  <span
                    className="badge-age absolute bottom-2 left-2 shadow-sm"
                    style={{ 
                      backgroundColor: getAgeGroupColor(product.ageGroup),
                      color: (product.ageGroup.includes('0-2') || product.ageGroup.includes('0-1')) ? 'var(--color-secondary)' : '#ffffff'
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
                  <div className="flex text-sm text-accent-yellow" aria-label={`${(product.rating || 5).toFixed(1)} out of 5 stars`}>
                    {"⭐".repeat(Math.round(product.rating || 5))}
                  </div>
                </div>

                <div className="space-y-2 pt-1.5 border-t border-border/40">
                  <p className="font-heading font-black text-xl text-primary leading-none">
                    ₹{product.discountPrice.toFixed(2)}
                  </p>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      moveToCart(product)
                    }}
                    disabled={product.stockStatus === 'Out of Stock'}
                    className="w-full rounded-pill bg-primary hover:bg-primary-hover active:scale-95 transition-all text-white font-heading font-bold text-sm min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>🛒</span>
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}

export default Wishlist
