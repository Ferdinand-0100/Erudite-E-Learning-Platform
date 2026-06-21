import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { buildCourseKey } from './enrollmentService'
import { calcCurrentWeek } from './weekCalculator'

const EnrollmentContext = createContext(null)

export function EnrollmentProvider({ children }) {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])      // string[] of course_keys
  const [currentWeekMap, setCurrentWeekMap] = useState({}) // { course_key: weekNumber }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setEnrollments([])
      setCurrentWeekMap({})
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('enrollments')
      .select('course_key, course_start_date, week_override')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .then(({ data }) => {
        const rows = data || []
        setEnrollments(rows.map(r => r.course_key.toLowerCase()))
        const map = {}
        for (const r of rows) {
          map[r.course_key.toLowerCase()] = calcCurrentWeek(r.course_start_date, r.week_override)
        }
        setCurrentWeekMap(map)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  function isEnrolled(course, subclass, level) {
    return enrollments.includes(buildCourseKey(course, subclass, level).toLowerCase())
  }

  function getCurrentWeek(courseKey) {
    return currentWeekMap[courseKey?.toLowerCase()] ?? 1
  }

  return (
    <EnrollmentContext.Provider value={{ enrollments, isEnrolled, loading, currentWeekMap, getCurrentWeek }}>
      {children}
    </EnrollmentContext.Provider>
  )
}

export function useEnrollment() {
  const ctx = useContext(EnrollmentContext)
  if (!ctx) throw new Error('useEnrollment must be used inside EnrollmentProvider')
  return ctx
}
