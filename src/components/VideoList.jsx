import { useState, useEffect } from 'react'
import { Play, Video, MonitorPlay } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { recordEvent } from '../lib/progressService'
import { normaliseVideoUrl } from '../lib/videoUrl'
import FilterBar from './FilterBar'
import { useAppState } from '../lib/AppStateContext'

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

  // Filter state — persisted per courseKey
  const [search, setSearch, clearSearch] = useAppState(`video-search-${courseKey}`, '')
  const [activeDifficulties, setActiveDifficulties, clearDiffs] = useAppState(`video-diffs-${courseKey}`, [])
  const [activeTags, setActiveTags, clearTags] = useAppState(`video-tags-${courseKey}`, [])

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

  // Derive available tags from loaded videos
  const availableTags = [...new Set(videos.flatMap(v => v.tags || []))].sort()

  // Apply filters
  const filtered = videos.filter(v => {
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activeDifficulties.length > 0 && !activeDifficulties.includes(v.difficulty)) return false
    if (activeTags.length > 0 && !activeTags.every(t => (v.tags || []).includes(t))) return false
    return true
  })

  function toggleDifficulty(d) {
    setActiveDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleTag(t) {
    setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function clearFilters() {
    clearSearch(); clearDiffs(); clearTags()
  }

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
      <FilterBar
        search={search}
        onSearchChange={v => setSearch(v)}
        activeDifficulties={activeDifficulties}
        onDifficultyToggle={toggleDifficulty}
        availableTags={availableTags}
        activeTags={activeTags}
        onTagToggle={toggleTag}
        onClear={clearFilters}
        placeholder="Search videos…"
      />

      {active ? (
        <div style={styles.player}>
          <iframe
            src={normaliseVideoUrl(active.embed_url)}
            title={active.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-wobbly-sm)' }}
          />
        </div>
      ) : (
        <div style={styles.playerPlaceholder}>
          <Video size={36} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-2)', fontWeight: 500 }}>Select a video to start watching</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '24px' }}>
          <p style={styles.emptyTitle}>No videos match your filters</p>
          <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(v => {
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
                    {v.duration_label && <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{v.duration_label}</span>}
                    {v.difficulty && <span style={{ ...styles.badge, ...badgeStyle }}>{v.difficulty}</span>}
                    {(v.tags || []).map(tag => (
                      <span key={tag} style={styles.tagBadge}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  player: {
    width: '100%',
    aspectRatio: '16/9',
    marginBottom: '20px',
    borderRadius: 'var(--radius-wobbly-sm)',
    overflow: 'hidden',
    background: '#000',
    border: '3px solid var(--color-border)',
    boxShadow: 'var(--shadow-elevated)',
  },
  playerPlaceholder: {
    width: '100%',
    aspectRatio: '16/9',
    marginBottom: '20px',
    borderRadius: 'var(--radius-wobbly-sm)',
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
    boxShadow: 'var(--shadow-card)',
  },
  cardActive: {
    borderLeft: '4px solid var(--color-accent)',
    background: 'var(--color-surface-2)',
  },
  cardHover: {
    boxShadow: 'var(--shadow-hover)',
    transform: 'translate(2px, 2px)',
  },
  thumb: {
    width: '72px',
    height: '46px',
    background: 'var(--color-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbActive: {
    background: 'var(--color-surface-2)',
  },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: '13.5px', fontWeight: 500, marginBottom: '5px', color: 'var(--color-text)' },
  meta: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  badge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 8px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
  },
  tagBadge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 8px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    background: 'var(--color-muted)',
    color: 'var(--color-text-2)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-md)',
    boxShadow: 'var(--shadow-card)',
    textAlign: 'center',
  },
  emptyTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' },
  emptyDesc: { fontSize: '13px', color: 'var(--color-text-3)' },
}
