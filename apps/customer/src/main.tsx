import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const REQUIRED_ENV = ['VITE_API_BASE_URL']
REQUIRED_ENV.forEach(key => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required env variable: ${key}`)
  }
})

// Patch global fetch to automatically prepend VITE_API_BASE_URL to relative /api/ endpoints
const originalFetch = window.fetch
window.fetch = (input, init) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = `${import.meta.env.VITE_API_BASE_URL}${input}`
  }
  return originalFetch(input, init)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
