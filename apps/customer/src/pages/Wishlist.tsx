import React from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'

export const Wishlist: React.FC = () => {
  const { wishlistItems, removeFromWishlist, moveToCart } = useWishlist()

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
        <h1 className="text-3xl sm:text-4xl font-heading text-ink tracking-tight mb-1">My Wishlist</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Manage your favorite wooden toys and add them to your cart.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-left">
        {wishlistItems.map((product) => (
          <div
            key={product.id}
            className="card-workshop overflow-hidden flex flex-col group border-b-[3px]"
          >
            {/* Image Box */}
            <div className="h-40 bg-border flex items-center justify-center relative border-b border-border select-none overflow-hidden w-full">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform duration-300">🧸</span>
              )}
              <button
                onClick={() => removeFromWishlist(product.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-surface/90 hover:bg-surface border border-border/80 flex items-center justify-center rounded-full text-primary font-bold text-base shadow-xs transition duration-150 active:scale-95"
                title="Remove from wishlist"
              >
                &times;
              </button>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-heading font-bold text-ink-muted uppercase tracking-wider block">
                  {product.category}
                </span>
                <Link
                  to={`/products/${product.slug}`}
                  className="font-heading text-ink text-base sm:text-lg line-clamp-1 hover:text-accent-blue transition duration-200 font-bold block"
                >
                  {product.title}
                </Link>
                <p className="font-heading text-ink font-bold text-sm sm:text-base mt-1.5 border-t border-border/20 pt-1">
                  ₹{product.discountPrice.toFixed(2)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-border/40 select-none">
                <button
                  onClick={() => moveToCart(product)}
                  className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 text-ink font-heading font-bold py-2 px-3 rounded text-xs flex items-center justify-center space-x-1"
                >
                  <span>🛒</span>
                  <span>Move to Cart</span>
                </button>
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="w-full btn-primary bg-surface hover:bg-bg/40 text-primary font-heading font-bold py-2 px-3 rounded text-xs border border-border"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}

export default Wishlist
