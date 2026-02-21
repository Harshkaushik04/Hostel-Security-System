import { Link } from 'react-router-dom'
import { layout, card, primaryButton, secondaryButton } from '../styles/common'

export default function Landing() {
  return (
    <div style={layout}>
      <div style={card}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
          Hostel Security
        </h1>
        <p style={{ fontSize: '1rem', color: '#9ca3af', marginBottom: '2rem' }}>
          Secure access for students and administrators.
        </p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Choose login type</h2>
        <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
          Select whether you are a student or an administrator.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <Link to="/student-sign-in" style={{ ...primaryButton, textDecoration: 'none', textAlign: 'center' }}>
            Student login
          </Link>
          <Link to="/admin-sign-in" style={{ ...secondaryButton, textDecoration: 'none', textAlign: 'center' }}>
            Admin login
          </Link>
        </div>
      </div>
    </div>
  )
}
