import { Link } from 'react-router-dom'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, primaryButton, secondaryButton, logoCircle, brandMark } from '../styles/common'

const linkStyle = { ...primaryButton, padding: '2.25rem 1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const }
const secLinkStyle = { ...secondaryButton, padding: '2.25rem 1.25rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const }

export default function ManageList() {
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
            minHeight: '74vh',
          }}
        >
          {/* Left: all controls and buttons */}
          <div>
            <div style={{ ...brandMark, marginBottom: '7rem' }}>HOSTEL SECURITY</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Manage entities
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1.75rem' }}>
              Choose entity type to manage.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxWidth: '700px' }}>
              <Link to="/admin/cameras" style={linkStyle}>
                Cameras
              </Link>
              <Link to="/admin/manage/add-hostel" style={secLinkStyle}>
                Hostel
              </Link>
              <Link to="/admin/manage/add-admin" style={secLinkStyle}>
                Admin
              </Link>
              <Link to="/admin/manage/add-student" style={secLinkStyle}>
                Student
              </Link>
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
