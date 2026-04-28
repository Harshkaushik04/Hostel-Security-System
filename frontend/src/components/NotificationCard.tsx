import type { CSSProperties } from 'react'

const card: CSSProperties = {
  background: 'rgba(0,0,0,0.28)',
  borderRadius: 10,
  padding: '0.85rem 1rem',
  marginBottom: '0.65rem',
  borderLeft: '4px solid #64748b',
}

const badge = (color: string): CSSProperties => ({
  display: 'inline-block',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  padding: '0.2rem 0.45rem',
  borderRadius: 4,
  background: color,
  color: '#0f172a',
  marginRight: '0.5rem',
})

function formatTime(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null
  try {
    const d = new Date(String(raw))
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return null
  }
}

export function NotificationCard({ item }: { item: unknown }) {
  if (item === null || item === undefined) return null

  if (typeof item === 'string') {
    return (
      <div style={{ ...card, borderLeftColor: '#94a3b8' }}>
        <p style={{ margin: 0, color: '#e5e7eb' }}>{item}</p>
      </div>
    )
  }

  const o = item as Record<string, unknown>
  const message = typeof o.message === 'string' ? o.message : null
  const kind = o.kind === 'face_entry' || o.kind === 'visitor_qr' ? o.kind : null
  const hostelName = typeof o.hostelName === 'string' ? o.hostelName : null
  const cameraName = typeof o.cameraName === 'string' ? o.cameraName : null
  const when = formatTime(o.createdAt) ?? formatTime(o.updatedAt)

  const title =
    kind === 'face_entry'
      ? 'Hostel entry (face)'
      : kind === 'visitor_qr'
        ? 'Visitor entry (QR)'
        : 'Notification'

  const accent =
    kind === 'face_entry' ? '#38bdf8' : kind === 'visitor_qr' ? '#a78bfa' : '#94a3b8'

  if (!message && !hostelName && !kind) {
    return (
      <div style={{ ...card, borderLeftColor: '#64748b' }}>
        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>Unknown notification</p>
      </div>
    )
  }

  return (
    <div style={{ ...card, borderLeftColor: accent }}>
      <div style={{ marginBottom: '0.35rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
        {kind === 'face_entry' && <span style={badge('#7dd3fc')}>Face</span>}
        {kind === 'visitor_qr' && <span style={badge('#c4b5fd')}>Visitor</span>}
        {!kind && <span style={badge('#cbd5e1')}>Live</span>}
        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
        {when && <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 'auto' }}>{when}</span>}
      </div>
      {message && (
        <p style={{ margin: '0.25rem 0 0', color: '#e5e7eb', lineHeight: 1.45 }}>{message}</p>
      )}
      {(hostelName || cameraName) && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
          {hostelName && <span>Hostel: {hostelName}</span>}
          {hostelName && cameraName && ' · '}
          {cameraName && <span>Camera: {cameraName}</span>}
        </p>
      )}
    </div>
  )
}
