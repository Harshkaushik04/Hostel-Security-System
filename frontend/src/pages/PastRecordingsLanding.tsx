import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { layout, card, inputStyle, primaryButton, secondaryButton } from '../styles/common'

// Placeholder: backend would return list of recordings for time range / last 24h
type RecordingItem = { id: string; title: string; start?: string; end?: string }

export default function PastRecordingsLanding() {
  const navigate = useNavigate()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [recordings, setRecordings] = useState<RecordingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRange = () => {
    setError('')
    setLoading(true)
    // Placeholder: replace with actual API when backend provides /fetch-past-recordings or similar
    setTimeout(() => {
      setRecordings([{ id: '1', title: 'Recording 1', start: start || undefined, end: end || undefined }])
      setLoading(false)
    }, 500)
  }

  const fetchLast24 = () => {
    setError('')
    setLoading(true)
    setTimeout(() => {
      setRecordings([{ id: '24h-1', title: 'Last 24h recording' }])
      setLoading(false)
    }, 500)
  }

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/live-feed-landing" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Past recordings</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Date filter + option to watch last 24h. Navigate to past recordings video player.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Start</label>
            <input type="datetime-local" style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>End</label>
            <input type="datetime-local" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button type="button" style={primaryButton} onClick={fetchRange} disabled={loading}>Fetch time range</button>
          <button type="button" style={secondaryButton} onClick={fetchLast24} disabled={loading}>Last 24h</button>
        </div>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {recordings.map((r) => (
            <button
              key={r.id}
              type="button"
              style={{ ...secondaryButton, textAlign: 'left' }}
              onClick={() => navigate(`/admin/past-recordings/${r.id}`, { state: r })}
            >
              {r.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
