import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, CheckCircle, FileText, Pin, BookOpen, PenLine } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useEnrollment } from '../lib/EnrollmentContext'
import { supabase } from '../lib/supabase'
import { COURSE_CONFIG } from '../lib/courseConfig'

export function aggregateProgress(rows, courseConfig) {
  const result = {}
  for (const courseKey of Object.keys(courseConfig)) {
    const matching = rows.filter(r => r.course_key.startsWith(`${courseKey}_`))
    if (matching.length === 0) {
      result[courseKey] = 0
    } else {
      const sum = matching.reduce((acc, r) => acc + r.percent, 0)
      result[courseKey] = Math.round(sum / matching.length)
    }
  }
  return result
}

export function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`
  if (diffHours < 48) return 'Yesterday'
  return `${Math.floor(diffHours / 24)} days ago`
}

const EVENT_ICONS = {
  video_watched:       Video,
  quiz_completed:      CheckCircle,
  material_downloaded: FileText,
  essay_submitted:     PenLine,
}

const COURSES = Object.entries(COURSE_CONFIG).map(([key, cfg]) => {
  const subclassLabels = Object.values(cfg.subclasses).map(s => s.label).join(' · ')
  const defaultSub = cfg.defaultSubclass
  const defaultLevel = cfg.subclasses[defaultSub].defaultLevel
  return {
    key,
    label: cfg.label,
    icon: cfg.icon,
    desc: subclassLabels,
    defaultPath: `/${key}/${defaultSub}/${defaultLevel}/videos`,
  }
})

export default function Home() {
  const { user } = useAuth()
  const { enrollments, loading: enrollmentLoading } = useEnrollment()
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progressMap, setProgressMap] = useState({})
  const [displayProgress, setDisplayProgress] = useState({})
  const [activity, setActivity] = useState([])

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([
      supabase.from('progress').select('course_key, percent').eq('student_id', user.id),
      supabase
        .from('activity_log')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([progressRes, activityRes]) => {
      const rows = progressRes.data ?? []
      const map = aggregateProgress(rows, COURSE_CONFIG)
      setProgressMap(map)
      setActivity(activityRes.data ?? [])
      setTimeout(() => setDisplayProgress(map), 50)
    }).catch(err => {
      console.error('[Home] fetch error:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [user?.id])

  return (
    <div style={styles.page} className="home-page">
      <style>{`
        @media (max-width: 768px) {
          .home-page { padding: 20px 16px !important; }
          .course-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .course-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Banner ── */}
      <div style={styles.banner}>
        <div>
          <h1 style={styles.bannerHeading}>{greeting}, {name}!</h1>
          <p style={styles.bannerSub}>Ready to continue your learning journey?</p>
        </div>
        <div style={styles.bannerStat}>
          <BookOpen size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={styles.bannerStatText}>{Object.keys(COURSE_CONFIG).length} courses available</span>
        </div>
      </div>

      {/* ── Course grid ── */}
      <h2 style={styles.sectionHeading}>Your courses</h2>
      <div style={styles.courseGrid} className="course-grid">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '160px' }} />
          ))
        ) : (
          COURSES.map(c => {
            const pct = displayProgress[c.key] ?? 0
            const rawPct = progressMap[c.key] ?? 0
            const isActive = enrollmentLoading || enrollments.some(k => k.startsWith(`${c.key}_`.toLowerCase()))
            const isHovered = hoveredCard === c.key && isActive
            return (
              <div
                key={c.key}
                style={{
                  ...styles.courseCard,
                  ...(isHovered ? styles.courseCardHover : {}),
                  ...(!isActive ? styles.courseCardInactive : {}),
                }}
                onClick={() => isActive && navigate(c.defaultPath)}
                onMouseEnter={() => isActive && setHoveredCard(c.key)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={styles.courseIconWrap}>
                  <span style={styles.courseIcon}>{c.icon}</span>
                </div>
                <div style={styles.courseTitle}>{c.label}</div>
                <div style={styles.courseDesc}>{c.desc}</div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                </div>
                <div style={styles.progressLabel}>
                  {!enrollmentLoading && !isActive
                    ? 'Not enrolled'
                    : `${rawPct}% complete`}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Activity feed ── */}
      <h2 style={styles.sectionHeading}>Recent activity</h2>
      <div style={styles.activityList}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '52px', margin: '8px 12px' }} />
          ))
        ) : activity.length === 0 ? (
          <div style={styles.activityItem}>
            <span style={styles.activityText}>No recent activity yet. Start learning!</span>
          </div>
        ) : (
          activity.map((item, i) => {
            const Icon = EVENT_ICONS[item.event_type] ?? Pin
            return (
              <div
                key={item.id ?? i}
                style={{
                  ...styles.activityItem,
                  borderBottom: i < activity.length - 1
                    ? '1px dashed var(--color-border-light)'
                    : 'none',
                }}
              >
                <span style={styles.activityIconWrap}>
                  <Icon size={16} />
                </span>
                <div style={styles.activityBody}>
                  <span style={styles.activityText}>{item.label}</span>
                  <span style={styles.activityCourse}>{item.course_key}</span>
                </div>
                <span style={styles.activityTime}>{relativeTime(item.created_at)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '34px 32px',
    maxWidth: '900px',
  },
  banner: {
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    boxShadow: 'var(--shadow-elevated)',
    padding: '24px 28px',
    marginBottom: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    transform: 'rotate(-1deg)',
  },
  bannerHeading: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--font-size-display)',
    fontWeight: 700,
    marginBottom: '6px',
    color: 'var(--color-text)',
  },
  bannerSub: {
    fontSize: '14px',
    color: 'var(--color-text-2)',
  },
  bannerStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--color-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    padding: '8px 14px',
  },
  bannerStatText: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  sectionHeading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text-2)',
    marginBottom: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  courseCard: {
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-md)',
    boxShadow: 'var(--shadow-card)',
    padding: '20px',
    cursor: 'pointer',
    transition: 'transform var(--transition-slow), box-shadow var(--transition-slow)',
  },
  courseCardHover: {
    boxShadow: 'var(--shadow-hover)',
    transform: 'translateY(-2px) rotate(0.5deg)',
  },
  courseCardInactive: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  courseIconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-wobbly-sm)',
    background: 'var(--color-surface-2)',
    border: '2px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  courseIcon: { fontSize: '22px' },
  courseTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '4px',
    color: 'var(--color-text)',
  },
  courseDesc: {
    fontSize: '12px',
    color: 'var(--color-text-2)',
    marginBottom: '16px',
  },
  progressBar: {
    height: '8px',
    background: 'var(--color-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: 'var(--radius-wobbly-sm)',
    transition: 'width var(--transition-fill)',
  },
  progressLabel: {
    fontSize: '11px',
    color: 'var(--color-text-3)',
    marginTop: '6px',
  },
  activityList: {
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-md)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
  },
  activityIconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-wobbly-sm)',
    border: '2px solid var(--color-border)',
    background: 'var(--color-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text)',
    flexShrink: 0,
  },
  activityBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  activityText: { fontSize: '13px', fontWeight: 500 },
  activityCourse: { fontSize: '11px', color: 'var(--color-text-3)' },
  activityTime: { fontSize: '11px', color: 'var(--color-text-3)', flexShrink: 0 },
}
