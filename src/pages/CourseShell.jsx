import { useParams, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { COURSE_CONFIG, defaultPath, defaultSubclassPath } from '../lib/courseConfig'
import { useAuth } from '../lib/AuthContext'
import { useEnrollment } from '../lib/EnrollmentContext'
import CourseHeader from '../components/CourseHeader'
import PageHeader from '../components/PageHeader'
import LevelSelector from '../components/LevelSelector'
import Tabs from '../components/Tabs'

const TABS = [
  { key: 'videos',    label: 'Tutorial videos' },
  { key: 'materials', label: 'Written materials' },
  { key: 'quiz',      label: 'Quiz system' },
]

export default function CourseShell() {
  const { course, subclass, level } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { isEnrolled, enrollments, loading: enrollmentLoading } = useEnrollment()
  const isAdmin = profile?.role === 'admin'

  const courseConfig = COURSE_CONFIG[course]
  if (!courseConfig) return <Navigate to="/" replace />

  if (!subclass || !courseConfig.subclasses[subclass]) {
    return <Navigate to={defaultPath(course)} replace />
  }

  const subclassConfig = courseConfig.subclasses[subclass]
  const levelExists = subclassConfig.levels.some(l => l.key === level)
  if (!level || !levelExists) {
    return <Navigate to={defaultSubclassPath(course, subclass)} replace />
  }

  // Enrollment guard — wait for loading before redirecting
  if (!isAdmin && !enrollmentLoading && !isEnrolled(course, subclass, level)) {
    return <Navigate to="/" replace />
  }

  if (!isAdmin && enrollmentLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--color-text-3)' }}>Loading…</div>
  }

  return (
    <div>
      <CourseHeader>
        <PageHeader
          title={courseConfig.label}
          breadcrumb={`Courses › ${courseConfig.label}`}
        />
        <div style={styles.pills}>
          {Object.entries(courseConfig.subclasses).map(([key, sub]) => {
            const subEnrolled = isAdmin || enrollmentLoading || enrollments.some(k => k.startsWith(`${course}_${key}_`))
            return (
              <button
                key={key}
                style={{
                  ...styles.pill,
                  ...(subclass === key ? styles.pillActive : {}),
                  ...(!subEnrolled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                }}
                onClick={e => {
                  e.currentTarget.blur()
                  if (!subEnrolled) return
                  navigate(defaultSubclassPath(course, key))
                }}
              >
                {sub.label}
              </button>
            )
          })}
        </div>
        <LevelSelectorWithEnrollment
          levels={subclassConfig.levels}
          activeLevel={level}
          basePath={`/${course}/${subclass}`}
          isAdmin={isAdmin}
          enrollmentLoading={enrollmentLoading}
          isEnrolled={(lvlKey) => isEnrolled(course, subclass, lvlKey)}
        />
        <Tabs
          basePath={`/${course}/${subclass}/${level}`}
          tabs={TABS}
        />
      </CourseHeader>
      <div style={{ padding: '32px 42px 60px' }}>
        <Outlet />
      </div>
    </div>
  )
}

function LevelSelectorWithEnrollment({ levels, activeLevel, basePath, isAdmin, enrollmentLoading, isEnrolled }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
      {levels.map(level => {
        const enrolled = isAdmin || enrollmentLoading || isEnrolled(level.key)
        return (
          <button
            key={level.key}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              fontSize: '13px',
              background: activeLevel === level.key ? 'var(--color-accent)' : 'rgba(255,255,255,0.85)',
              color: activeLevel === level.key ? 'var(--color-accent-fg)' : 'var(--color-text-2)',
              cursor: enrolled ? 'pointer' : 'not-allowed',
              opacity: enrolled ? 1 : 0.4,
              transition: 'all 0.15s',
              fontFamily: 'inherit',
              outline: 'none',
              appearance: 'none',
              boxShadow: 'none',
            }}
            onClick={e => {
              e.currentTarget.blur()
              if (!enrolled) return
              navigate(`${basePath}/${level.key}/videos`)
            }}
          >
            {level.label}
          </button>
        )
      })}
    </div>
  )
}

const styles = {
  pills: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  pill: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    background: 'rgba(255,255,255,0.85)',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    boxShadow: 'none',
  },
  pillActive: {
    background: 'var(--color-accent)',
    color: 'var(--color-accent-fg)',
    border: 'none',
  },
}
