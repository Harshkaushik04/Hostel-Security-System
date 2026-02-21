import type React from 'react'

export const layout = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: 'radial-gradient(circle at top left, #1e293b, #020617 40%, #000000)',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f9fafb',
} as const

export const card = {
  width: '100%',
  maxWidth: '1600px',
  backgroundColor: 'rgba(15,23,42,0.9)',
  borderRadius: 16,
  padding: '3rem 4rem',
  boxShadow: '0 24px 60px rgba(15,23,42,0.9), 0 0 0 1px rgba(148,163,184,0.15)',
  backdropFilter: 'blur(18px)',
} as const

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.6)',
  backgroundColor: 'rgba(15,23,42,0.8)',
  color: '#f9fafb',
  fontSize: '0.95rem',
  outline: 'none',
}

export const primaryButton: React.CSSProperties = {
  padding: '0.75rem 1.25rem',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, #38bdf8, #6366f1, #8b5cf6)',
  color: '#f9fafb',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 12px 25px rgba(56,189,248,0.15), 0 0 0 1px rgba(129,140,248,0.5)',
}

export const secondaryButton: React.CSSProperties = {
  padding: '0.75rem 1.25rem',
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.5)',
  backgroundColor: 'rgba(15,23,42,0.85)',
  color: '#e5e7eb',
  fontSize: '1rem',
  fontWeight: 500,
  cursor: 'pointer',
}

export const backButton: React.CSSProperties = {
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
}

export const logoutButton: React.CSSProperties = {
  fontSize: '0.9rem',
  padding: '0.5rem 1rem',
  borderRadius: 999,
  border: '1px solid rgba(248,113,113,0.35)',
  background: 'radial-gradient(circle at top, rgba(248,113,113,0.25), rgba(127,29,29,0.5))',
  color: '#fee2e2',
  cursor: 'pointer',
}
