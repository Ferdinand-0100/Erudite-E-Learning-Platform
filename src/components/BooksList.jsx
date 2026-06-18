import { useState, useEffect } from 'react'
import { BookMarked, Download, FolderOpen } from 'lucide-react'
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

function getFileExtBadgeStyle(ext) {
  const e = (ext || '').toLowerCase()
  if (e === 'pdf')  return { background: '#fee2e2', color: '#991b1b' }
  if (e === 'epub') return { background: '#dbeafe', color: '#1e40af' }
  if (e === 'docx' || e === 'doc') return { background: '#ede9fe', color: '#6d28d9' }
  return { background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-2)' }
}

export default function BooksList({ courseKey }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState(null)

  const [search, setSearch, clearSearch] = useAppState(`books-search-${courseKey}`, '')
  const [activeDifficulties, setActiveDifficulties, clearDiffs] = useAppState(`books-diffs-${courseKey}`, [])
  const [activeTags, setActiveTags, clearTags] = useAppState(`books-tags-${courseKey}`, [])
  const [weekFilter, setWeekFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('books')
      .select('*')
      .eq('course_key', courseKey)
      .eq('is_private', false)
      .order('sort_order')
      .then(({ data }) => {
        setBooks(data || [])
        setLoading(false)
      })
  }, [courseKey])

  const availableTags = [...new Set(books.flatMap(b => b.tags || []))].sort()
  const allWeeks = [...new Set(books.map(b => b.week_number ?? 1))].sort((a, b) => a - b)
  // Teachers see all content — no week gating
  const currentWeek = 999

  const weekFiltered = weekFilter === 'all' ? books : books.filter(b => (b.week_number ?? 1) === weekFilter)
  const filtered = weekFiltered.filter(b => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activeDifficulties.length > 0 && !activeDifficulties.includes(b.difficulty)) return false
    if (activeTags.length > 0 && !activeTags.every(t => (b.tags || []).includes(t))) return false
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

  if (!books.length) {
    return (
      <div style={styles.emptyState}>
        <BookMarked size={32} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
        <p style={styles.emptyTitle}>No books yet</p>
        <p style={styles.emptyDesc}>Books for this section haven't been added yet.</p>
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
        placeholder="Search books…"
      />

      {filtered.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '24px' }}>
          <p style={styles.emptyTitle}>No books match your filters</p>
          <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(b => {
            const ext = b.file_url?.split('.').pop()?.toLowerCase() || ''
            const extBadge = getFileExtBadgeStyle(ext)
            const diffBadge = getDifficultyBadgeStyle(b.difficulty)
            const isHovered = hoveredCard === b.id
            return (
              <a
                key={b.id}
                href={b.file_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...styles.card,
                  ...(isHovered ? styles.cardHover : {}),
                }}
                onMouseEnter={() => setHoveredCard(b.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ ...styles.iconBadge, background: '#dbeafe' }}>
                  <BookMarked size={18} style={{ color: '#1e40af' }} />
                </div>
                <div style={styles.info}>
                  <div style={styles.title}>{b.title}</div>
                  <div style={styles.meta}>
                    {ext && <span style={{ ...styles.extBadge, ...extBadge }}>{ext.toUpperCase()}</span>}
                    {b.difficulty && <span style={{ ...styles.extBadge, ...diffBadge }}>{b.difficulty}</span>}
                    {b.file_size_label && <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{b.file_size_label}</span>}
                    {(b.tags || []).map(tag => (
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
