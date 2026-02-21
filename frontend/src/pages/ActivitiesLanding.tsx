import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchRecentActivities, fetchTimerangeActivities } from '../api/endpoints'
import { layout, card, inputStyle, primaryButton, secondaryButton } from '../styles/common'

type ActivityItem = { id?: string; title?: string; thumbnail?: string; [k: string]: unknown }

export default function ActivitiesLanding() {
  const navigate = useNavigate()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [recent, setRecent] = useState<ActivityItem[]>([])
  const [rangeResult, setRangeResult] = useState<ActivityItem[] | null>(null)
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [loadingRange, setLoadingRange] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchRecentActivities({})
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { activities?: ActivityItem[] })?.activities ?? []
        if (!cancelled) setRecent(list)
      })
      .catch(() => { if (!cancelled) setError('Failed to load recent'); setRecent([]) })
      .finally(() => { if (!cancelled) setLoadingRecent(false) })
    return () => { cancelled = true }
  }, [])

  const fetchRange = async () => {
    setError('')
    setLoadingRange(true)
    try {
      const res = await fetchTimerangeActivities({ start, end })
      const list = Array.isArray(res) ? res : (res as { activities?: ActivityItem[] })?.activities ?? []
      setRangeResult(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
      setRangeResult([])
    } finally {
      setLoadingRange(false)
    }
  }

  const list = rangeResult !== null ? rangeResult : recent

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/live-feed-landing" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Activities</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Date filter + recent top k. [express] /fetch-recent-activities, /fetch-timerange-activities
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>Start (date/time)</label>
            <input type="datetime-local" style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#e5e7eb' }}>End (date/time)</label>
            <input type="datetime-local" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button type="button" style={primaryButton} onClick={fetchRange} disabled={loadingRange}>
            {loadingRange ? 'Fetching…' : 'Fetch time range'}
          </button>
          <button type="button" style={secondaryButton} onClick={() => { setRangeResult(null); setError(''); }}>
            Show recent only
          </button>
        </div>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}
        {loadingRecent && rangeResult === null && <p style={{ color: '#9ca3af' }}>Loading recent activities…</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {list.map((item, i) => (
            <button
              key={item.id ?? i}
              type="button"
              style={{ textAlign: 'left', padding: 0, border: '1px solid rgba(148,163,184,0.3)', borderRadius: 8, overflow: 'hidden', background: 'rgba(15,23,42,0.9)', cursor: 'pointer', color: '#e5e7eb' }}
              onClick={() => navigate(`/admin/activities/${encodeURIComponent((item.id ?? String(i)) as string)}`, { state: item })}
            >
              <div style={{ aspectRatio: '16/9', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.thumbnail ? <img src={String(item.thumbnail)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#9ca3af' }}>Thumbnail</span>}
              </div>
              <div style={{ padding: '0.5rem' }}>{String(item.title ?? `Activity ${i + 1}`)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
