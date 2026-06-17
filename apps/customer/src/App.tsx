import React from 'react'
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

const NavigationHeader: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth()
  const { cartItems } = useCart()
  const { wishlistItems } = useWishlist()
  const location = useLocation()

  // Dynamic count badges
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const wishlistCount = wishlistItems.length

  return (
    <header className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand logo */}
        <Link to="/" className="flex items-center space-x-2 shrink-0 group">
          <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center border border-border shadow-xs group-hover:scale-105 transition duration-150">
            <span className="text-lg filter drop-shadow">🧸</span>
          </div>
          <span className="font-heading font-bold text-lg sm:text-xl text-ink tracking-wide group-hover:text-ink-muted transition duration-150">
            Toy Cabin
          </span>
        </Link>

        {/* Links & Auth indicator */}
        <nav className="flex items-center space-x-3 sm:space-x-5 overflow-x-auto py-2">
          <Link
            to="/"
            className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 pb-1 border-b-2 ${
              location.pathname === '/'
                ? 'text-ink border-secondary'
                : 'text-ink-muted border-transparent hover:text-ink'
            }`}
          >
            Home
          </Link>
          <Link
            to="/products"
            className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 pb-1 border-b-2 ${
              location.pathname.startsWith('/products')
                ? 'text-ink border-secondary'
                : 'text-ink-muted border-transparent hover:text-ink'
            }`}
          >
            Shop
          </Link>
          <Link
            to="/help"
            className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 pb-1 border-b-2 ${
              location.pathname === '/help'
                ? 'text-ink border-secondary'
                : 'text-ink-muted border-transparent hover:text-ink'
            }`}
          >
            Help ❓
          </Link>

          {isLoggedIn && (
            <>
              <Link
                to="/cart"
                className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 flex items-center pb-1 border-b-2 ${
                  location.pathname === '/cart'
                    ? 'text-ink border-secondary'
                    : 'text-ink-muted border-transparent hover:text-ink'
                }`}
              >
                Cart 🛒
                {cartCount > 0 && (
                  <span className="ml-1 bg-primary text-white text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 flex items-center pb-1 border-b-2 ${
                  location.pathname === '/wishlist'
                    ? 'text-ink border-secondary'
                    : 'text-ink-muted border-transparent hover:text-ink'
                }`}
              >
                Wishlist ❤️
                {wishlistCount > 0 && (
                  <span className="ml-1 bg-accent-blue text-white text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                to="/orders"
                className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 pb-1 border-b-2 ${
                  location.pathname.startsWith('/orders')
                    ? 'text-ink border-secondary'
                    : 'text-ink-muted border-transparent hover:text-ink'
                }`}
              >
                Orders 📦
              </Link>
              <Link
                to="/returns"
                className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 pb-1 border-b-2 ${
                  location.pathname.startsWith('/returns')
                    ? 'text-ink border-secondary'
                    : 'text-ink-muted border-transparent hover:text-ink'
                }`}
              >
                Returns ↩
              </Link>
              <Link
                to="/support/tickets"
                className={`font-heading font-medium text-xs sm:text-sm transition shrink-0 pb-1 border-b-2 ${
                  location.pathname.startsWith('/support/tickets')
                    ? 'text-ink border-secondary'
                    : 'text-ink-muted border-transparent hover:text-ink'
                }`}
              >
                Support 💬
              </Link>
            </>
          )}

          {/* User Auth actions */}
          <div className="flex items-center space-x-2 border-l border-border pl-3 sm:pl-5 shrink-0">
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className={`hidden md:inline font-heading font-semibold text-xs sm:text-sm transition hover:text-accent-blue pb-1 border-b-2 ${
                    location.pathname === '/profile'
                      ? 'text-ink border-secondary'
                      : 'text-ink-muted border-transparent hover:text-ink'
                  }`}
                >
                  Hi, {user?.name.split(' ')[0]}! 👤
                </Link>
                <button
                  onClick={logout}
                  className="bg-primary/10 text-primary hover:bg-primary/20 font-heading font-semibold text-[10px] sm:text-xs py-1.5 px-2.5 rounded-md transition border-b border-primary/35"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-accent-yellow/20 hover:bg-accent-yellow/30 text-ink font-heading font-semibold text-[10px] sm:text-xs py-1.5 px-2.5 rounded-md transition border-b border-accent-yellow/35"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border mt-16 bg-surface/50 py-12 text-center text-ink-muted font-body text-sm">
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        <p className="font-heading text-ink font-bold text-lg">&copy; {new Date().getFullYear()} Toy Cabin. All rights reserved.</p>
        <p>Handcrafted wooden toys made from sustainable, organic materials.</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-ink-muted">
          <Link to="/about" className="hover:text-ink hover:underline">About Us</Link>
          <span className="text-border">|</span>
          <Link to="/contact" className="hover:text-ink hover:underline">Contact Us</Link>
          <span className="text-border">|</span>
          <Link to="/shipping-policy" className="hover:text-ink hover:underline">Shipping Policy</Link>
          <span className="text-border">|</span>
          <Link to="/return-policy" className="hover:text-ink hover:underline">Return Policy</Link>
          <span className="text-border">|</span>
          <Link to="/terms" className="hover:text-ink hover:underline">Terms of Service</Link>
          <span className="text-border">|</span>
          <Link to="/privacy" className="hover:text-ink hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between">
      <div>
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
            <Route path="/about" element={<StaticPage slug="about" />} />
            <Route path="/contact" element={<StaticPage slug="contact" />} />
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
      </div>
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
