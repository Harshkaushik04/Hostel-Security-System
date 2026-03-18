import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminSignIn } from '../api/endpoints'
import collegeLogo from '../assets/IIT ROPAR.png'
import { layout, card, inputStyle, primaryButton, backButton, logoCircle } from '../styles/common'

export default function AdminSignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      <div style={card}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 0.7fr)',
            columnGap: '3rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: form */}
          <div>
            <Link to="/" style={backButton}>← Back</Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Sign In</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              Restricted access. Admins only. No sign up — only super user can add users.
            </p>
            <form onSubmit={handleSubmit}>
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
              <button type="submit" style={primaryButton} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Right: college logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
