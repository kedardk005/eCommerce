import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider, useCart } from './context/CartContext'
import { WishlistProvider, useWishlist } from './context/WishlistContext'
import { OrdersProvider } from './context/OrdersContext'
import { TicketsProvider } from './context/TicketsContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Profile from './pages/Profile'
import Help from './pages/Help'
import Tickets from './pages/Tickets'
import ReturnsList from './pages/ReturnsList'
import ReturnDetail from './pages/ReturnDetail'
import StaticPage from './pages/StaticPage'
import About from './pages/About'
import Contact from './pages/Contact'

// ─────────────────────────────────────────────
// NAVIGATION HEADER — editorial white bar
// ─────────────────────────────────────────────
const NavigationHeader: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const wishlistCount = wishlistItems.length

  const navLinkClass = (active: boolean) =>
    `font-heading font-medium text-sm tracking-widest uppercase transition-colors duration-150 pb-0.5 border-b-2 ${
      active
        ? 'text-ink border-ink'
        : 'text-ink-muted border-transparent hover:text-ink hover:border-ink/30'
    }`

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-border/50' : 'bg-white border-b border-border'}`}>
      <div className="section-inner h-16 flex items-center justify-between gap-6">
        {/* Brand wordmark */}
        <Link
          to="/"
          className="font-heading font-semibold text-xl text-ink tracking-tight shrink-0 hover:text-ink-muted transition-colors"
        >
          Toy Cabin
        </Link>

        {/* Center nav links — desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/products"
            className={navLinkClass(location.pathname.startsWith('/products'))}
          >
            Shop
          </Link>
          <Link
            to="/about"
            className={navLinkClass(location.pathname === '/about')}
          >
            About
          </Link>
          <Link
            to="/contact"
            className={navLinkClass(location.pathname === '/contact')}
          >
            Contact
          </Link>
          {isLoggedIn && (
            <>
              <Link
                to="/orders"
                className={navLinkClass(location.pathname.startsWith('/orders'))}
              >
                Orders
              </Link>
            </>
          )}
        </nav>

        {/* Right: icon cluster */}
        <div className="flex items-center gap-5 shrink-0">
          {/* Search — links to catalog with focus */}
          <Link
            to="/products"
            aria-label="Search products"
            className="text-ink-muted hover:text-ink transition-colors duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>

          {/* Wishlist icon */}
          {isLoggedIn ? (
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative text-ink-muted hover:text-ink transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-heading font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              aria-label="Wishlist – sign in required"
              className="text-ink-muted hover:text-ink transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>
          )}

          {/* Cart icon */}
          {isLoggedIn ? (
            <Link
              to="/cart"
              aria-label="Shopping cart"
              className="relative text-ink-muted hover:text-ink transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[9px] font-heading font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              aria-label="Cart – sign in required"
              className="text-ink-muted hover:text-ink transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </Link>
          )}

          {/* Auth action */}
          <div className="hidden md:flex items-center">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="text-sm font-heading font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  {user?.name.split(' ')[0]}
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-heading font-semibold text-ink-muted hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-heading font-semibold text-ink border border-ink/20 px-4 py-1.5 rounded-full hover:bg-ink hover:text-white transition-all duration-150"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            id="nav-hamburger-btn"
            className="md:hidden text-ink-muted hover:text-ink transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border px-6 py-5 space-y-4 animate-fade-in">
          <Link to="/products" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">Shop</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">About</Link>
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">Contact</Link>
          <Link to="/help" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">Help</Link>
          {isLoggedIn ? (
            <>
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">Orders</Link>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</Link>
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">Cart {cartCount > 0 && `(${cartCount})`}</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block font-heading font-medium text-sm uppercase tracking-widest text-ink-muted hover:text-ink transition-colors py-1.5">Profile</Link>
              <button onClick={() => { logout(); setMobileOpen(false) }} className="block font-heading font-medium text-sm uppercase tracking-widest text-primary hover:text-primary/80 transition-colors py-1.5">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block font-heading font-semibold text-sm uppercase tracking-widest text-ink hover:text-ink-muted transition-colors py-1.5">Sign In</Link>
          )}
        </div>
      )}
    </header>
  )
}

// ─────────────────────────────────────────────
// FOOTER — 4-column editorial layout
// ─────────────────────────────────────────────
const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-bg border-t border-border mt-0">
      <div className="section-inner py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Column 1 — Brand */}
          <div className="space-y-4">
            <p className="font-heading font-semibold text-xl text-ink tracking-tight">Toy Cabin</p>
            <p className="font-body text-sm text-ink-muted leading-relaxed">
              Handcrafted wooden toys made from sustainable, organic materials — built to spark imagination and last a lifetime.
            </p>
          </div>

          {/* Column 2 — Shop */}
          <div className="space-y-4">
            <p className="font-heading font-bold text-xs uppercase tracking-widest text-ink-muted">Shop</p>
            <ul className="space-y-3">
              <li><Link to="/products" className="font-body text-sm text-ink hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/products?sort=newest" className="font-body text-sm text-ink hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/products?sort=rating" className="font-body text-sm text-ink hover:text-primary transition-colors">Best Sellers</Link></li>
              {/* Categories link — navigates to filtered catalog */}
              <li><Link to="/products" className="font-body text-sm text-ink hover:text-primary transition-colors">Categories</Link></li>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div className="space-y-4">
            <p className="font-heading font-bold text-xs uppercase tracking-widest text-ink-muted">Company</p>
            <ul className="space-y-3">
              <li><Link to="/about" className="font-body text-sm text-ink hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="font-body text-sm text-ink hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/shipping-policy" className="font-body text-sm text-ink hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link to="/return-policy" className="font-body text-sm text-ink hover:text-primary transition-colors">Returns Policy</Link></li>
              <li><Link to="/terms" className="font-body text-sm text-ink hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="font-body text-sm text-ink hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 4 — Connect */}
          <div className="space-y-4">
            <p className="font-heading font-bold text-xs uppercase tracking-widest text-ink-muted">Connect</p>
            <div className="flex items-center gap-4">
              {/* Instagram placeholder */}
              <a href="#" aria-label="Instagram" className="text-ink-muted hover:text-ink transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              {/* Facebook placeholder */}
              <a href="#" aria-label="Facebook" className="text-ink-muted hover:text-ink transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              {/* Pinterest placeholder */}
              <a href="#" aria-label="Pinterest" className="text-ink-muted hover:text-ink transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.74 1.2-5.09 1.2-5.09s-.31-.61-.31-1.51c0-1.42.82-2.48 1.84-2.48.87 0 1.29.65 1.29 1.43 0 .87-.56 2.18-.84 3.39-.24 1.01.5 1.83 1.49 1.83 1.79 0 3.16-1.88 3.16-4.6 0-2.4-1.73-4.08-4.2-4.08-2.86 0-4.54 2.15-4.54 4.37 0 .87.33 1.79.75 2.3a.3.3 0 0 1 .07.29c-.08.31-.25.99-.28 1.13-.04.18-.14.22-.32.13-1.2-.56-1.95-2.32-1.95-3.73 0-3.03 2.2-5.81 6.34-5.81 3.33 0 5.92 2.37 5.92 5.54 0 3.3-2.08 5.96-4.97 5.96-.97 0-1.88-.5-2.19-1.1l-.6 2.22c-.22.84-.8 1.89-1.19 2.53.9.28 1.85.43 2.83.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                </svg>
              </a>
            </div>
            <div className="pt-2">
              <Link
                to="/help"
                className="font-body text-sm text-ink hover:text-primary transition-colors"
              >
                Help & Support
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-body text-ink-muted">
          <p>&copy; {new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
          <p>Handcrafted with ♥ for little imaginations.</p>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────
// MAIN LAYOUT — full-bleed, no outer max-width
// ─────────────────────────────────────────────
const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavigationHeader />
      <main className="w-full flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Catalog />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/help" element={<Help />} />
          
          {/* Static pages routes */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping-policy" element={<StaticPage slug="shipping-policy" />} />
          <Route path="/return-policy" element={<StaticPage slug="return-policy" />} />
          <Route path="/terms" element={<StaticPage slug="terms-of-service" />} />
          <Route path="/privacy" element={<StaticPage slug="privacy-policy" />} />
          
          {/* Gated Routes */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returns"
            element={
              <ProtectedRoute>
                <ReturnsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returns/:id"
            element={
              <ProtectedRoute>
                <ReturnDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/tickets"
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <OrdersProvider>
            <TicketsProvider>
              <Router>
                <MainLayout />
              </Router>
            </TicketsProvider>
          </OrdersProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
