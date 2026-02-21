import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEmergencies } from '../api/endpoints'
import { layout, card, primaryButton, secondaryButton } from '../styles/common'

export default function Emergencies() {
  const navigate = useNavigate()
  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchEmergencies()
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div style={layout}>
      <div style={card}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Emergencies</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Emergency contacts and information. [express] /emergencies — no inputs.
        </p>
        {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        {!loading && !error && data !== null && (
          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" style={secondaryButton} onClick={() => navigate('/invite')}>
            Back to Visitor Entry
          </button>
        </div>
      </div>
    </div>
  )
}
