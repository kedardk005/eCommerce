import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function useRequireAuth() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const checkAuth = (action: () => void) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location } })
    } else {
      action()
    }
  }

  return checkAuth
}
export default useRequireAuth
