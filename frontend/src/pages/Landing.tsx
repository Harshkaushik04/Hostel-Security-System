import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import collegeLogo from '../assets/IIT Ropar.png'
import { infoCard } from '../styles/common'

import {
  layout,
  card,
  topNavBar,
  topNavLinksRow,
  topNavLink,
  hamburgerButton,
  hamburgerBars,
  hamburgerBar,
  topNavDropdown,
  landingGrid,
  landingLeft,
  landingRight,
  brandMark,
  heroTitle,
  heroText,
  loginButtonsColumn,
  logoCircle,
  buttonBase,
} from '../styles/common'

export default function Landing() {
  const [navOpen, setNavOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return document.documentElement.classList.contains('theme-dark')
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      const isDark = document.documentElement.classList.contains('theme-dark')
      setDarkMode(isDark)
    } catch {
      // ignore
    }
  }, [])

  const toggleDarkMode = () => {
    try {
      const root = document.documentElement
      const next = !root.classList.contains('theme-dark')
      root.classList.toggle('theme-dark', next)
      window.localStorage.setItem('theme', next ? 'dark' : 'light')
      setDarkMode(next)
    } catch {
      // ignore
    }
  }

  return (
    <div style={{...layout, position: 'relative',zIndex: 2}}>
      <div style={card}>
        <div style={{ position: 'relative' }}>
        <div style={{
    position: 'absolute',
    top: 0,
    right: 0
  }}>
          <div style={topNavBar}>
            {!navOpen && (
              <div style={topNavLinksRow}>
                <Link to="/" style={{ ...topNavLink, textDecoration: 'underline' }}>
                  Home
                </Link>
                <Link to="/emergencies" style={topNavLink}>
                  Emergencies
                </Link>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  style={{ ...topNavLink, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  {darkMode ? 'Lightmode' : 'Darkmode'}
                </button>
              </div>
            )}
            <button
              type="button"
              aria-label="Menu"
              style={hamburgerButton}
              onClick={() => setNavOpen((v) => !v)}
            >
              <span style={hamburgerBars}>
                <span style={hamburgerBar} />
                <span style={hamburgerBar} />
                <span style={hamburgerBar} />
              </span>
            </button>
          </div>

          {navOpen && (
            <div style={topNavDropdown}>
              <Link to="/" style={{ ...topNavLink, textDecoration: 'underline' }} onClick={() => setNavOpen(false)}>
                Home
              </Link>
              <Link to="/emergencies" style={topNavLink} onClick={() => setNavOpen(false)}>
                Emergencies
              </Link>
              <button
                type="button"
                onClick={() => { toggleDarkMode(); setNavOpen(false) }}
                style={{ ...topNavLink, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                {darkMode ? 'Lightmode' : 'Darkmode'}
              </button>
            </div>
          )}
        </div>
        </div>

        <div style={landingGrid}>
          {/* Left column: heading + text + buttons */}
          <div style={landingLeft}>
            <div style={brandMark}>HOSTEL SECURITY</div>
            <h1 style={heroTitle}>
              Safe Access
              <br />
              Simple Control
            </h1>

            <p style={heroText}>
            Log in to continue.
            </p>

            <div style={loginButtonsColumn}>
              <Link
                to="/student-sign-in"
                className="landing-login-btn"
                style={{
                  ...buttonBase,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                STUDENT LOGIN
              </Link>
              <Link
                to="/admin-sign-in"
                className="landing-login-btn"
                style={{
                  ...buttonBase,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                ADMIN LOGIN
              </Link>
            </div>
          </div>

          {/* Right column: logo placeholder */}
          <div style={landingRight}>
          <img src={collegeLogo} alt="IIT Ropar Logo" style={logoCircle} />
          </div>
        </div>
      </div>

      <div style={infoCard}>
  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>

    {/* Left */}
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Contact</h3>
      <p>Email: hostel@iitrpr.ac.in</p>
      <p>Phone: +91 XXXXX XXXXX</p>
    </div>

    {/* Middle */}
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Quick Links</h3>
      <p>About</p>
      <p>Security Policy</p>
      <p>Help</p>
    </div>

    {/* Right */}
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Social</h3>
      <p>Instagram</p>
      <p>LinkedIn</p>
      <p>Twitter</p>
    </div>

  </div>
</div>
      
        {/* <img 
            src={footer}
            alt="background"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 'auto',
              opacity: 0.25,
              zIndex: 0,
              pointerEvents: 'none'
                   }}
        /> */}
        </div>
        
  )
}
