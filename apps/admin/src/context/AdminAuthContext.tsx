import React, { createContext, useContext, useState, useEffect } from 'react'

export type AdminRole = 'super_owner' | 'sub_admin'

export interface AdminUser {
  name: string
  email: string
}

export interface AdminAuthContextType {
  isLoggedIn: boolean
  role: AdminRole | null
  user: AdminUser | null
  login: (role: AdminRole, name: string, email: string) => void
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [role, setRole] = useState<AdminRole | null>(null)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Load from localStorage for ease of developer manual reloads
    const savedLoggedIn = localStorage.getItem('admin_isLoggedIn') === 'true'
    const savedRole = localStorage.getItem('admin_role') as AdminRole | null
    const savedUserJson = localStorage.getItem('admin_user')

    if (savedLoggedIn && savedRole && savedUserJson) {
      try {
        const savedUser = JSON.parse(savedUserJson)
        setIsLoggedIn(true)
        setRole(savedRole)
        setUser(savedUser)
      } catch (e) {
        console.error('Error parsing saved admin user', e)
        localStorage.removeItem('admin_isLoggedIn')
        localStorage.removeItem('admin_role')
        localStorage.removeItem('admin_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (selectedRole: AdminRole, name: string, email: string) => {
    const newUser = { name, email }
    setIsLoggedIn(true)
    setRole(selectedRole)
    setUser(newUser)

    localStorage.setItem('admin_isLoggedIn', 'true')
    localStorage.setItem('admin_role', selectedRole)
    localStorage.setItem('admin_user', JSON.stringify(newUser))
  }

  const logout = () => {
    setIsLoggedIn(false)
    setRole(null)
    setUser(null)

    localStorage.removeItem('admin_isLoggedIn')
    localStorage.removeItem('admin_role')
    localStorage.removeItem('admin_user')
    localStorage.removeItem('admin_accessToken')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-body text-ink-muted">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span>Loading admin panel...</span>
        </div>
      </div>
    )
  }

  return (
    <AdminAuthContext.Provider value={{ isLoggedIn, role, user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
