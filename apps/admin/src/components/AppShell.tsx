import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import {
  DashboardIcon,
  OrdersIcon,
  ProductsIcon,
  InventoryIcon,
  ReturnsIcon,
  CustomersIcon,
  SupportIcon,
  MarketingIcon,
  FinanceIcon,
  CMSIcon,
  RolesIcon,
  SettingsIcon,
  SearchIcon,
  BellIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon
} from './Icons'

interface AppShellProps {
  children: React.ReactNode
}

interface MenuItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  ownerOnly?: boolean
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { role, user, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)

  // Listen to the URL search parameter for role restriction errors
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('error') === 'restricted') {
      setToastMessage('Access restricted: Super Owner privileges required.')
      
      // Clean up the URL query parameter
      const newSearch = new URLSearchParams(location.search)
      newSearch.delete('error')
      const cleanUrl = location.pathname + (newSearch.toString() ? `?${newSearch.toString()}` : '')
      navigate(cleanUrl, { replace: true })
    }
  }, [location, navigate])

  // Automatically hide toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Automatically collapse sidebar on mobile screen widths
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    
    // Initial check
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: DashboardIcon },
    { name: 'Orders', path: '/orders', icon: OrdersIcon },
    { name: 'Products', path: '/products', icon: ProductsIcon },
    { name: 'Inventory', path: '/inventory', icon: InventoryIcon },
    { name: 'Returns/Refunds', path: '/returns', icon: ReturnsIcon },
    { name: 'Customers', path: '/customers', icon: CustomersIcon },
    { name: 'Support Tickets', path: '/support', icon: SupportIcon },
    { name: 'Marketing', path: '/marketing', icon: MarketingIcon },
    { name: 'Accounts/Finance', path: '/finance', icon: FinanceIcon },
    { name: 'CMS', path: '/cms', icon: CMSIcon },
    { name: 'Roles & Accounts', path: '/accounts', icon: RolesIcon, ownerOnly: true },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ]

  const filteredMenuItems = menuItems.filter(item => {
    if (item.ownerOnly && role !== 'super_owner') {
      return false
    }
    return true
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-bg flex font-body text-ink">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center bg-primary text-white text-xs font-semibold px-4 py-3 rounded shadow-lg animate-fade-in-down">
          <span className="mr-2">⚠️</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-4 hover:opacity-80 focus:outline-none">
            &times;
          </button>
        </div>
      )}

      {/* Sidebar - Desktop and mobile sliding panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-4">
            <Link to="/" className="flex items-center space-x-2.5">
              {/* Stacked blocks logo */}
              <svg className="h-7 w-7" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="14" width="11" height="11" rx="2.5" fill="var(--color-primary)" />
                <rect x="15" y="14" width="11" height="11" rx="2.5" fill="var(--color-accent-yellow)" />
                <rect x="8.5" y="3" width="11" height="11" rx="2.5" fill="var(--color-accent-teal)" />
              </svg>
              <span className="font-heading font-extrabold text-lg text-ink tracking-wide">
                ToyStore
              </span>
            </Link>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-ink-muted hover:text-ink p-1"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {filteredMenuItems.map(item => {
              const isActive = location.pathname === item.path
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-ink font-semibold'
                      : 'text-ink-muted hover:bg-bg hover:text-ink'
                  }`}
                  onClick={() => {
                    // Close sidebar on mobile after clicking
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false)
                    }
                  }}
                >
                  <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-ink-muted'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Audit Logs Redirect & Version */}
        <div className="p-4 border-t border-border bg-surface/50 text-[10px] space-y-2">
          <Link
            to="/activity"
            className="flex items-center justify-center space-x-1.5 w-full py-1.5 px-3 border border-border bg-bg hover:bg-bg/10 text-ink rounded font-medium transition-colors"
          >
            <span>📜</span>
            <span>View Activity Logs</span>
          </Link>
          <div className="flex justify-between items-center text-ink-muted">
            <span>Version 1.0.0</span>
            <span>v1.0 (Phase 2)</span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-ink-muted hover:text-ink focus:outline-none p-1.5 rounded hover:bg-bg"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            {/* Non-functional Search Bar */}
            <div className="hidden sm:flex items-center space-x-2 relative w-60 md:w-80">
              <span className="absolute left-2.5 text-ink-muted">
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search orders, products, audits..."
                className="w-full pl-9 pr-3 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary placeholder-ink-muted/60 transition-colors"
                disabled
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-full hover:bg-bg relative"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1.5 bg-accent-yellow text-ink font-heading font-extrabold text-[9px] h-4 w-4 rounded-full flex items-center justify-center border border-surface">
                  3
                </span>
              </button>

              {/* Mock Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded shadow-lg py-2 z-50 text-xs animate-fade-in-up">
                    <div className="px-3 py-1.5 border-b border-border font-heading font-bold text-ink flex justify-between items-center">
                      <span>Notifications</span>
                      <span className="text-[10px] text-accent-yellow bg-secondary px-1.5 py-0.5 rounded font-normal">3 New</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="px-3 py-2 border-b border-border hover:bg-bg transition-colors cursor-pointer">
                        <p className="font-semibold text-ink">⚠️ Low Stock Alert</p>
                        <p className="text-[10px] text-ink-muted">Safari Animals Puzzle is out of stock.</p>
                        <span className="text-[9px] text-ink-muted">5 mins ago</span>
                      </div>
                      <div className="px-3 py-2 border-b border-border hover:bg-bg transition-colors cursor-pointer">
                        <p className="font-semibold text-ink">📦 New Order #ORD-9025</p>
                        <p className="text-[10px] text-ink-muted">Emily Stone placed an order ($104.97)</p>
                        <span className="text-[9px] text-ink-muted">15 mins ago</span>
                      </div>
                      <div className="px-3 py-2 hover:bg-bg transition-colors cursor-pointer">
                        <p className="font-semibold text-ink">💬 Support Ticket #TCK-408</p>
                        <p className="text-[10px] text-ink-muted">New reply message from customer.</p>
                        <span className="text-[9px] text-ink-muted">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar / Label */}
            <div className="flex items-center space-x-2 border-l border-border pl-4">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-ink font-heading font-bold text-sm select-none">
                {user?.name.charAt(0) || 'A'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-ink leading-tight">{user?.name || 'Administrator'}</span>
                <span className="text-[10px] text-ink-muted capitalize">
                  {role === 'super_owner' ? 'Super Owner' : 'Sub Admin'}
                </span>
              </div>
              <span className={`text-[9px] font-heading font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                role === 'super_owner'
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
              }`}>
                {role === 'super_owner' ? 'Owner' : 'Staff'}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="text-ink-muted hover:text-primary p-1.5 rounded hover:bg-bg transition-colors"
              title="Logout session"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Inner Page Router Container */}
        <main className="p-4 sm:p-6 flex-1 min-w-0 max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
