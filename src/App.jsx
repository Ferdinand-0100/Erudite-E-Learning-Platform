import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import EnglishSection from './pages/English'
import MandarinSection from './pages/Mandarin'
import ComputerSection from './pages/Computer'
import CoursePage from './pages/CoursePage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-3)' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
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
        <Route path="english" element={<EnglishSection />}>
          <Route path=":section/:tab" element={<CoursePage course="english" />} />
        </Route>
        <Route path="mandarin" element={<MandarinSection />}>
          <Route path=":tab" element={<CoursePage course="mandarin" />} />
        </Route>
        <Route path="computer" element={<ComputerSection />}>
          <Route path=":tab" element={<CoursePage course="computer" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
