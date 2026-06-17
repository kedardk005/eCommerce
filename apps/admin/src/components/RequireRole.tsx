import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import type { AdminRole } from '../context/AdminAuthContext'

interface RequireRoleProps {
  children: React.ReactElement
  allowedRoles?: AdminRole[]
}

export const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRoles }) => {
  const { isLoggedIn, role } = useAdminAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    // Redirect to login page, saving the source location we tried to go to
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If user role is not allowed, redirect to Dashboard with a restricted parameter
    return <Navigate to="/?error=restricted" replace />
  }

  return children
}

export default RequireRole
