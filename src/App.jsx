import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import { EnrollmentProvider } from './lib/EnrollmentContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import CourseShell from './pages/CourseShell'
import CoursePage from './pages/CoursePage'
import AdminGuard from './components/admin/AdminGuard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVideos from './pages/admin/AdminVideos'
import AdminMaterials from './pages/admin/AdminMaterials'
import AdminQuiz from './pages/admin/AdminQuiz'
import AdminStudents from './pages/admin/AdminStudents'

function ProtectedRoute({ children }) {
  const { user, loading, profile, kickedOut } = useAuth()
  if (loading || (user && profile === null)) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-3)' }}>Loading…</div>
  if (kickedOut) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Session ended</div>
      <div style={{ fontSize: 14, color: 'var(--color-text-2)', maxWidth: 320 }}>
        Your account was signed in on another device. Only one active session is allowed at a time.
      </div>
      <a href="/login" style={{ marginTop: 8, padding: '10px 20px', background: 'var(--color-accent)', color: 'white', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
        Sign in again
      </a>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

// Backward-compat redirect components

function MandarinTabRedirect() {
  const { tab } = useParams()
  return <Navigate to={`/mandarin/GM/hsk1/${tab}`} replace />
}

function ComputerTabRedirect() {
  const { tab } = useParams()
  return <Navigate to={`/computer/IOT/beginner/${tab}`} replace />
}

function EnglishGETTabRedirect() {
  const { tab } = useParams()
  return <Navigate to={`/english/GET/beginner/${tab}`} replace />
}

function EnglishIELTSTabRedirect() {
  const { tab } = useParams()
  return <Navigate to={`/english/IELTS/band4/${tab}`} replace />
}

function EnglishPTETabRedirect() {
  const { tab } = useParams()
  return <Navigate to={`/english/PTE/pte_core/${tab}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="videos" element={<AdminVideos />} />
        <Route path="materials" element={<AdminMaterials />} />
        <Route path="quiz" element={<AdminQuiz />} />
        <Route path="students" element={<AdminStudents />} />
      </Route>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <EnrollmentProvider>
              <Layout />
            </EnrollmentProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />

        {/* Backward-compat redirects — must come before the generic :course route */}
        <Route path="mandarin/:tab" element={<MandarinTabRedirect />} />
        <Route path="computer/:tab" element={<ComputerTabRedirect />} />
        <Route path="english/GET/:tab" element={<EnglishGETTabRedirect />} />
        <Route path="english/IELTS/:tab" element={<EnglishIELTSTabRedirect />} />
        <Route path="english/PTE/:tab" element={<EnglishPTETabRedirect />} />

        {/* Generic 4-level route for all courses */}
        <Route path=":course" element={<CourseShell />}>
          <Route path=":subclass/:level/:tab" element={<CoursePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
