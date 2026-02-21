import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { layout, card, secondaryButton } from '../styles/common'

type ViewFilter = 'all' | 'hostel-a' | 'hostel-b' | 'other'

// Placeholder for WebRTC; replace with actual SFU media server connection
const PLACEHOLDER_STREAMS = ['Camera 1', 'Camera 2', 'Camera 3', 'Camera 4']

export default function LiveFeed() {
  const [view, setView] = useState<ViewFilter>('all')
  const [fullscreenId, setFullscreenId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = (id: string) => {
    setFullscreenId((prev) => (prev === id ? null : id))
  }

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin/live-feed-landing" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Live feed</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          Toggle view: different hostels / all / other. Double-click a video for fullscreen. WebRTC (SFU media server) to be wired here.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {(['all', 'hostel-a', 'hostel-b', 'other'] as ViewFilter[]).map((v) => (
            <button
              key={v}
              type="button"
              style={{ ...secondaryButton, fontWeight: view === v ? 600 : 500 }}
              onClick={() => setView(v)}
            >
              {v === 'all' ? 'All view' : v}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/admin/notifications" style={{ ...secondaryButton, textDecoration: 'none' }}>View notifications</Link>
          <Link to="/admin/activities" style={{ ...secondaryButton, textDecoration: 'none' }}>View activities</Link>
          <Link to="/admin/past-recordings" style={{ ...secondaryButton, textDecoration: 'none' }}>View past recordings</Link>
        </div>
        <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: fullscreenId ? '1fr' : 'repeat(2, 1fr)', gap: '1rem' }}>
          {PLACEHOLDER_STREAMS.map((label, i) => {
            const id = `cam-${i}`
            const isFull = fullscreenId === id
            if (fullscreenId && !isFull) return null
            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                onDoubleClick={() => toggleFullscreen(id)}
                style={{
                  aspectRatio: '16/9',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '1px solid rgba(148,163,184,0.3)',
                }}
              >
                <span style={{ color: '#9ca3af' }}>{label} (double-click fullscreen)</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
