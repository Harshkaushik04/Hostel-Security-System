import { Link } from 'react-router-dom'
import { layout, card, primaryButton, secondaryButton } from '../styles/common'

const linkStyle = { ...primaryButton, textDecoration: 'none', textAlign: 'center' as const }
const secStyle = { ...secondaryButton, textDecoration: 'none', textAlign: 'center' as const }

export default function LiveFeedLanding() {
  return (
    <div style={layout}>
      <div style={card}>
        <Link to="/admin" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Admin</Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
          Live feed, past recordings & activities
        </h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Choose an option below.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Link to="/admin/live-feed" style={linkStyle}>Live feed</Link>
          <Link to="/admin/activities" style={secStyle}>Activities</Link>
          <Link to="/admin/past-recordings" style={secStyle}>Past recordings</Link>
        </div>
      </div>
    </div>
  )
}
