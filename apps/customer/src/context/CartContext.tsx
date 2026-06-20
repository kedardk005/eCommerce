import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Product, Variant } from '../mockData'
import { useAuth } from './AuthContext'

export interface CartItem {
  product: Product
  variant: Variant
  quantity: number
}

interface CartContextType {
  cartItems: CartItem[]
  activeCoupon: string
  couponDiscount: number
  loading: boolean
  error: string | null
  setActiveCoupon: (coupon: string) => void
  addToCart: (product: Product, variant: Variant, quantity: number) => void
  removeFromCart: (productId: string, variantName: string) => void
  updateQuantity: (productId: string, variantName: string, quantity: number) => void
  clearCart: () => void
  updateCartItemsRaw: (backendCart: any) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn, authFetch } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartItemsRaw, setCartItemsRaw] = useState<any[]>([])
  const [activeCoupon, setActiveCouponState] = useState<string>('')
  const [couponDiscount, setCouponDiscount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Map backend cart to frontend mock format
  const mapBackendCartToFrontend = (backendCart: any): CartItem[] => {
    if (!backendCart || !backendCart.items) return []
    return backendCart.items.map((item: any) => {
      const p = item.productVariant.product
      const v = item.productVariant

      const mappedProduct: Product = {
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
        stockStatus: v.stock > 0 ? 'In Stock' : 'Out of Stock',
        variants: p.variants ? p.variants.map((varOpt: any) => ({
          name: varOpt.attributes?.name || varOpt.name || 'Standard',
          stock: varOpt.stock
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

      const mappedVariant: Variant = {
        name: v.attributes?.name || v.name || 'Standard',
        stock: v.stock
      }

      return {
        product: mappedProduct,
        variant: mappedVariant,
        quantity: item.quantity
      }
    })
  }

  // Update cart state directly from raw backend response
  const updateCartItemsRaw = (backendCart: any) => {
    if (backendCart) {
      setCartItemsRaw(backendCart.items || [])
      setCartItems(mapBackendCartToFrontend(backendCart))
    } else {
      setCartItemsRaw([])
      setCartItems([])
    }
  }

  // Fetch cart from backend
  const fetchCart = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/cart')
      if (!res.ok) {
        throw new Error('Failed to load cart')
      }
      const data = await res.json()
      updateCartItemsRaw(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load cart on mount and when authentication status changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchCart()
    } else {
      updateCartItemsRaw(null)
      setActiveCouponState('')
      setCouponDiscount(0)
    }
  }, [isLoggedIn])

  // Add item to cart
  const addToCart = async (product: Product, variant: Variant, quantity: number) => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Please sign in to add items to your cart.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // 1. Resolve real CUIDs from the database by slug matching
      const resDetail = await fetch(`/api/products/${product.slug}`)
      if (!resDetail.ok) {
        throw new Error('Product not found in store database.')
      }
      const { product: realProduct } = await resDetail.json()

      const targetName = variant.name
      const matchedVariant = realProduct.variants.find((v: any) => {
        const vName = v.attributes?.name || v.name || 'Standard'
        return vName.toLowerCase() === targetName.toLowerCase()
      })

      if (!matchedVariant) {
        throw new Error(`Product variant "${targetName}" is not available.`)
      }

      // 2. Call backend Cart item add endpoint using authFetch
      const resAdd = await authFetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: realProduct.id,
          variantId: matchedVariant.id,
          quantity
        })
      })

      if (!resAdd.ok) {
        const err = await resAdd.json()
        throw new Error(err.error || 'Failed to add item to cart')
      }

      const data = await resAdd.json()
      updateCartItemsRaw(data)
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Remove item from cart
  const removeFromCart = async (productId: string, variantName: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Find the cart item record matching this product + variant combination
    const matched = cartItemsRaw.find((item: any) => {
      const p = item.productVariant.product
      const v = item.productVariant
      const vName = v.attributes?.name || v.name || 'Standard'
      return (p.id === productId || p.slug === productId) && vName.toLowerCase() === variantName.toLowerCase()
    })

    if (!matched) return

    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(`/api/cart/items/${matched.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        throw new Error('Failed to remove item from cart')
      }
      const data = await res.json()
      updateCartItemsRaw(data)
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Update quantity of an item in the cart
  const updateQuantity = async (productId: string, variantName: string, quantity: number) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    if (quantity <= 0) {
      await removeFromCart(productId, variantName)
      return
    }

    const matched = cartItemsRaw.find((item: any) => {
      const p = item.productVariant.product
      const v = item.productVariant
      const vName = v.attributes?.name || v.name || 'Standard'
      return (p.id === productId || p.slug === productId) && vName.toLowerCase() === variantName.toLowerCase()
    })

    if (!matched) return

    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(`/api/cart/items/${matched.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update quantity')
      }

      const data = await res.json()
      updateCartItemsRaw(data)
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Clear cart
  const clearCart = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      updateCartItemsRaw(null)
      setActiveCouponState('')
      setCouponDiscount(0)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/cart', {
        method: 'DELETE'
      })
      if (!res.ok) {
        throw new Error('Failed to clear cart')
      }
      const data = await res.json()
      updateCartItemsRaw(data)
      setActiveCouponState('')
      setCouponDiscount(0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Set and validate active coupon code
  const setActiveCoupon = async (code: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    if (!code) {
      setLoading(true)
      try {
        await authFetch('/api/cart/coupon', {
          method: 'DELETE'
        })
        setActiveCouponState('')
        setCouponDiscount(0)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/cart/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Invalid coupon code')
      }

      const data = await res.json()
      setActiveCouponState(data.code)
      setCouponDiscount(data.discountAmount)
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
      setActiveCouponState('')
      setCouponDiscount(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        activeCoupon,
        couponDiscount,
        loading,
        error,
        setActiveCoupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        updateCartItemsRaw
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
