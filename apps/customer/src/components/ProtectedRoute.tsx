import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location }, replace: true })
    }
  }, [isLoggedIn, navigate, location])

  if (!isLoggedIn) return null
  return <>{children}</>
}

export default ProtectedRoute
