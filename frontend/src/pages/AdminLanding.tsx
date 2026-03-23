import { Link } from 'react-router-dom'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, primaryButton, secondaryButton, logoutButton, logoCircle } from '../styles/common'

const linkStyle = { ...primaryButton, textDecoration: 'none', textAlign: 'center' as const }
const secLinkStyle = { ...secondaryButton, textDecoration: 'none', textAlign: 'center' as const }

export default function AdminLanding() {
  return (
    <div style={layout}>
      <div style={card}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 0.7fr)',
            columnGap: '3rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: heading + buttons in column */}
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Console</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.75rem' }}>Choose an option below.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '320px' }}>
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

          {/* Right: logo with logout to its right */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <img src={collegeLogo} alt="College logo" style={{ ...logoCircle, maxWidth: '220px' }} />
            <Link to="/" style={logoutButton}>Logout</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
