import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchEmergencies } from '../api/endpoints'
import { EmergencyInfoDisplay } from '../components/EmergencyInfoDisplay'
import { layout, card, secondaryButton, logoCircle, brandMark } from '../styles/common'
import collegeLogo from '../assets/IIT Ropar.png'

export default function AdminEmergencies() {
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
      <div
        style={{
          ...card,
          minHeight: '90vh',
          position: 'relative',
        }}
      >
        <Link 
          to="/admin" 
          style={{ 
            ...secondaryButton, 
            textDecoration: 'none',
            position: 'absolute',
            top: '1.5rem',
            right: '2rem',
          }}
        >
          ← Back
        </Link>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            columnGap: '3rem',
            alignItems: 'flex-start',
            width: '100%',
            minHeight: '74vh',
            paddingTop: '2rem',
          }}
        >
          <div>
            <div style={{ ...brandMark, marginBottom: '3rem' }}>HOSTEL SECURITY</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Emergencies</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>Admin view. [express] /emergencies</p>
            {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}
            {error && <p style={{ color: '#f87171' }}>{error}</p>}
            {!loading && !error && data !== null && <EmergencyInfoDisplay data={data} />}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
