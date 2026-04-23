import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { fetchEnrollments, buildCourseKey } from './enrollmentService'

const EnrollmentContext = createContext(null)

export function EnrollmentProvider({ children }) {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setEnrollments([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchEnrollments(supabase, user.id)
      .then(keys => setEnrollments(keys.map(k => k.toLowerCase())))
      .finally(() => setLoading(false))
  }, [user?.id])

  function isEnrolled(course, subclass, level) {
    return enrollments.includes(buildCourseKey(course, subclass, level).toLowerCase())
  }

  return (
    <EnrollmentContext.Provider value={{ enrollments, isEnrolled, loading }}>
      {children}
    </EnrollmentContext.Provider>
  )
}

export function useEnrollment() {
  const ctx = useContext(EnrollmentContext)
  if (!ctx) throw new Error('useEnrollment must be used inside EnrollmentProvider')
  return ctx
}
