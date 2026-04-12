import { useAuth } from '../../lib/AuthContext'
import { Navigate } from 'react-router-dom'

export default function AdminGuard({ children }) {
  const { user, loading, profile } = useAuth()

  if (loading || (user && profile === null)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-3)' }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
