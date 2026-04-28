import { Link, useNavigate } from 'react-router-dom'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, primaryButton, secondaryButton, logoutButton, logoCircle, brandMark } from '../styles/common'

const linkStyle = { ...primaryButton, padding: '2.25rem 1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const }
const secLinkStyle = { ...secondaryButton, padding: '2.25rem 1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const }

export default function AdminLanding() {
  const navigate = useNavigate()

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token')
    }
    navigate('/', { replace: true })
  }

  return (
    <div style={layout}>
      <div
        style={{
          ...card,
          minHeight: '90vh',
          position: 'relative',
        }}
      >
        <button
          type="button"
          style={{
            ...logoutButton,
            position: 'absolute',
            top: '1.5rem',
            right: '2rem',
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            columnGap: '3rem',
            alignItems: 'center',
            width: '100%',
            minHeight: '74vh',
          }}
        >
          {/* Left: heading + buttons in column */}
          <div>
            <div style={{ ...brandMark, marginBottom: '7rem' }}>HOSTEL SECURITY</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Console</h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.75rem' }}>Choose an option below .</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxWidth: '700px' }}>
              <Link to="/admin/live-feed-landing" style={linkStyle}>
                Live feed & past recordings
              </Link>
              <Link to="/admin/manage" style={secLinkStyle}>
                Manage
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
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <img src={collegeLogo} alt="College logo" style={logoCircle} />
          </div>
        </div>
      </div>
    </div>
  )
}
