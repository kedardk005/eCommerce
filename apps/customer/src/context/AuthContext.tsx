import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
  name: string
  email: string
}

export interface Address {
  id: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  phone: string
  isDefault: boolean
}

interface AuthContextType {
  isLoggedIn: boolean
  user: User | null
  addresses: Address[]
  login: (user: User, token?: string) => void
  logout: () => void
  addAddress: (address: Omit<Address, 'id'>) => void
  removeAddress: (id: string) => void
  updateAddress: (id: string, updated: Partial<Address>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)



export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('accessToken'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [addresses, setAddresses] = useState<Address[]>([])

  const fetchAddresses = async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch('/api/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchAddresses()
    } else {
      setAddresses([])
    }
  }, [isLoggedIn])

  const login = (userData: User, token?: string) => {
    setIsLoggedIn(true)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    if (token) {
      localStorage.setItem('accessToken', token)
    }
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    fetch('/api/auth/logout', { method: 'POST' }).catch((err) => {
      console.error('Logout API call failed:', err)
    })
  }

  const addAddress = async (newAddr: Omit<Address, 'id'>) => {
    const token = localStorage.getItem('accessToken')
    if (!token) throw new Error('Not logged in')
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddr)
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to save address to backend.')
      }
      await fetchAddresses()
    } catch (err: any) {
      console.error(err)
      throw err
    }
  }

  const removeAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  const updateAddress = (id: string, updatedFields: Partial<Address>) => {
    setAddresses((prev) => {
      let next = prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a))
      if (updatedFields.isDefault) {
        next = next.map((a) => (a.id === id ? a : { ...a, isDefault: false }))
      }
      return next
    })
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        addresses,
        login,
        logout,
        addAddress,
        removeAddress,
        updateAddress
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
