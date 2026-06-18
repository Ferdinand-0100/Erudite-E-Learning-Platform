import { useState, useEffect } from 'react'
import { Key, Download, FolderOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FilterBar from './FilterBar'
import WeekFilter from './WeekFilter'
import { useAppState } from '../lib/AppStateContext'

function getDifficultyBadgeStyle(difficulty) {
  const d = (difficulty || '').toLowerCase()
  if (d === 'beginner')     return { background: '#dcfce7', color: '#166534' }
  if (d === 'intermediate') return { background: '#fef3c7', color: '#92400e' }
  if (d === 'advanced')     return { background: '#fee2e2', color: '#991b1b' }
  return { background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-2)' }
}

export default function AnswerKeysList({ courseKey }) {
  const [answerKeys, setAnswerKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState(null)

  const [search, setSearch, clearSearch] = useAppState(`answerkeys-search-${courseKey}`, '')
  const [activeDifficulties, setActiveDifficulties, clearDiffs] = useAppState(`answerkeys-diffs-${courseKey}`, [])
  const [activeTags, setActiveTags, clearTags] = useAppState(`answerkeys-tags-${courseKey}`, [])
  const [weekFilter, setWeekFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('answer_keys')
      .select('*')
      .eq('course_key', courseKey)
      .eq('is_private', false)
      .order('sort_order')
      .then(({ data }) => {
        setAnswerKeys(data || [])
        setLoading(false)
      })
  }, [courseKey])

  const availableTags = [...new Set(answerKeys.flatMap(k => k.tags || []))].sort()
  const allWeeks = [...new Set(answerKeys.map(k => k.week_number ?? 1))].sort((a, b) => a - b)
  // Teachers see all content — no week gating
  const currentWeek = 999

  const weekFiltered = weekFilter === 'all' ? answerKeys : answerKeys.filter(k => (k.week_number ?? 1) === weekFilter)
  const filtered = weekFiltered.filter(k => {
    if (search && !k.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activeDifficulties.length > 0 && !activeDifficulties.includes(k.difficulty)) return false
    if (activeTags.length > 0 && !activeTags.every(t => (k.tags || []).includes(t))) return false
    return true
  })

  function clearFilters() { clearSearch(); clearDiffs(); clearTags() }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '68px' }} />
        ))}
      </div>
    )
  }

  if (!answerKeys.length) {
    return (
      <div style={styles.emptyState}>
        <Key size={32} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
        <p style={styles.emptyTitle}>No answer keys yet</p>
        <p style={styles.emptyDesc}>Answer keys for this section haven't been added yet.</p>
      </div>
    )
  }

  return (
    <div>
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
        placeholder="Search answer keys…"
      />

      {filtered.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '24px' }}>
          <p style={styles.emptyTitle}>No answer keys match your filters</p>
          <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(k => {
            const ext = k.file_url?.split('.').pop()?.toLowerCase() || ''
            const diffBadge = getDifficultyBadgeStyle(k.difficulty)
            const isHovered = hoveredCard === k.id
            return (
              <a
                key={k.id}
                href={k.file_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...styles.card,
                  ...(isHovered ? styles.cardHover : {}),
                }}
                onMouseEnter={() => setHoveredCard(k.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={styles.iconBadge}>
                  <Key size={18} style={{ color: '#92400e' }} />
                </div>
                <div style={styles.info}>
                  <div style={styles.title}>{k.title}</div>
                  <div style={styles.meta}>
                    {ext && (
                      <span style={{ ...styles.extBadge, background: '#fef3c7', color: '#92400e' }}>
                        {ext.toUpperCase()}
                      </span>
                    )}
                    {k.difficulty && <span style={{ ...styles.extBadge, ...diffBadge }}>{k.difficulty}</span>}
                    {k.file_size_label && <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{k.file_size_label}</span>}
                    {(k.tags || []).map(tag => (
                      <span key={tag} style={styles.tagBadge}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={styles.downloadBtn}>
                  <Download size={16} />
                </div>
              </a>
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
    padding: '14px 16px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
    boxShadow: 'var(--shadow-card)',
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
    background: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: '13.5px', fontWeight: 500, marginBottom: '4px', color: 'var(--color-text)' },
  meta: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  extBadge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 6px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    letterSpacing: '0.04em',
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
  downloadBtn: {
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
