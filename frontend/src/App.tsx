import { useState } from 'react'

type UserRole = 'none' | 'student' | 'admin'
type Screen =
  | 'role-select'
  | 'student-login'
  | 'admin-login'
  | 'student-dashboard'
  | 'admin-dashboard'

function App() {
  const [screen, setScreen] = useState<Screen>('role-select')
  const [role, setRole] = useState<UserRole>('none')

  const handleLogin = (selectedRole: UserRole) => {
    if (selectedRole === 'student') {
      setRole('student')
      setScreen('student-dashboard')
    } else if (selectedRole === 'admin') {
      setRole('admin')
      setScreen('admin-dashboard')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background:
          'radial-gradient(circle at top left, #1e293b, #020617 40%, #000000)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#f9fafb',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1600px',
          backgroundColor: 'rgba(15,23,42,0.9)',
          borderRadius: 16,
          padding: '3rem 4rem',
          boxShadow:
            '0 24px 60px rgba(15,23,42,0.9), 0 0 0 1px rgba(148,163,184,0.15)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            letterSpacing: '0.03em',
          }}
        >
          Hostel Security
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: '#9ca3af',
            marginBottom: '2rem',
          }}
        >
          Secure access for students and administrators.
        </p>

        {screen === 'role-select' && (
          <RoleSelection onSelect={(selected) => {
            if (selected === 'student') setScreen('student-login')
            else setScreen('admin-login')
          }} />
        )}

        {screen === 'student-login' && (
          <LoginForm
            title="Student Login"
            subtitle="Use your registered student credentials."
            onSubmit={() => handleLogin('student')}
            onBack={() => setScreen('role-select')}
          />
        )}

        {screen === 'admin-login' && (
          <LoginForm
            title="Admin Login"
            subtitle="Restricted access. Admins only."
            onSubmit={() => handleLogin('admin')}
            onBack={() => setScreen('role-select')}
          />
        )}

        {screen === 'student-dashboard' && role === 'student' && (
          <StudentDashboard onLogout={() => {
            setRole('none')
            setScreen('role-select')
          }} />
        )}

        {screen === 'admin-dashboard' && role === 'admin' && (
          <AdminDashboard onLogout={() => {
            setRole('none')
            setScreen('role-select')
          }} />
        )}
      </div>
    </div>
  )
}

interface RoleSelectionProps {
  onSelect: (role: 'student' | 'admin') => void
}

function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        Choose login type
      </h2>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#9ca3af',
          marginBottom: '1.5rem',
        }}
      >
        Select whether you are a student or an administrator.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => onSelect('student')}
          style={primaryButtonStyle}
        >
          Student login
        </button>
        <button
          type="button"
          onClick={() => onSelect('admin')}
          style={secondaryButtonStyle}
        >
          Admin login
        </button>
      </div>
    </div>
  )
}

interface LoginFormProps {
  title: string
  subtitle: string
  onSubmit: () => void
  onBack: () => void
}

function LoginForm({ title, subtitle, onSubmit, onBack }: LoginFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
    <button
      type="button"
      onClick={onBack}
      style={{
        fontSize: '0.85rem',
        color: '#9ca3af',
        marginBottom: '1rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      ← Back
    </button>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#9ca3af',
          marginBottom: '1.5rem',
        }}
      >
        {subtitle}
      </p>

      <div style={{ display: 'grid', gap: '0.9rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <label
            style={{
              fontSize: '0.9rem',
              color: '#e5e7eb',
            }}
          >
            Username / Email ID
          </label>
          <input
            type="text"
            required
            placeholder="Enter your username or email"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <label
            style={{
              fontSize: '0.9rem',
              color: '#e5e7eb',
            }}
          >
            Password
          </label>
          <input
            type="password"
            required
            placeholder="Enter your password"
            style={inputStyle}
          />
        </div>
      </div>

      <button type="submit" style={primaryButtonStyle}>
        Login
      </button>
    </form>
  )
}

interface StudentDashboardProps {
  onLogout: () => void
}

function StudentDashboard({ onLogout }: StudentDashboardProps) {
  return (
    <div>
      <HeaderWithLogout title="Student Portal" onLogout={onLogout} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
        <DashboardCard
          title="Add entry"
          description="Record your hostel entry/exit time."
        />
        <DashboardCard
          title="Emergency contacts"
          description="View warden, security, and helpline numbers."
        />
      </div>
    </div>
  )
}

interface AdminDashboardProps {
  onLogout: () => void
}

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  return (
    <div>
      <HeaderWithLogout title="Admin Console" onLogout={onLogout} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
        <DashboardCard
          title="Add hostel"
          description="Register a new hostel or block in the system."
        />
        <DashboardCard
          title="Edit hostel"
          description="Update hostel details and configurations."
        />
        <DashboardCard
          title="View hostel cameras"
          description="Open live camera feeds for selected hostels."
        />
        <DashboardCard
          title="Add student entry"
          description="Manually log student entries and exits."
        />
      </div>
    </div>
  )
}

interface HeaderWithLogoutProps {
  title: string
  onLogout: () => void
}

function HeaderWithLogout({ title, onLogout }: HeaderWithLogoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#9ca3af',
          }}
        >
          Choose an option below to continue.
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        style={{
          fontSize: '0.9rem',
          padding: '0.5rem 1rem',
          borderRadius: 999,
          border: '1px solid rgba(248,113,113,0.35)',
          background:
            'radial-gradient(circle at top, rgba(248,113,113,0.25), rgba(127,29,29,0.5))',
          color: '#fee2e2',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  )
}

interface DashboardCardProps {
  title: string
  description: string
}

function DashboardCard({ title, description }: DashboardCardProps) {
  return (
    <button
      type="button"
      style={{
        textAlign: 'left',
        padding: '1.25rem 1.5rem',
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.3)',
        background:
          'linear-gradient(135deg, rgba(30,64,175,0.35), rgba(15,23,42,0.9))',
        color: '#e5e7eb',
        cursor: 'pointer',
        display: 'grid',
        gap: '0.25rem',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(30,64,175,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: '0.9rem',
          color: '#cbd5f5',
        }}
      >
        {description}
      </span>
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.6)',
  backgroundColor: 'rgba(15,23,42,0.8)',
  color: '#f9fafb',
  fontSize: '0.95rem',
  outline: 'none',
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1.25rem',
  borderRadius: 999,
  border: 'none',
  background:
    'linear-gradient(135deg, #38bdf8, #6366f1, #8b5cf6)',
  color: '#f9fafb',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow:
    '0 12px 25px rgba(56,189,248,0.15), 0 0 0 1px rgba(129,140,248,0.5)',
}

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1.25rem',
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.5)',
  backgroundColor: 'rgba(15,23,42,0.85)',
  color: '#e5e7eb',
  fontSize: '1rem',
  fontWeight: 500,
  cursor: 'pointer',
}

export default App
