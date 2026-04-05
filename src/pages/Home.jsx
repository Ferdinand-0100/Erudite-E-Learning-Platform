import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const COURSES = [
  { key: 'english', label: 'English', icon: '📖', desc: 'GET · IELTS · PTE', path: '/english/GET/videos', progress: 45 },
  { key: 'mandarin', label: 'Mandarin', icon: '🀄', desc: 'Videos · Materials · Quiz', path: '/mandarin/videos', progress: 20 },
  { key: 'computer', label: 'Computer', icon: '💻', desc: 'Videos · Materials · Quiz', path: '/computer/videos', progress: 62 },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={styles.page}>
      <div style={styles.banner}>
        <h1 style={styles.bannerHeading}>{greeting}, {name} 👋</h1>
        <p style={styles.bannerSub}>You have {COURSES.length} courses enrolled. Keep learning!</p>
      </div>

      <h2 style={styles.sectionHeading}>Your courses</h2>
      <div style={styles.courseGrid}>
        {COURSES.map(c => (
          <div key={c.key} style={styles.courseCard} onClick={() => navigate(c.path)}>
            <div style={styles.courseIcon}>{c.icon}</div>
            <div style={styles.courseTitle}>{c.label}</div>
            <div style={styles.courseDesc}>{c.desc}</div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${c.progress}%` }} />
            </div>
            <div style={styles.progressLabel}>{c.progress}% complete</div>
          </div>
        ))}
      </div>

      <h2 style={styles.sectionHeading}>Recent activity</h2>
      <div style={styles.activityList}>
        {[
          { icon: '📹', text: 'Watched Intro to Python', course: 'Computer', time: '2h ago' },
          { icon: '✅', text: 'Completed quiz in IELTS Writing', course: 'English · IELTS', time: 'Yesterday' },
          { icon: '📄', text: 'Read Mandarin tones PDF', course: 'Mandarin', time: '2 days ago' },
        ].map((item, i) => (
          <div key={i} style={{ ...styles.activityItem, borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
            <span style={styles.activityIcon}>{item.icon}</span>
            <div style={styles.activityBody}>
              <span style={styles.activityText}>{item.text}</span>
              <span style={styles.activityCourse}>{item.course}</span>
            </div>
            <span style={styles.activityTime}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '28px 32px', maxWidth: '860px' },
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
  progressFill: { height: '100%', background: 'var(--color-accent)', borderRadius: '2px', transition: 'width 0.4s' },
  progressLabel: { fontSize: '11px', color: 'var(--color-text-3)', marginTop: '6px' },
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
