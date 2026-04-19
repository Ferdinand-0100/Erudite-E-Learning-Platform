import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { COURSE_CONFIG } from '../lib/courseConfig'

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Given an array of {course_key, percent} rows and the COURSE_CONFIG,
 * returns a map of { [courseKey]: number } where each value is the average
 * percent across all matching rows, rounded to nearest integer.
 * Returns 0 for courses with no matching rows.
 *
 * @param {Array<{course_key: string, percent: number}>} rows
 * @param {object} courseConfig
 * @returns {Record<string, number>}
 */
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

/**
 * Returns a relative time string for a given ISO date string.
 * < 1 hour  → "Just now"
 * < 24 hours → "Xh ago"
 * < 48 hours → "Yesterday"
 * else       → "X days ago"
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`
  if (diffHours < 48) return 'Yesterday'
  return `${Math.floor(diffHours / 24)} days ago`
}

const EVENT_ICONS = {
  video_watched: '📹',
  quiz_completed: '✅',
  material_downloaded: '📄',
}

// ---------------------------------------------------------------------------
// Derive course list from COURSE_CONFIG
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progressMap, setProgressMap] = useState({})
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
      setProgressMap(aggregateProgress(rows, COURSE_CONFIG))
      setActivity(activityRes.data ?? [])
    }).catch(err => {
      console.error('[Home] fetch error:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [user?.id])

  return (
    <div style={styles.page}>
      <div style={styles.banner}>
        <h1 style={styles.bannerHeading}>{greeting}, {name} 👋</h1>
        <p style={styles.bannerSub}>
          You have {Object.keys(COURSE_CONFIG).length} courses enrolled. Keep learning!
        </p>
      </div>

      <h2 style={styles.sectionHeading}>Your courses</h2>
      <div style={styles.courseGrid}>
        {COURSES.map(c => {
          const pct = progressMap[c.key] ?? 0
          return (
            <div
              key={c.key}
              style={{
                ...styles.courseCard,
                ...(hoveredCard === c.key ? {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  borderColor: 'var(--color-border-strong)',
                } : {}),
              }}
              onClick={() => navigate(c.defaultPath)}
              onMouseEnter={() => setHoveredCard(c.key)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.courseIcon}>{c.icon}</div>
              <div style={styles.courseTitle}>{c.label}</div>
              <div style={styles.courseDesc}>{c.desc}</div>
              {loading ? (
                <div style={styles.progressBarPlaceholder} />
              ) : (
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                </div>
              )}
              <div style={styles.progressLabel}>
                {loading ? '' : `${pct}% complete`}
              </div>
            </div>
          )
        })}
      </div>

      <h2 style={styles.sectionHeading}>Recent activity</h2>
      <div style={styles.activityList}>
        {loading ? (
          <div style={styles.activityItem}>
            <span style={styles.activityTime}>Loading...</span>
          </div>
        ) : activity.length === 0 ? (
          <div style={styles.activityItem}>
            <span style={styles.activityText}>No recent activity yet. Start learning!</span>
          </div>
        ) : (
          activity.map((item, i) => (
            <div
              key={item.id ?? i}
              style={{
                ...styles.activityItem,
                borderBottom: i < activity.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span style={styles.activityIcon}>{EVENT_ICONS[item.event_type] ?? '📌'}</span>
              <div style={styles.activityBody}>
                <span style={styles.activityText}>{item.label}</span>
                <span style={styles.activityCourse}>{item.course_key}</span>
              </div>
              <span style={styles.activityTime}>{relativeTime(item.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '34px 32px', maxWidth: '860px' },
  banner: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '22px 26px',
    marginBottom: '28px',
  },
  bannerHeading: { fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', marginBottom: '5px' },
  bannerSub: { fontSize: '14px', color: 'var(--color-text-2)' },
  sectionHeading: { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '28px' },
  courseCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  courseIcon: { fontSize: '24px', marginBottom: '10px' },
  courseTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '4px' },
  courseDesc: { fontSize: '12px', color: 'var(--color-text-2)', marginBottom: '14px' },
  progressBar: { height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' },
  progressBarPlaceholder: { height: '4px', background: '#e0e0e0', borderRadius: '2px' },
  progressFill: { height: '100%', background: 'var(--color-accent)', borderRadius: '2px', transition: 'width 0.4s' },
  progressLabel: { fontSize: '11px', color: 'var(--color-text-3)', marginTop: '6px', minHeight: '14px' },
  activityList: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  activityItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' },
  activityIcon: { fontSize: '16px', flexShrink: 0 },
  activityBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  activityText: { fontSize: '13px', fontWeight: 500 },
  activityCourse: { fontSize: '11px', color: 'var(--color-text-3)' },
  activityTime: { fontSize: '11px', color: 'var(--color-text-3)', flexShrink: 0 },
}
