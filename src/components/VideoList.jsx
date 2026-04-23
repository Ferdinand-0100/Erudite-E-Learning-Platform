import { useState, useEffect } from 'react'
import { Play, Video, MonitorPlay } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { recordEvent } from '../lib/progressService'

export function getDifficultyBadgeStyle(difficulty) {
  const d = (difficulty || '').toLowerCase()
  if (d === 'beginner')     return { background: '#dcfce7', color: '#166534' }
  if (d === 'intermediate') return { background: '#fef3c7', color: '#92400e' }
  if (d === 'advanced')     return { background: '#fee2e2', color: '#991b1b' }
  return { background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-2)' }
}

export default function VideoList({ courseKey }) {
  const { user } = useAuth()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    supabase
      .from('videos')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
      .then(({ data }) => {
        setVideos(data || [])
        setLoading(false)
      })
  }, [courseKey])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '74px' }} />
        ))}
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div style={styles.emptyState}>
        <MonitorPlay size={32} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
        <p style={styles.emptyTitle}>No videos yet</p>
        <p style={styles.emptyDesc}>Videos for this section haven't been added yet.</p>
      </div>
    )
  }

  return (
    <div>
      {active ? (
        <div style={styles.player}>
          <iframe
            src={active.embed_url}
            title={active.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }}
          />
        </div>
      ) : (
        <div style={styles.playerPlaceholder}>
          <Video size={36} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-2)', fontWeight: 500 }}>Select a video to start watching</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {videos.map(v => {
          const isActiveCard = active?.id === v.id
          const isHovered = hoveredCard === v.id
          const badgeStyle = getDifficultyBadgeStyle(v.difficulty)
          return (
            <div
              key={v.id}
              style={{
                ...styles.card,
                ...(isActiveCard ? styles.cardActive : {}),
                ...(isHovered && !isActiveCard ? styles.cardHover : {}),
              }}
              onClick={() => {
                recordEvent(supabase, user.id, courseKey, 'video_watched', v.title)
                setActive(v)
              }}
              onMouseEnter={() => setHoveredCard(v.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{ ...styles.thumb, ...(isActiveCard ? styles.thumbActive : {}) }}>
                <Play size={16} style={{ color: isActiveCard ? 'var(--color-accent)' : 'var(--color-text-3)' }} />
              </div>
              <div style={styles.info}>
                <div style={styles.title}>{v.title}</div>
                <div style={styles.meta}>
                  {v.duration_label && <span>{v.duration_label}</span>}
                  {v.difficulty && (
                    <span style={{ ...styles.badge, ...badgeStyle }}>
                      {v.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  player: {
    width: '100%',
    aspectRatio: '16/9',
    marginBottom: '20px',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    background: '#000',
    boxShadow: 'var(--shadow-elevated)',
  },
  playerPlaceholder: {
    width: '100%',
    aspectRatio: '16/9',
    marginBottom: '20px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)',
    boxShadow: 'var(--shadow-card)',
  },
  cardActive: {
    borderLeft: '3px solid var(--color-accent)',
    background: 'rgba(37,99,235,0.06)',
    borderColor: 'var(--color-accent)',
  },
  cardHover: {
    transform: 'translateY(-1px)',
    boxShadow: 'var(--shadow-elevated)',
    borderColor: 'var(--color-border-strong)',
  },
  thumb: {
    width: '72px',
    height: '46px',
    background: 'rgba(0,0,0,0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbActive: {
    background: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.2)',
  },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: '13.5px', fontWeight: 500, marginBottom: '5px', color: 'var(--color-text)' },
  meta: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  badge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: '999px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    textAlign: 'center',
  },
  emptyTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' },
  emptyDesc: { fontSize: '13px', color: 'var(--color-text-3)' },
}
