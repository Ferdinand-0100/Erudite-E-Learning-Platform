import { useParams, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { COURSE_CONFIG, defaultPath, defaultSubclassPath } from '../lib/courseConfig'
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

  return (
    <div>
      <CourseHeader>
        <PageHeader
          title={courseConfig.label}
          breadcrumb={`Courses › ${courseConfig.label}`}
        />
        <div style={styles.pills}>
          {Object.entries(courseConfig.subclasses).map(([key, sub]) => (
            <button
              key={key}
              style={{ ...styles.pill, ...(subclass === key ? styles.pillActive : {}) }}
              onClick={e => { e.currentTarget.blur(); navigate(defaultSubclassPath(course, key)) }}
            >
              {sub.label}
            </button>
          ))}
        </div>
        <LevelSelector
          levels={subclassConfig.levels}
          activeLevel={level}
          basePath={`/${course}/${subclass}`}
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
