import { useParams, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Lock, Video, FileText, HelpCircle, PenLine } from 'lucide-react'
import { COURSE_CONFIG, defaultPath, defaultSubclassPath } from '../lib/courseConfig'
import { useAuth } from '../lib/AuthContext'
import { useEnrollment } from '../lib/EnrollmentContext'
import CourseHeader from '../components/CourseHeader'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'

const TABS = [
  { key: 'videos',    label: 'Tutorial videos',  icon: Video },
  { key: 'materials', label: 'Written materials', icon: FileText },
  { key: 'quiz',      label: 'Quiz system',       icon: HelpCircle },
  { key: 'essay',     label: 'Essay checker',     icon: PenLine },
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
  // Check if student is enrolled in ANY level of this subclass
  const hasAnySubclassEnrollment = isAdmin || enrollmentLoading ||
    subclassConfig.levels.some(l => isEnrolled(course, subclass, l.key))

  if (!isAdmin && !enrollmentLoading && !hasAnySubclassEnrollment) {
    return <Navigate to="/" replace />
  }

  // If enrolled in subclass but not this specific level, redirect to an enrolled level
  if (!isAdmin && !enrollmentLoading && !isEnrolled(course, subclass, level)) {
    const enrolledLevel = subclassConfig.levels.find(l => isEnrolled(course, subclass, l.key))
    if (enrolledLevel) {
      return <Navigate to={`/${course}/${subclass}/${enrolledLevel.key}/videos`} replace />
    }
    return <Navigate to="/" replace />
  }

  if (!isAdmin && enrollmentLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--color-text-3)' }}>Loading…</div>
  }

  return (
    <div>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .course-content { padding: 32px 42px 60px; animation: fadeInUp 0.2s ease; }
        @media (max-width: 768px) { .course-content { padding: 20px 16px 40px; } }
      `}</style>
      <CourseHeader>
        <PageHeader
          title={courseConfig.label}
          breadcrumb={`Courses › ${courseConfig.label}`}
        />
        <div style={styles.pills}>
          {Object.entries(courseConfig.subclasses).map(([key, sub]) => {
            const subEnrolled = isAdmin || enrollmentLoading || enrollments.some(k => k.startsWith(`${course}_${key}_`.toLowerCase()))
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
                  // Navigate to first enrolled level of this subclass
                  const subclassCfg = courseConfig.subclasses[key]
                  const firstEnrolledLevel = subclassCfg?.levels.find(l =>
                    isAdmin || enrollmentLoading || enrollments.includes(`${course}_${key}_${l.key}`.toLowerCase())
                  )
                  const path = firstEnrolledLevel
                    ? `/${course}/${key}/${firstEnrolledLevel.key}/videos`
                    : defaultSubclassPath(course, key)
                  navigate(path)
                }}
              >
                {!subEnrolled && <Lock size={11} style={{ marginRight: '4px', opacity: 0.6 }} />}
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
      <div className="course-content">
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
        const isActive = activeLevel === level.key
        return (
          <button
            key={level.key}
            style={{
              padding: '6px 16px',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-wobbly-sm)',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
              color: isActive ? 'white' : 'var(--color-text-2)',
              boxShadow: isActive ? 'var(--shadow-hover)' : 'none',
              transform: isActive ? 'translate(2px, 2px)' : 'none',
              cursor: enrolled ? 'pointer' : 'not-allowed',
              opacity: enrolled ? 1 : 0.4,
              transition: 'all var(--transition-base)',
              outline: 'none',
              appearance: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onClick={e => {
              e.currentTarget.blur()
              if (!enrolled) return
              navigate(`${basePath}/${level.key}/videos`)
            }}
          >
            {!enrolled && <Lock size={11} style={{ marginRight: '4px', opacity: 0.6 }} />}
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
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    boxShadow: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  pillActive: {
    background: 'var(--color-accent)',
    color: 'white',
    border: '2px solid var(--color-border)',
    boxShadow: 'var(--shadow-hover)',
    transform: 'translate(2px, 2px)',
  },
}
