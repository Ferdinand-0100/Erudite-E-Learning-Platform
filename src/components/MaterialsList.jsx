import { useState, useEffect } from 'react'
import { FileText, File, Download, FolderOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { recordEvent } from '../lib/progressService'
import FilterBar from './FilterBar'
import { useAppState } from '../lib/AppStateContext'

export function getFileTypeBadgeStyle(ext) {
  const e = (ext || '').toLowerCase()
  if (e === 'pdf')  return { background: '#fee2e2', color: '#991b1b' }
  if (e === 'docx' || e === 'doc') return { background: '#dbeafe', color: '#1e40af' }
  if (e === 'xlsx' || e === 'xls') return { background: '#dcfce7', color: '#166534' }
  if (e === 'pptx' || e === 'ppt') return { background: '#ffedd5', color: '#9a3412' }
  return { background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-2)' }
}

export default function MaterialsList({ courseKey }) {
  const { user } = useAuth()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState(null)

  // Filter state — persisted per courseKey
  const [search, setSearch, clearSearch] = useAppState(`material-search-${courseKey}`, '')
  const [activeDifficulties, setActiveDifficulties, clearDiffs] = useAppState(`material-diffs-${courseKey}`, [])
  const [activeTags, setActiveTags, clearTags] = useAppState(`material-tags-${courseKey}`, [])

  useEffect(() => {
    supabase
      .from('materials')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
      .then(({ data }) => {
        setMaterials(data || [])
        setLoading(false)
      })
  }, [courseKey])

  const availableTags = [...new Set(materials.flatMap(m => m.tags || []))].sort()

  const filtered = materials.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activeDifficulties.length > 0 && !activeDifficulties.includes(m.difficulty)) return false
    if (activeTags.length > 0 && !activeTags.every(t => (m.tags || []).includes(t))) return false
    return true
  })

  function toggleDifficulty(d) {
    setActiveDifficulties(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleTag(t) {
    setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
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

  if (!materials.length) {
    return (
      <div style={styles.emptyState}>
        <FolderOpen size={32} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
        <p style={styles.emptyTitle}>No materials yet</p>
        <p style={styles.emptyDesc}>Written materials for this section haven't been added yet.</p>
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
        placeholder="Search materials…"
      />

      {filtered.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '24px' }}>
          <p style={styles.emptyTitle}>No materials match your filters</p>
          <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(m => {
        const ext = m.file_url?.split('.').pop()?.toLowerCase() || ''
        const badgeStyle = getFileTypeBadgeStyle(ext)
        const isHovered = hoveredCard === m.id
        return (
          <a
            key={m.id}
            href={m.file_url}
            target="_blank"
            rel="noreferrer"
            style={{
              ...styles.card,
              ...(isHovered ? styles.cardHover : {}),
            }}
            onClick={() => recordEvent(supabase, user.id, courseKey, 'material_downloaded', m.title)}
            onMouseEnter={() => setHoveredCard(m.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ ...styles.iconBadge, background: badgeStyle.background }}>
              <FileText size={18} style={{ color: badgeStyle.color }} />
            </div>
            <div style={styles.info}>
              <div style={styles.title}>{m.title}</div>
              <div style={styles.meta}>
                {ext && <span style={{ ...styles.extBadge, ...badgeStyle }}>{ext.toUpperCase()}</span>}
                {m.difficulty && (() => {
                  const dc = { beginner: { background: '#dcfce7', color: '#166534' }, intermediate: { background: '#fef3c7', color: '#92400e' }, advanced: { background: '#fee2e2', color: '#991b1b' } }[m.difficulty?.toLowerCase()] || { background: 'rgba(0,0,0,0.06)', color: 'var(--color-text-2)' }
                  return <span style={{ ...styles.extBadge, ...dc }}>{m.difficulty}</span>
                })()}
                {m.file_size_label && <span style={styles.size}>{m.file_size_label}</span>}
                {(m.tags || []).map(tag => (
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
  meta: { display: 'flex', alignItems: 'center', gap: '8px' },
  extBadge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 6px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    letterSpacing: '0.04em',
  },
  size: { fontSize: '12px', color: 'var(--color-text-3)' },
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
    transition: 'background var(--transition-base), color var(--transition-base)',
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
