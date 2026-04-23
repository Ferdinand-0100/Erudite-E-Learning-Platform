import { useState, useEffect } from 'react'
import { FileText, File, Download, FolderOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { recordEvent } from '../lib/progressService'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {materials.map(m => {
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
                {m.file_size_label && <span style={styles.size}>{m.file_size_label}</span>}
              </div>
            </div>
            <div style={styles.downloadBtn}>
              <Download size={16} />
            </div>
          </a>
        )
      })}
    </div>
  )
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)',
    boxShadow: 'var(--shadow-card)',
  },
  cardHover: {
    background: 'rgba(255,255,255,0.85)',
    borderColor: 'var(--color-border-strong)',
    boxShadow: 'var(--shadow-elevated)',
  },
  iconBadge: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-sm)',
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
    borderRadius: '4px',
    letterSpacing: '0.04em',
  },
  size: { fontSize: '12px', color: 'var(--color-text-3)' },
  downloadBtn: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(37,99,235,0.08)',
    color: 'var(--color-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background var(--transition-base)',
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
