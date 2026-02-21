import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { getPastRecording } from '../api/endpoints'
import { layout, card, secondaryButton } from '../styles/common'

export default function PastRecordingPlayer() {
  const { recordingId } = useParams<{ recordingId: string }>()
  const location = useLocation()
  const stateItem = location.state as { id?: string; title?: string } | null
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!recordingId) return
    let cancelled = false
    getPastRecording({ id: recordingId, ...(stateItem as Record<string, string>) })
      .then((res) => {
        const url = (res as { url?: string })?.url ?? null
        if (!cancelled) setVideoUrl(url)
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [recordingId, stateItem])

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/past-recordings" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Past recordings</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
          Past recording — {stateItem?.title ?? recordingId}
        </h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Timeline below; double-click for fullscreen. [express] /get-past-recording
        </p>
        {loading && <p style={{ color: '#9ca3af' }}>Loading…</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        {!loading && !error && (
          <>
            <div
              style={{
                aspectRatio: fullscreen ? undefined : '16/9',
                background: '#000',
                borderRadius: 8,
                overflow: 'hidden',
                ...(fullscreen ? { position: 'fixed' as const, inset: 0, zIndex: 9999 } : {}),
              }}
              onDoubleClick={() => setFullscreen((f) => !f)}
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  No video URL from API
                </div>
              )}
            </div>
            {!fullscreen && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Timeline (scrollable) — placeholder for seekable timeline</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
