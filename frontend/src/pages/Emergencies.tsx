import { useEffect, useState } from 'react'
import { fetchEmergencies } from '../api/endpoints'
import { EmergencyInfoDisplay } from '../components/EmergencyInfoDisplay'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, logoCircle } from '../styles/common'

export default function Emergencies() {
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 0.7fr)',
            columnGap: '3rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: text + buttons */}
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Emergencies</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              Emergency contacts and information. [express] /emergencies — no inputs.
            </p>
            {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}
            {error && <p style={{ color: '#f87171' }}>{error}</p>}
            {!loading && !error && data !== null && <EmergencyInfoDisplay data={data} />}
          </div>

          {/* Right: logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
