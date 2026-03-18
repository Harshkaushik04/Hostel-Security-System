import type React from 'react'

// Full-page background layout. Change padding / alignment here to move the whole card.
export const layout: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '2rem',
  background: 'var(--bg)',
  fontFamily: '"Inter", system-ui, sans-serif' ,
  color: 'var(--text)',
  
}

// Main white card in the center. Change width, borderRadius, or shadow here.
export const card: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--card-bg)',
  padding: '1.5rem 3rem',
  borderRadius: 22,
  boxShadow: 'var(--shadow)',
}

// Top-right navbar (Landing page).
export const topNavBar: React.CSSProperties = {
  width: '50%',
  marginLeft: 'auto',
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '4rem',
  marginBottom: '1.25rem',
}

export const topNavLinksRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2rem',
}

export const topNavLink: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 500,
  color: 'var(--text)',
  textDecoration: 'none',
}

export const hamburgerButton: React.CSSProperties = {
  width: '42px',
  height: '34px',
  borderRadius: 0,
  // border: '1px solid rgba(0,0,0,0.35)',
  backgroundColor: 'var(--surface)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  // boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
}

export const hamburgerBars: React.CSSProperties = {
  display: 'grid',
  gap: '4px',
}

export const hamburgerBar: React.CSSProperties = {
  width: '18px',
  height: '2px',
  backgroundColor: 'var(--text)',
}

export const topNavDropdown: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 0.5rem)',
  right: 0,
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  boxShadow: '0 18px 45px rgba(0,0,0,0.18)',
  padding: '0.6rem 0.75rem',
  minWidth: '180px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  zIndex: 10,
}

// Grid that splits card into left (text/buttons) and right (logo) columns.
export const landingGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: '5rem',
  alignItems: 'center',
}

// Left column container. Adjust padding/margins here to move all left content.
export const landingLeft: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

// Right column container for the logo area.
export const landingRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // background: 'radial-gradient(circle at center, #f1f5f9 30%, transparent 70%)'
}

// Small brand text at the very top ("HOSTEL SECURITY").
export const brandMark: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: '10rem',
  textShadow: '0 3px 10px rgba(0,0,0,0.4)'}

// Big hero heading ("Safe access. Simple control.").
export const heroTitle: React.CSSProperties = {
  fontSize: '6rem',
  fontWeight: 600,
  lineHeight: 1,
  margin: 0,
  marginBottom: '2.5rem',
  letterSpacing: '-0.05em',
  color: 'var(--text-strong)',
  
}

// Supporting paragraph under the hero heading.
export const heroText: React.CSSProperties = {
  fontSize: '1rem',
  color: 'var(--muted)',
  marginBottom: '0.2rem',
  maxWidth: '28rem',
}

// Column that stacks the two login buttons.
export const loginButtonsColumn: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '1rem',
  marginTop: '1.5rem'
}

// Circular logo frame on the right. Replace inner content with your logo later.
export const logoCircle: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  objectFit: 'contain',
  transform: 'translateY(20px)',
  // filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35)) drop-shadow(0 8px 12px rgba(0,0,0,0.25))'
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 10,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--surface)',
  color: 'var(--surface-text)',
  fontSize: '0.95rem',
  outline: 'none',
}

// Base button style (no colors). Use this when colors come from CSS classes.
export const buttonBase: React.CSSProperties = {
  padding: '0.75rem 1.25rem',
  borderRadius: 3,
  border: '1px solid var(--border-strong)',
  fontSize: '1rem',
  fontWeight: 400,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  // boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
}

export const primaryButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: 'var(--btn-bg)',
  color: 'var(--btn-text)',
}

export const secondaryButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: 'var(--btn-bg)',
  color: 'var(--btn-text)',
}

export const backButton: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--muted)',
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
  ...buttonBase,
  fontSize: '1rem',
  backgroundColor: 'var(--btn-bg)',
  color: 'var(--btn-text)',
}

export const infoCard: React.CSSProperties = {
  width: '100%',
  marginTop: '2rem',
  backgroundColor: 'var(--card-bg)',
  padding: '2rem 3rem',
  borderRadius: 22,
  boxShadow: 'var(--shadow)',
}