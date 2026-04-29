import { Link } from 'react-router-dom'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, primaryButton, secondaryButton, logoCircle, brandMark } from '../styles/common'

const linkStyle = { ...primaryButton, padding: '2.25rem 1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const }
const secStyle = { ...secondaryButton, padding: '2.25rem 1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const }

export default function LiveFeedLanding() {
  return (
    <div style={layout}>
      <div
        style={{
          ...card,
          minHeight: '90vh',
          position: 'relative',
        }}
      >
        <Link 
          to="/admin" 
          style={{ 
            ...secondaryButton, 
            textDecoration: 'none',
            position: 'absolute',
            top: '1.5rem',
            right: '2rem',
          }}
        >
          ← Back to Admin
        </Link>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            columnGap: '3rem',
            alignItems: 'center',
            width: '100%',
            minHeight: '60vh',
          }}
        >
          {/* Left: content + buttons in column */}
          <div>
            <div style={{ ...brandMark, marginBottom: '7rem' }}>HOSTEL SECURITY</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Live feed & past recordings
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.75rem' }}>
              Choose an option below.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxWidth: '700px' }}>
              <Link to="/admin/live-feed" style={linkStyle}>Live feed</Link>
              <Link to="/admin/past-recordings" style={secStyle}>Past recordings</Link>
            </div>
          </div>

          {/* Right: logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
