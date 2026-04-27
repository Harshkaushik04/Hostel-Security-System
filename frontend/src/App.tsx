import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Landing,
  StudentSignIn,
  AdminSignIn,
  VisitorEntry,
  Emergencies,
  AdminLanding,
  AdminEmergencies,
  LiveFeedLanding,
  LiveFeed,
  PastRecordingsLanding,
  PastRecordingPlayer,
  ManageList,
  ManageEdit,
  Notifications,
} from './pages'

function readToken() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem('token')
  } catch {
    return null
  }
}

function RequireAuth() {
  const location = useLocation()
  const [token, setToken] = useState(() => readToken())

  useEffect(() => {
    setToken(readToken())

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') setToken(readToken())
    }

    // Handles cases where Chrome restores a previous page from history/BFCache.
    const onPageShow = () => setToken(readToken())

    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  if (!token) {
    const isAdminRoute = location.pathname.startsWith('/admin')
    return (
      <Navigate
        to={isAdminRoute ? '/admin-sign-in' : '/student-sign-in'}
        replace
        state={{ from: location }}
      />
    )
  }
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student-sign-in" element={<StudentSignIn />} />
        <Route path="/admin-sign-in" element={<AdminSignIn />} />

        <Route element={<RequireAuth />}>
          {/* Student side */}
          <Route path="/invite" element={<VisitorEntry />} />
          <Route path="/emergencies" element={<Emergencies />} />
          {/* Admin */}
          <Route path="/admin" element={<AdminLanding />} />
          <Route path="/admin/emergencies" element={<AdminEmergencies />} />
          <Route path="/admin/live-feed-landing" element={<LiveFeedLanding />} />
          <Route path="/admin/live-feed" element={<LiveFeed />} />
          <Route path="/admin/past-recordings" element={<PastRecordingsLanding />} />
          <Route path="/admin/past-recordings/:recordingId" element={<PastRecordingPlayer />} />
          <Route path="/admin/manage" element={<ManageList />} />
          <Route path="/admin/manage/edit" element={<ManageEdit />} />
          <Route path="/admin/notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
