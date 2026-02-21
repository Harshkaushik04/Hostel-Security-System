import { Link } from 'react-router-dom'
import { layout, card, primaryButton, secondaryButton, logoutButton } from '../styles/common'

const linkStyle = { ...primaryButton, textDecoration: 'none', textAlign: 'center' as const }
const secLinkStyle = { ...secondaryButton, textDecoration: 'none', textAlign: 'center' as const }

export default function AdminLanding() {
  return (
    <div style={layout}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Console</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af' }}>Choose an option below.</p>
          </div>
          <Link to="/" style={logoutButton}>Logout</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <Link to="/admin/live-feed-landing" style={linkStyle}>
            Live feed, past recordings & activities
          </Link>
          <Link to="/admin/manage" style={secLinkStyle}>
            Manage students / admin list
          </Link>
          <Link to="/admin/notifications" style={secLinkStyle}>
            Notifications
          </Link>
          <Link to="/admin/emergencies" style={secLinkStyle}>
            Emergencies
          </Link>
        </div>
      </div>
    </div>
  )
}
