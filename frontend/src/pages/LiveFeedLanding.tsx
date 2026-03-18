import { Link } from 'react-router-dom'
import collegeLogo from '../assets/IIT ROPAR.png'
import { layout, card, primaryButton, secondaryButton, logoCircle } from '../styles/common'

const linkStyle = { ...primaryButton, textDecoration: 'none', textAlign: 'center' as const }
const secStyle = { ...secondaryButton, textDecoration: 'none', textAlign: 'center' as const }

export default function LiveFeedLanding() {
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
          {/* Left: content + buttons in column */}
          <div>
            <Link to="/admin" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Admin</Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
              Live feed, past recordings & activities
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              Choose an option below.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '260px' }}>
              <Link to="/admin/live-feed" style={linkStyle}>Live feed</Link>
              <Link to="/admin/activities" style={secStyle}>Activities</Link>
              <Link to="/admin/past-recordings" style={secStyle}>Past recordings</Link>
            </div>
          </div>

          {/* Right: logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
