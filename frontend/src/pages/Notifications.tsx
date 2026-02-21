import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationsWebSocket } from '../hooks/useNotificationsWebSocket'
import { fetchPreviousNotifications } from '../api/endpoints'
import { layout, card, secondaryButton } from '../styles/common'

export default function Notifications() {
  const { messages, connected } = useNotificationsWebSocket()
  const [previous, setPrevious] = useState<unknown[]>([])
  const [k, setK] = useState(20)
  const [loading, setLoading] = useState(false)

  const loadPrevious = async () => {
    setLoading(true)
    try {
      const res = await fetchPreviousNotifications({ k })
      const list = Array.isArray(res) ? res : (res as { notifications?: unknown[] })?.notifications ?? []
      setPrevious(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrevious()
  }, [])

  const all = [...messages, ...previous]

  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Admin</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Notifications</h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
          People entering (own or visitor). WebSocket (port 5000) + [express] /fetch-previous-notifications (previous k).
        </p>
        <p style={{ marginBottom: '1rem' }}>
          WebSocket: <span style={{ color: connected ? '#4ade80' : '#f87171' }}>{connected ? 'Connected' : 'Disconnected'}</span>
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <input type="number" value={k} onChange={(e) => setK(Number(e.target.value))} style={{ width: 60, padding: '0.25rem', marginRight: '0.5rem' }} />
          <button type="button" style={secondaryButton} onClick={loadPrevious} disabled={loading}>Fetch previous k notifications</button>
        </div>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {all.length === 0 && !loading && <p style={{ color: '#9ca3af' }}>No notifications yet.</p>}
          {all.map((msg, i) => (
            <pre key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 8, marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              {JSON.stringify(msg, null, 2)}
            </pre>
          ))}
        </div>
      </div>
    </div>
  )
}
