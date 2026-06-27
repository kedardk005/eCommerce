import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import PageContainer from '../components/PageContainer'
import EmptyState from '../components/EmptyState'

export const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, activeCoupon, setActiveCoupon, error: contextError } = useCart()
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

  // Delivery configuration (e.g. ₹50 flat rate, free over ₹500)
  const deliveryFee = useMemo(() => {
    if (subtotal === 0 || subtotal >= 500) return 0
    return 50.0
  }, [subtotal])

  // Custom webpage-level popup alerts state
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')

  useEffect(() => {
    if (contextError) {
      setPopupMessage(contextError)
      setShowPopup(true)
      
      const timer = setTimeout(() => {
        setShowPopup(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [contextError])

  // Net total
  const total = useMemo(() => {
    return subtotal - discount + deliveryFee
  }, [subtotal, discount, deliveryFee])

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = couponCode.trim().toUpperCase()

    if (cleanCode === '') {
      setCouponError('Please enter a coupon code.')
      return
    }

    setCouponError('')
    await setActiveCoupon(cleanCode)
    setCouponCode('')
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
        <h1 className="font-heading font-black text-3xl text-ink tracking-tight mb-1">Shopping Cart</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Review items and apply promo codes before checking out.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Items list */}
        <div className="lg:col-span-2 space-y-5">
          {cartItems.map((item) => (
            <div
              key={`${item.product.id}-${item.variant.name}`}
              className="rounded-2xl border border-border p-4 flex gap-4 items-start bg-surface shadow-sm"
            >
              {/* Product Image */}
              <div className="w-24 h-24 bg-border rounded-xl flex items-center justify-center border border-border flex-shrink-0 shadow-inner overflow-hidden">
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🧸</span>
                )}
              </div>

              {/* Product Info & Controls Wrapper */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 self-stretch">
                {/* Product details */}
                <div className="space-y-1 text-left">
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="font-heading font-bold text-base text-ink hover:text-primary transition line-clamp-2"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-xs font-body text-ink-muted">Variant: {item.variant.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-heading font-black text-xl text-primary">
                      ₹{item.product.discountPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions: Stepper & Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-4 mt-auto sm:mt-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 rounded-pill border-2 border-border w-fit px-2 py-0.5 select-none bg-surface">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.variant.name, item.quantity - 1)}
                      className="text-lg font-black text-ink w-8 h-8 flex items-center justify-center hover:text-primary active:scale-95 transition-transform"
                    >
                      −
                    </button>
                    <span className="font-heading font-black text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.variant.name, item.quantity + 1)}
                      className="text-lg font-black text-ink w-8 h-8 flex items-center justify-center hover:text-primary active:scale-95 transition-transform"
                    >
                      +
                    </button>
                  </div>

                  {/* Item Total Price */}
                  <span className="font-heading font-black text-xl text-ink w-24 text-right hidden sm:inline">
                    ₹{(item.product.discountPrice * item.quantity).toFixed(2)}
                  </span>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id, item.variant.name)}
                    className="text-ink-muted hover:text-primary min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                    title="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary Panel */}
        <div className="rounded-2xl border border-border p-6 space-y-4 bg-surface shadow-sm text-left">
          <h3 className="text-xl font-heading text-ink border-b border-border pb-3 font-bold">
            Order Summary
          </h3>

          {/* Pricing calculations */}
          <div className="space-y-3 font-body text-sm text-ink border-b border-border/60 pb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-heading font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-accent-teal font-semibold">
                <div className="flex items-center space-x-1">
                  <span>Discount ({activeCoupon})</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-primary hover:underline ml-1 font-heading font-bold"
                  >
                    (Remove)
                  </button>
                </div>
                <span className="font-heading font-bold">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Delivery</span>
              <span className="font-heading font-bold">
                {deliveryFee === 0 ? (
                  <span className="text-accent-teal font-black">Free</span>
                ) : (
                  `₹${deliveryFee.toFixed(2)}`
                )}
              </span>
            </div>
            {deliveryFee > 0 && (
              <p className="text-[11px] text-ink-muted leading-tight italic">
                Add <strong>₹{(500 - subtotal).toFixed(2)}</strong> more in products to unlock free delivery!
              </p>
            )}
          </div>

          {/* Coupon Code Input */}
          <div className="space-y-2">
            <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Have a coupon?</span>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WELCOME10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={!!activeCoupon}
                className="flex-1 rounded-pill border-2 border-border focus:border-primary focus:outline-none h-12 px-4 text-base bg-surface disabled:bg-bg disabled:text-ink-muted transition-colors"
              />
              <button
                type="submit"
                disabled={!!activeCoupon}
                className="rounded-pill bg-secondary text-white font-heading font-bold px-5 h-12 hover:bg-primary transition-colors disabled:bg-border disabled:text-ink-muted"
              >
                Apply
              </button>
            </form>
            {(couponError || contextError) && <p className="text-xs text-primary font-body font-semibold">{couponError || contextError}</p>}
            {activeCoupon && (
              <p className="text-xs text-accent-teal font-body font-semibold">
                ✓ Coupon "{activeCoupon}" applied!
              </p>
            )}
          </div>

          {/* Grand total */}
          <div className="flex justify-between items-center pt-2 border-t border-border/40">
            <span className="font-heading text-base text-ink font-bold">Total</span>
            <span className="font-heading font-black text-xl text-primary">
              ₹{total.toFixed(2)}
            </span>
          </div>

          {/* Proceed button */}
          <button
            onClick={() => navigate('/checkout')}
            className="w-full min-h-[56px] text-lg font-heading font-black bg-primary text-white rounded-pill hover:bg-primary-hover transition-colors shadow-sm"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
      {/* Dynamic In-Webpage Popup Notification Modal */}
      {showPopup && (
        <div className="fixed bottom-6 right-6 z-50 animate-pop-in">
          <div className="bg-white border-2 border-primary rounded-2xl shadow-playful p-5 max-w-sm flex items-start gap-3 relative bg-gradient-to-r from-white via-white to-primary/5">
            <span className="text-2xl mt-0.5" role="img" aria-label="warning">⚠️</span>
            <div className="space-y-1 text-left">
              <p className="font-heading font-black text-sm text-primary">Coupon Alert</p>
              <p className="font-body text-xs text-ink-muted leading-relaxed">{popupMessage}</p>
            </div>
            <button 
              onClick={() => setShowPopup(false)} 
              className="text-ink-muted hover:text-ink font-heading font-bold text-sm ml-2 p-1"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default Cart
