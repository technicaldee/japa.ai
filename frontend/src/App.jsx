import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ProfileOnboarding from './pages/ProfileOnboarding'
import DiscoveryDashboard from './pages/DiscoveryDashboard'
import ApplicationEngine from './pages/ApplicationEngine'
import DocumentChecklist from './pages/DocumentChecklist'
import ScholarshipDetails from './pages/ScholarshipDetails'
import WeeklyDigest from './pages/WeeklyDigest'
import AiAgent from './pages/AiAgent'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminScrapers from './pages/admin/AdminScrapers'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-on-surface-variant">Loading...</p></div>
  if (!user) return <Navigate to="/signin" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-on-surface-variant">Loading...</p></div>
  if (!user) return <Navigate to="/signin" replace />
  if (!isAdmin) return <Navigate to="/discovery" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/discovery" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileOnboarding /></ProtectedRoute>} />
      <Route path="/discovery" element={<ProtectedRoute><DiscoveryDashboard /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><ApplicationEngine /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentChecklist /></ProtectedRoute>} />
      <Route path="/scholarship/:id" element={<ProtectedRoute><ScholarshipDetails /></ProtectedRoute>} />
      <Route path="/scholarship" element={<ProtectedRoute><ScholarshipDetails /></ProtectedRoute>} />
      <Route path="/digest" element={<ProtectedRoute><WeeklyDigest /></ProtectedRoute>} />
      <Route path="/agent" element={<ProtectedRoute><AiAgent /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/scrapers" element={<AdminRoute><AdminScrapers /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
