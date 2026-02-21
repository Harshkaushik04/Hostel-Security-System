import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentSignIn } from '../api/endpoints'
import { layout, card, inputStyle, primaryButton, backButton } from '../styles/common'

export default function StudentSignIn() {
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
      const data = await studentSignIn({ email, password }) as { valid?: boolean; error?: string }
      if (data?.valid) {
        navigate('/invite', { replace: true })
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
        <Link to="/" style={backButton}>← Back</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Student Sign In</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Use your registered student credentials.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '0.9rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Email</label>
              <input
                type="email"
                required
                placeholder="Enter your email"
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Password</label>
              <input
                type="password"
                required
                placeholder="Enter your password"
                style={inputStyle}
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
    </div>
  )
}
