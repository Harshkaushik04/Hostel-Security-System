import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { getActivity } from '../api/endpoints'
import { layout, card, secondaryButton } from '../styles/common'

export default function ActivityPlayer() {
  const { activityId } = useParams<{ activityId: string }>()
  const location = useLocation()
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const stateItem = location.state as Record<string, unknown> | null

  useEffect(() => {
    if (!activityId) return
    let cancelled = false
    getActivity({ id: activityId, ...(stateItem as Record<string, string>) })
      .then((res) => {
        const url = (res as { url?: string })?.url ?? null
        if (!cancelled) setVideoUrl(url)
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activityId, stateItem])

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/activities" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Activities</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Activity video</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>[express] /get-activity</p>
        {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        {!loading && !error && (
          <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
            {videoUrl ? (
              <video src={videoUrl} controls style={{ width: '100%', height: '100%' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                No video URL returned from API
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
