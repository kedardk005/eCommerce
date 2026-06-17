import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AdminDataProvider } from './context/AdminDataContext'
import { RequireRole } from './components/RequireRole'
import { AppShell } from './components/AppShell'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { ActivityLog } from './pages/ActivityLog'
import { Placeholder } from './pages/Placeholder'
import { Products } from './pages/Products'
import { Inventory } from './pages/Inventory'
import { Orders } from './pages/Orders'
import { OrderDetail } from './pages/OrderDetail'
import { Returns } from './pages/Returns'
import { Marketing } from './pages/Marketing'
import { Tickets } from './pages/Tickets'
import { CMS } from './pages/CMS'
import { Finance } from './pages/Finance'
import { Accounts } from './pages/Accounts'
import { Settings } from './pages/Settings'
import { SetPassword } from './pages/SetPassword'

export const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <AdminDataProvider>
        <Router>
          <Routes>
            {/* Public Authentication Gate */}
            <Route path="/login" element={<Login />} />

            {/* Protected Operational Views */}
            <Route
              path="/"
              element={
                <RequireRole>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/activity"
              element={
                <RequireRole>
                  <AppShell>
                    <ActivityLog />
                  </AppShell>
                </RequireRole>
              }
            />

            <Route
              path="/products"
              element={
                <RequireRole>
                  <AppShell>
                    <Products />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/inventory"
              element={
                <RequireRole>
                  <AppShell>
                    <Inventory />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireRole>
                  <AppShell>
                    <Orders />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <RequireRole>
                  <AppShell>
                    <OrderDetail />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/returns"
              element={
                <RequireRole>
                  <AppShell>
                    <Returns />
                  </AppShell>
                </RequireRole>
              }
            />

            {/* Owner-Only Restrictive Guard */}
            <Route
              path="/accounts"
              element={
                <RequireRole allowedRoles={['super_owner']}>
                  <AppShell>
                    <Accounts />
                  </AppShell>
                </RequireRole>
              }
            />

            {/* Standard Protected Side-nav Placeholders */}
            <Route
              path="/customers"
              element={
                <RequireRole>
                  <AppShell>
                    <Placeholder />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/support"
              element={
                <RequireRole>
                  <AppShell>
                    <Tickets />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/marketing"
              element={
                <RequireRole>
                  <AppShell>
                    <Marketing />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/finance"
              element={
                <RequireRole allowedRoles={['super_owner']}>
                  <AppShell>
                    <Finance />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/cms"
              element={
                <RequireRole>
                  <AppShell>
                    <CMS />
                  </AppShell>
                </RequireRole>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireRole allowedRoles={['super_owner']}>
                  <AppShell>
                    <Settings />
                  </AppShell>
                </RequireRole>
              }
            />

            {/* Public Password Setup Route */}
            <Route
              path="/admin/set-password"
              element={<SetPassword />}
            />

            {/* Catch-all Redirect/Fallback */}
            <Route
              path="*"
              element={
                <RequireRole>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </RequireRole>
              }
            />
          </Routes>
        </Router>
      </AdminDataProvider>
    </AdminAuthProvider>
  )
}

export default App
