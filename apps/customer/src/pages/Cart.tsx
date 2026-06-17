import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'

export const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, activeCoupon, setActiveCoupon } = useCart()
  const navigate = useNavigate()

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.product.discountPrice * item.quantity, 0)
  }, [cartItems])

  // Discount calculation from CartContext API validation
  const { couponDiscount: discount } = useCart()

  // Delivery configuration (e.g. $5 flat rate, free over $50)
  const deliveryFee = useMemo(() => {
    if (subtotal === 0 || subtotal >= 50) return 0
    return 5.0
  }, [subtotal])

  // Net total
  const total = useMemo(() => {
    return subtotal - discount + deliveryFee
  }, [subtotal, discount, deliveryFee])

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = couponCode.trim().toUpperCase()

    if (cleanCode === 'WOOD10') {
      setActiveCoupon(cleanCode)
      setCouponError('')
      setCouponCode('')
    } else if (cleanCode === '') {
      setCouponError('Please enter a coupon code.')
    } else {
      setCouponError('Invalid coupon code. Try "WOOD10" for 10% off.')
      setActiveCoupon('')
    }
  }

  const handleRemoveCoupon = () => {
    setActiveCoupon('')
  }

  if (cartItems.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          title="Your Cart is Empty"
          message="You haven't added any wooden toys to your cart yet. Let's explore our handcrafted collection."
          buttonText="Browse Handcrafted Toys"
          buttonLink="/products"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Selected Items</span>
        <h1 className="text-3xl sm:text-4xl font-heading text-ink tracking-tight mb-1">Shopping Cart</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Review items and apply promo codes before checking out.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Items list */}
        <div className="lg:col-span-2 space-y-5">
          {cartItems.map((item) => (
            <div
              key={`${item.product.id}-${item.variant.name}`}
              className="card-workshop flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-surface border-b-[2.5px] border-border/60 shadow-xs"
            >
              {/* Product Info / Image Box */}
              <div className="flex items-center space-x-4 w-full sm:w-auto text-left select-none">
                <div className="w-16 h-16 bg-border rounded-lg flex items-center justify-center border border-border shrink-0 shadow-inner">
                  <span className="text-3xl">🧸</span>
                </div>
                <div>
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="font-heading text-ink text-base hover:text-accent-blue transition line-clamp-1 font-bold"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-xs font-body text-ink-muted">Variant: {item.variant.name}</p>
                  <p className="text-sm font-heading text-ink font-bold mt-1">
                    ${item.product.discountPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Stepper & Total & Remove actions */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-none pt-3 sm:pt-0">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-border rounded-md bg-bg select-none">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.variant.name, item.quantity - 1)}
                    className="px-3 py-1.5 text-ink hover:bg-bg/20 transition font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="px-3 font-heading text-sm text-ink font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.variant.name, item.quantity + 1)}
                    className="px-3 py-1.5 text-ink hover:bg-bg/20 transition font-bold text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal price for item */}
                <span className="font-heading text-ink text-base font-bold w-20 text-right">
                  ${(item.product.discountPrice * item.quantity).toFixed(2)}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.product.id, item.variant.name)}
                  className="text-primary hover:text-primary/80 text-xs font-heading font-bold uppercase tracking-wider"
                  title="Remove item"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary Panel */}
        <div className="card-workshop bg-surface p-6 text-left space-y-6 border-b-[3px] border-primary shadow-xs">
          <h3 className="text-xl font-heading text-ink border-b border-border pb-3 font-bold">
            Order Summary
          </h3>

          {/* Pricing calculations */}
          <div className="space-y-3 font-body text-sm text-ink border-b border-border/60 pb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-accent-teal font-semibold">
                <div className="flex items-center space-x-1">
                  <span>Discount ({activeCoupon})</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-primary hover:underline ml-1 font-heading"
                  >
                    (Remove)
                  </button>
                </div>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Delivery</span>
              <span className="font-semibold">
                {deliveryFee === 0 ? (
                  <span className="text-accent-teal font-bold">Free</span>
                ) : (
                  `$${deliveryFee.toFixed(2)}`
                )}
              </span>
            </div>
            {deliveryFee > 0 && (
              <p className="text-[11px] text-ink-muted leading-tight italic">
                Add <strong>${(50 - subtotal).toFixed(2)}</strong> more in products to unlock free delivery!
              </p>
            )}
          </div>

          {/* Coupon Code Input */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Have a coupon?</span>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WOOD10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={!!activeCoupon}
                className="input-workshop py-1.5"
              />
              <button
                type="submit"
                disabled={!!activeCoupon}
                className="btn-primary bg-secondary hover:bg-primary-hover/90 disabled:bg-border disabled:text-ink-muted text-white px-4 py-1.5 rounded font-heading text-xs font-bold shadow-xs transition"
              >
                Apply
              </button>
            </form>
            {couponError && <p className="text-xs text-primary font-body font-semibold">{couponError}</p>}
            {activeCoupon && (
              <p className="text-xs text-accent-teal font-body font-semibold">
                ✓ Coupon "{activeCoupon}" applied!
              </p>
            )}
          </div>

          {/* Grand total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-border/40">
            <span className="font-heading text-lg text-ink font-bold">Total</span>
            <span className="font-heading text-2xl text-primary font-bold">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Proceed button */}
          <button
            onClick={() => navigate('/checkout')}
            className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 text-ink font-heading font-bold py-3 px-6 rounded-md shadow-xs"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </PageContainer>
  )
}

export default Cart
