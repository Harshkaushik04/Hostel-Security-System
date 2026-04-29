import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminSignIn } from '../api/endpoints'
import collegeLogo from '../assets/IIT Ropar.png'
import {
  layout,
  card,
  inputStyle,
  backButton,
  logoCircle,
  brandMark,
  topNavBar,
  topNavLinksRow,
  topNavLink,
  hamburgerButton,
  hamburgerBars,
  hamburgerBar,
  topNavDropdown,
  buttonBase,
} from '../styles/common'

export default function AdminSignIn() {
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return document.documentElement.classList.contains('theme-dark')
    } catch {
      return false
    }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const isDark = document.documentElement.classList.contains('theme-dark')
      setDarkMode(isDark)
    } catch {
      // ignore
    }
  }, [])

  const toggleDarkMode = () => {
    try {
      const root = document.documentElement
      const next = !root.classList.contains('theme-dark')
      root.classList.toggle('theme-dark', next)
      window.localStorage.setItem('theme', next ? 'dark' : 'light')
      setDarkMode(next)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await adminSignIn({ email, password }) as {
        valid?: boolean
        error?: string
        token?: string
      }
      if (data?.valid) {
        if (typeof window !== 'undefined' && data.token) {
          window.localStorage.setItem('token', data.token)
        }
        navigate('/admin', { replace: true })
      } else {
        setError(data?.error ?? 'Login failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={layout}>
      <div
        style={{
          ...card,
          minHeight: '90vh',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
            }}
          >
            <div style={topNavBar}>
              {!navOpen && (
                <div style={topNavLinksRow}>
                  <Link to="/" style={topNavLink}>
                    Home
                  </Link>
                  <Link to="/emergencies" style={topNavLink}>
                    Emergencies
                  </Link>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    style={{ ...topNavLink, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    {darkMode ? 'Lightmode' : 'Darkmode'}
                  </button>
                </div>
              )}
              <button
                type="button"
                aria-label="Menu"
                style={hamburgerButton}
                onClick={() => setNavOpen((v) => !v)}
              >
                <span style={hamburgerBars}>
                  <span style={hamburgerBar} />
                  <span style={hamburgerBar} />
                  <span style={hamburgerBar} />
                </span>
              </button>
            </div>

            {navOpen && (
              <div style={topNavDropdown}>
                <Link to="/" style={topNavLink} onClick={() => setNavOpen(false)}>
                  Home
                </Link>
                <Link to="/emergencies" style={topNavLink} onClick={() => setNavOpen(false)}>
                  Emergencies
                </Link>
                <button
                  type="button"
                  onClick={() => { toggleDarkMode(); setNavOpen(false) }}
                  style={{ ...topNavLink, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  {darkMode ? 'Lightmode' : 'Darkmode'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            columnGap: '3rem',
            alignItems: 'center',
            width: '100%',
            minHeight: '74vh',
          }}
        >
          {/* Left: form */}
          <div style={{ paddingTop: '0rem' }}>
            <div style={{ ...brandMark, marginBottom: '7rem' }}>HOSTEL SECURITY</div>
            <Link to="/" style={backButton}>← Back</Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Sign In</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '2.25rem' }}>
              Restricted access. Admins only.
            </p>
            <form onSubmit={handleSubmit} style={{ marginTop: '2.25rem' }}>
              <div style={{ display: 'grid', gap: '0.9rem', marginBottom: '1.5rem', maxWidth: '480px' }}>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#6b7280' }}>Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    style={{ ...inputStyle, width: '100%' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#6b7280' }}>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    style={{ ...inputStyle, width: '100%' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
              <button
                type="submit"
                className="landing-login-btn"
                style={buttonBase}
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Right: college logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
