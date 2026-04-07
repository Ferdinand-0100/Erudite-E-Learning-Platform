import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import CourseShell from './pages/CourseShell'
import CoursePage from './pages/CoursePage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-3)' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
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
