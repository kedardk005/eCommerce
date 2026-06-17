import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '../mockData'
import { useCart } from './CartContext'
import { useAuth } from './AuthContext'

interface WishlistContextType {
  wishlistItems: Product[]
  loading: boolean
  error: string | null
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  moveToCart: (product: Product) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth()
  const { updateCartItemsRaw } = useCart()
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [rawWishlist, setRawWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Map backend wishlist items to frontend Product format
  const mapBackendWishlistToFrontend = (backendItems: any[]): Product[] => {
    if (!backendItems) return []
    return backendItems.map((item: any) => {
      const p = item.product
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
        stockStatus: p.variants && p.variants.some((v: any) => v.stock > 0) ? 'In Stock' : 'Out of Stock',
        variants: p.variants ? p.variants.map((v: any) => ({
          name: v.attributes?.name || v.name || 'Standard',
          stock: v.stock
        })) : [],
        reviews: [],
        imageColor: 'bg-primary'
      }
    })
  }

  // Fetch wishlist from backend
  const fetchWishlist = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error('Failed to load wishlist')
      }
      const data = await res.json()
      setRawWishlist(data)
      setWishlistItems(mapBackendWishlistToFrontend(data))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load wishlist on authentication status changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchWishlist()
    } else {
      setRawWishlist([])
      setWishlistItems([])
    }
  }, [isLoggedIn])

  // Add item to wishlist
  const addToWishlist = async (product: Product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Please sign in to add items to your wishlist.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // 1. Resolve real CUID from database
      const resDetail = await fetch(`/api/products/${product.slug}`)
      if (!resDetail.ok) {
        throw new Error('Product not found in store database.')
      }
      const { product: realProduct } = await resDetail.json()

      // 2. Post to backend
      const resAdd = await fetch('/api/wishlist/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: realProduct.id
        })
      })

      if (!resAdd.ok) {
        const err = await resAdd.json()
        throw new Error(err.error || 'Failed to add item to wishlist')
      }

      const data = await resAdd.json()
      setRawWishlist(data)
      setWishlistItems(mapBackendWishlistToFrontend(data))
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Find the wishlist item record ID matching this product ID
    const matched = rawWishlist.find((item: any) => item.productId === productId || item.product.id === productId)
    if (!matched) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/wishlist/items/${matched.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error('Failed to remove item from wishlist')
      }
      const data = await res.json()
      setRawWishlist(data)
      setWishlistItems(mapBackendWishlistToFrontend(data))
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Move wishlist item to cart transactionally
  const moveToCart = async (product: Product) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const matched = rawWishlist.find((item: any) => item.productId === product.id || item.product.id === product.id)
    if (!matched) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/wishlist/items/${matched.id}/move-to-cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to move item to cart')
      }

      const { cart, wishlist } = await res.json()

      // Update both wishlist state and cart context state
      setRawWishlist(wishlist)
      setWishlistItems(mapBackendWishlistToFrontend(wishlist))
      updateCartItemsRaw(cart)
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        error,
        addToWishlist,
        removeFromWishlist,
        moveToCart
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
