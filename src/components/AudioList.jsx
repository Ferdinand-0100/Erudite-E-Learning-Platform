import { useState, useEffect, useRef } from 'react'
import { Headphones, Play, Pause, FolderOpen, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FilterBar from './FilterBar'
import WeekFilter from './WeekFilter'
import { useAppState } from '../lib/AppStateContext'
import { useAuth } from '../lib/AuthContext'

function getDifficultyBadgeStyle(difficulty) {
  const d = (difficulty || '').toLowerCase()
  if (d === 'beginner')     return { background: '#dcfce7', color: '#166534' }
  if (d === 'intermediate') return { background: '#fef3c7', color: '#92400e' }
  if (d === 'advanced')     return { background: '#fee2e2', color: '#991b1b' }
  return { background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-2)' }
}

export default function AudioList({ courseKey }) {
  const { profile } = useAuth()
  const [audioFiles, setAudioFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)
  const audioRef = useRef(null)

  const [search, setSearch, clearSearch] = useAppState(`audio-search-${courseKey}`, '')
  const [activeDifficulties, setActiveDifficulties, clearDiffs] = useAppState(`audio-diffs-${courseKey}`, [])
  const [activeTags, setActiveTags, clearTags] = useAppState(`audio-tags-${courseKey}`, [])
  const [weekFilter, setWeekFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('audio_files')
      .select('*')
      .eq('course_key', courseKey)
      .eq('is_private', false)
      .order('sort_order')
      .then(({ data }) => {
        setAudioFiles(data || [])
        setLoading(false)
      })
  }, [courseKey])

  const availableTags = [...new Set(audioFiles.flatMap(a => a.tags || []))].sort()
  const allWeeks = [...new Set(audioFiles.map(a => a.week_number ?? 1))].sort((a, b) => a - b)

  // Teachers don't have week-gating — they see all content
  const currentWeek = 999

  const weekFiltered = weekFilter === 'all' ? audioFiles : audioFiles.filter(a => (a.week_number ?? 1) === weekFilter)
  const filtered = weekFiltered.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activeDifficulties.length > 0 && !activeDifficulties.includes(a.difficulty)) return false
    if (activeTags.length > 0 && !activeTags.every(t => (a.tags || []).includes(t))) return false
    return true
  })

  function clearFilters() { clearSearch(); clearDiffs(); clearTags() }

  function handlePlay(audio) {
    if (playingId === audio.id) {
      setPlayingId(null)
      if (audioRef.current) audioRef.current.pause()
      return
    }
    setPlayingId(audio.id)
    if (audioRef.current) {
      audioRef.current.src = audio.file_url
      audioRef.current.play().catch(() => {})
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '68px' }} />
        ))}
      </div>
    )
  }

  if (!audioFiles.length) {
    return (
      <div style={styles.emptyState}>
        <Headphones size={32} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
        <p style={styles.emptyTitle}>No audio files yet</p>
        <p style={styles.emptyDesc}>Audio files for this section haven't been added yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} style={{ display: 'none' }} />

      <WeekFilter
        weeks={allWeeks}
        selected={weekFilter}
        onChange={setWeekFilter}
        currentWeek={currentWeek}
      />

      <FilterBar
        search={search}
        onSearchChange={v => setSearch(v)}
        activeDifficulties={activeDifficulties}
        onDifficultyToggle={d => setActiveDifficulties(prev => prev.includes(d) ? [] : [d])}
        availableTags={availableTags}
        activeTags={activeTags}
        onTagToggle={t => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
        onClear={clearFilters}
        placeholder="Search audio files…"
      />

      {filtered.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '24px' }}>
          <p style={styles.emptyTitle}>No audio files match your filters</p>
          <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(a => {
            const isPlaying = playingId === a.id
            const isHovered = hoveredCard === a.id
            const badgeStyle = getDifficultyBadgeStyle(a.difficulty)
            return (
              <div
                key={a.id}
                style={{
                  ...styles.card,
                  ...(isPlaying ? styles.cardActive : {}),
                  ...(isHovered && !isPlaying ? styles.cardHover : {}),
                  cursor: 'pointer',
                }}
                onClick={() => handlePlay(a)}
                onMouseEnter={() => setHoveredCard(a.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ ...styles.iconBadge, background: isPlaying ? 'var(--color-surface-2)' : 'var(--color-muted)' }}>
                  {isPlaying
                    ? <Pause size={18} style={{ color: 'var(--color-accent)' }} />
                    : <Play size={18} style={{ color: 'var(--color-text-3)' }} />
                  }
                </div>
                <div style={styles.info}>
                  <div style={styles.title}>{a.title}</div>
                  <div style={styles.meta}>
                    {a.duration_label && <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{a.duration_label}</span>}
                    {a.difficulty && <span style={{ ...styles.badge, ...badgeStyle }}>{a.difficulty}</span>}
                    {(a.tags || []).map(tag => (
                      <span key={tag} style={styles.tagBadge}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ ...styles.playBtn, ...(isPlaying ? styles.playBtnActive : {}) }}>
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
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
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    padding: '12px 14px',
    transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
    boxShadow: 'var(--shadow-card)',
  },
  cardActive: {
    borderLeft: '4px solid var(--color-secondary)',
    background: 'var(--color-surface-2)',
  },
  cardHover: {
    boxShadow: 'var(--shadow-hover)',
    transform: 'translate(2px, 2px)',
  },
  iconBadge: {
    width: '40px',
    height: '40px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  playBtn: {
    width: '32px',
    height: '32px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playBtnActive: {
    background: 'var(--color-secondary)',
    color: '#fff',
    borderColor: 'var(--color-secondary)',
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
