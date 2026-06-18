import { useAuth } from '../../lib/AuthContext'
import { Navigate } from 'react-router-dom'

/**
 * Blocks teacher access to admin-only pages.
 * Redirects teachers to /admin/studyguides; non-admins/non-teachers to /.
 */
export default function AdminOnlyGuard({ children }) {
  const { profile } = useAuth()

  if (profile?.role === 'teacher') {
    return <Navigate to="/admin/studyguides" replace />
  }

  // Shouldn't normally reach here (AdminGuard already blocks non-admin/teacher),
  // but guard defensively anyway.
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
