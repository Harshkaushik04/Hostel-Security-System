import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
  ManageCameras,
  Notifications,
} from './pages'
import type { ReactNode } from 'react'

function hasJwtToken(): boolean {
  if (typeof window === 'undefined') return false
  const token = window.localStorage.getItem('token')
  return typeof token === 'string' && token.trim().length > 0
}

function RequireAuth({ children }: { children: ReactNode }) {
  return hasJwtToken() ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student-sign-in" element={<StudentSignIn />} />
        <Route path="/admin-sign-in" element={<AdminSignIn />} />
        {/* Student side */}
        <Route path="/invite" element={<RequireAuth><VisitorEntry /></RequireAuth>} />
        {/* Public: linked from landing nav; no student session required */}
        <Route path="/emergencies" element={<Emergencies />} />
        {/* Admin */}
        <Route path="/admin" element={<RequireAuth><AdminLanding /></RequireAuth>} />
        <Route path="/admin/emergencies" element={<RequireAuth><AdminEmergencies /></RequireAuth>} />
        <Route path="/admin/live-feed-landing" element={<RequireAuth><LiveFeedLanding /></RequireAuth>} />
        <Route path="/admin/live-feed" element={<RequireAuth><LiveFeed /></RequireAuth>} />
        <Route path="/admin/past-recordings" element={<RequireAuth><PastRecordingsLanding /></RequireAuth>} />
        <Route
          path="/admin/past-recordings/play/:cameraName/:filename"
          element={<RequireAuth><PastRecordingPlayer /></RequireAuth>}
        />
        <Route path="/admin/manage" element={<RequireAuth><ManageList /></RequireAuth>} />
        <Route path="/admin/manage/edit" element={<RequireAuth><ManageEdit /></RequireAuth>} />
        <Route path="/admin/cameras" element={<RequireAuth><ManageCameras /></RequireAuth>} />
        <Route path="/admin/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
