import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'

export const Checkout: React.FC = () => {
  const { cartItems, clearCart, activeCoupon } = useCart()
  const { addresses, addAddress } = useAuth()
  const { addOrder } = useOrders()
  const navigate = useNavigate()

  // Selected Address ID state
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ''
  )

  // Sync selectedAddressId when addresses load or change
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || '')
    }
  }, [addresses, selectedAddressId])

  // Address creation form toggle and fields
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [phone, setPhone] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('Online (Razorpay)')

  // Idempotency states
  const [idempotencyKey] = useState(() => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  })
  const [isPlacing, setIsPlacing] = useState(false)

  // Calculate pricing
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.product.discountPrice * item.quantity, 0)
  }, [cartItems])

  // Discount calculation from CartContext API validation
  const { couponDiscount: discount } = useCart()

  // Delivery calculations
  const deliveryFee = useMemo(() => {
    if (subtotal >= 500) return 0
    return 50.0
  }, [subtotal])

  // Order Total
  const total = useMemo(() => {
    return subtotal - discount + deliveryFee
  }, [subtotal, discount, deliveryFee])

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId)
  }, [addresses, selectedAddressId])

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressError(null)

    if (!line1 || !city || !state || !pincode || !phone) {
      setAddressError('Please fill out all address fields.')
      return
    }

    setIsSubmittingAddress(true)
    try {
      await addAddress({
        line1,
        line2,
        city,
        state,
        pincode,
        phone,
        isDefault
      })

      // Reset address form
      setLine1('')
      setLine2('')
      setCity('')
      setState('')
      setPincode('')
      setPhone('')
      setIsDefault(false)
      setShowNewAddressForm(false)
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address to backend.')
    } finally {
      setIsSubmittingAddress(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select or add a delivery address.')
      return
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty.')
      return
    }

    setIsPlacing(true)

    try {
      const orderId = await addOrder({
        addressId: selectedAddress.id,
        paymentMethod: paymentMethod === 'Online (Razorpay)' ? 'online' : 'cod',
        couponCode: activeCoupon || undefined
      }, idempotencyKey)

      if (paymentMethod === 'Online (Razorpay)') {
        alert('Online Payment: Pending payment order created (Razorpay gateway stubbed).')
      } else {
        alert('Order placed successfully via Cash on Delivery!')
      }

      clearCart()
      navigate(`/orders/${orderId}`)
    } catch (err: any) {
      alert(err.message || 'Failed to place order')
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Delivery Details</span>
        <h1 className="text-3xl sm:text-4xl font-heading mb-1 text-ink select-none">Checkout</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Select address, review order details, and place your order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Address and Payment */}
        <div className="lg:col-span-2 space-y-6 text-left">
          {/* Address Book Card Grid */}
          <div className="card-workshop p-6 space-y-5 bg-surface border-b-[3px] border-primary shadow-xs">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <h3 className="text-lg font-heading text-ink font-bold">Select Delivery Address</h3>
              <button
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-xs font-heading font-bold text-accent-blue hover:underline"
              >
                {showNewAddressForm ? 'Cancel' : '+ Add New Address'}
              </button>
            </div>

            {showNewAddressForm ? (
              <form onSubmit={handleAddNewAddress} className="space-y-4 pt-2">
                {addressError && (
                  <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold">
                    ⚠️ {addressError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmittingAddress}
                      placeholder="e.g. 123 Forest Lane"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      disabled={isSubmittingAddress}
                      placeholder="e.g. Near Oak Tree"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmittingAddress}
                      placeholder="Toytown"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmittingAddress}
                      placeholder="Oregon"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmittingAddress}
                      placeholder="97401"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-ink mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={isSubmittingAddress}
                      placeholder="1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-workshop disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="isDefault"
                    disabled={isSubmittingAddress}
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-ink-muted focus:ring-primary disabled:opacity-50"
                  />
                  <label htmlFor="isDefault" className="text-xs font-body text-ink font-semibold cursor-pointer">
                    Set as default shipping address
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAddress}
                  className="btn-primary bg-accent-blue hover:bg-accent-blue/90 disabled:bg-border disabled:text-ink-muted text-white font-heading text-xs px-6 py-2.5 rounded shadow-xs flex items-center justify-center space-x-1.5"
                >
                  {isSubmittingAddress && <span className="animate-spin mr-1">⌛</span>}
                  <span>Save Address</span>
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-lg border cursor-pointer select-none transition ${
                      selectedAddressId === addr.id
                        ? 'border-secondary bg-bg shadow-xs border-b-[3px] border-b-primary'
                        : 'border-border bg-surface/50 hover:bg-surface border-b-[3px] border-b-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-heading font-bold text-sm text-ink flex items-center gap-1">
                        <span>Address</span> 
                        {addr.isDefault && <BadgeTag text="default" variant="green" className="scale-75 origin-left" />}
                      </span>
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="text-ink-muted focus:ring-primary"
                      />
                    </div>
                    <div className="text-xs font-body text-ink mt-3 space-y-1 leading-relaxed">
                      <p>{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p>
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-ink-muted font-bold mt-2 pt-1.5 border-t border-border/20">Phone: {addr.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Radio choices */}
          <div className="card-workshop p-6 space-y-5 bg-surface border-b-[3px] border-primary shadow-xs">
            <h3 className="text-lg font-heading text-ink font-bold border-b border-border/40 pb-3">Select Payment Method</h3>
            <div className="space-y-3.5 font-body text-sm text-ink select-none">
              <label className={`flex items-start space-x-3 p-4 border rounded-xl cursor-pointer transition ${
                paymentMethod === 'Online (Razorpay)' 
                  ? 'border-secondary bg-primary/10 border-b-[3px] border-b-primary' 
                  : 'border-border bg-surface/50 hover:bg-surface'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Online (Razorpay)"
                  checked={paymentMethod === 'Online (Razorpay)'}
                  onChange={() => setPaymentMethod('Online (Razorpay)')}
                  className="text-ink-muted focus:ring-primary mt-1"
                />
                <div>
                  <span className="font-heading font-bold text-ink text-sm sm:text-base block">Online (Razorpay)</span>
                  <span className="text-xs text-ink-muted mt-0.5 block">Pay instantly and securely using card, UPI, netbanking or wallet.</span>
                </div>
              </label>
              <label className={`flex items-start space-x-3 p-4 border rounded-xl cursor-pointer transition ${
                paymentMethod === 'Cash on Delivery' 
                  ? 'border-secondary bg-primary/10 border-b-[3px] border-b-primary' 
                  : 'border-border bg-surface/50 hover:bg-surface'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  className="text-ink-muted focus:ring-primary mt-1"
                />
                <div>
                  <span className="font-heading font-bold text-ink text-sm sm:text-base block">Cash on Delivery</span>
                  <span className="text-xs text-ink-muted mt-0.5 block">Pay with cash at the time of delivery.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary calculations */}
        <div className="card-workshop p-6 bg-surface text-left space-y-6 border-b-[3px] border-primary shadow-xs">
          <h3 className="text-xl font-heading text-ink border-b border-border pb-3 font-bold">
            Review Order
          </h3>

          {/* Items List */}
          <div className="max-h-48 overflow-y-auto space-y-3.5 pr-2 border-b border-border/40 pb-4">
            {cartItems.map((item) => (
              <div key={`${item.product.id}-${item.variant.name}`} className="flex justify-between items-start text-xs font-body">
                <div>
                  <span className="font-heading font-bold text-ink line-clamp-1">
                    {item.product.title}
                  </span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">
                    Variant: {item.variant.name} (x{item.quantity})
                  </span>
                </div>
                <span className="font-heading font-bold text-ink shrink-0">
                  ₹{(item.product.discountPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing calculations */}
          <div className="space-y-3 font-body text-sm text-ink border-b border-border/40 pb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-accent-teal font-semibold">
                <span>Discount ({activeCoupon})</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold">
                {deliveryFee === 0 ? <span className="text-accent-teal font-bold">Free</span> : `₹${deliveryFee.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Grand total */}
          <div className="flex justify-between items-baseline pt-2">
            <span className="font-heading text-lg text-ink font-bold">Total Amount</span>
            <span className="font-heading text-2xl text-primary font-bold">
              ₹{total.toFixed(2)}
            </span>
          </div>

          {/* Place order CTA */}
          <button
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || isPlacing}
            className="w-full btn-primary bg-accent-yellow hover:bg-accent-yellow/95 disabled:bg-border disabled:text-ink-muted text-ink font-heading font-bold py-3.5 px-6 rounded-md shadow-xs"
          >
            {isPlacing ? 'Placing Order...' : `Place Order (₹${total.toFixed(2)})`}
          </button>
        </div>
      </div>
    </PageContainer>
  )
}

export default Checkout
