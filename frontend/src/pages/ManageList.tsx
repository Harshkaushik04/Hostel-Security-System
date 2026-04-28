import { Link } from 'react-router-dom'
import collegeLogo from '../assets/IIT Ropar.png'
import { layout, card, primaryButton, secondaryButton, logoCircle } from '../styles/common'

export default function ManageList() {
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
          {/* Left: all controls and buttons */}
          <div>
            <Link to="/admin" style={{ ...secondaryButton, textDecoration: 'none' }}>← Back to Admin</Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
              Manage entities
            </h1>
            <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Choose entity type to manage.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '320px' }}>
              <Link
                to="/admin/manage/add-hostel"
                style={{ ...primaryButton, textDecoration: 'none', textAlign: 'center' }}
              >
                Hostel
              </Link>
              <Link
                to="/admin/manage/add-admin"
                style={{ ...primaryButton, textDecoration: 'none', textAlign: 'center' }}
              >
                Admin
              </Link>
              <Link
                to="/admin/manage/add-student"
                style={{ ...primaryButton, textDecoration: 'none', textAlign: 'center' }}
              >
                Student
              </Link>
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
