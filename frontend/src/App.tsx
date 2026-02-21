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
  ActivitiesLanding,
  ActivityPlayer,
  PastRecordingsLanding,
  PastRecordingPlayer,
  ManageList,
  ManageEdit,
  Notifications,
} from './pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/student-sign-in" element={<StudentSignIn />} />
        <Route path="/admin-sign-in" element={<AdminSignIn />} />
        {/* Student side */}
        <Route path="/invite" element={<VisitorEntry />} />
        <Route path="/emergencies" element={<Emergencies />} />
        {/* Admin */}
        <Route path="/admin" element={<AdminLanding />} />
        <Route path="/admin/emergencies" element={<AdminEmergencies />} />
        <Route path="/admin/live-feed-landing" element={<LiveFeedLanding />} />
        <Route path="/admin/live-feed" element={<LiveFeed />} />
        <Route path="/admin/activities" element={<ActivitiesLanding />} />
        <Route path="/admin/activities/:activityId" element={<ActivityPlayer />} />
        <Route path="/admin/past-recordings" element={<PastRecordingsLanding />} />
        <Route path="/admin/past-recordings/:recordingId" element={<PastRecordingPlayer />} />
        <Route path="/admin/manage" element={<ManageList />} />
        <Route path="/admin/manage/edit" element={<ManageEdit />} />
        <Route path="/admin/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
