import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme before first paint.
try {
  const saved = window.localStorage.getItem('theme')
  if (saved === 'dark') document.documentElement.classList.add('theme-dark')
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
