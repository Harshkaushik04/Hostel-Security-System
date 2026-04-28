import type { CSSProperties } from 'react'
import { secondaryButton } from '../styles/common'

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  padding: '0.65rem 0',
  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
  fontSize: '0.95rem',
}

export function EmergencyInfoDisplay({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null

  const rec = data as Record<string, unknown>

  if (typeof rec.error === 'string') {
    return <p style={{ color: '#f87171' }}>{rec.error}</p>
  }

  const info = rec.info
  if (info && typeof info === 'object' && !Array.isArray(info)) {
    const entries = Object.entries(info as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined && String(v).trim() !== '',
    )
    if (entries.length === 0) {
      return <p style={{ color: '#9ca3af' }}>No emergency contacts on file.</p>
    }
    return (
      <div
        style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 10,
          padding: '0.5rem 1rem',
          maxHeight: 420,
          overflow: 'auto',
        }}
      >
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: '#e5e7eb' }}>
          Contacts & information
        </h2>
        {entries.map(([key, value]) => (
          <div key={key} style={rowStyle}>
            <span style={{ color: '#9ca3af', minWidth: '8rem', flexShrink: 0 }}>{key}</span>
            <span style={{ color: '#f3f4f6', wordBreak: 'break-word' }}>{String(value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <p style={{ color: '#9ca3af' }}>
      Unexpected response shape.{' '}
      <button
        type="button"
        style={{ ...secondaryButton, marginTop: '0.5rem' }}
        onClick={() => navigator.clipboard?.writeText(JSON.stringify(data, null, 2))}
      >
        Copy raw JSON
      </button>
    </p>
  )
}
