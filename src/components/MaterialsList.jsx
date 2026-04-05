import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPE_ICON = { pdf: '📄', docx: '📝', xlsx: '📊', pptx: '📊', default: '📁' }

export default function MaterialsList({ courseKey }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Fetching materials for courseKey:', courseKey)
    supabase
      .from('materials')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
      .then(({ data, error }) => {
        console.log('Materials data:', data, 'error:', error)
        setMaterials(data || [])
        setLoading(false)
      })
  }, [courseKey])

  if (loading) return <p style={styles.muted}>Loading materials…</p>
  if (!materials.length) return <p style={styles.muted}>No materials available yet for this section.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {materials.map(m => {
        const ext = m.file_url?.split('.').pop()?.toLowerCase() || 'default'
        const icon = TYPE_ICON[ext] || TYPE_ICON.default
        return (
          <a
            key={m.id}
            href={m.file_url}
            target="_blank"
            rel="noreferrer"
            style={styles.card}
          >
            <span style={styles.icon}>{icon}</span>
            <div style={styles.info}>
              <div style={styles.title}>{m.title}</div>
              <div style={styles.meta}>{ext.toUpperCase()} · {m.file_size_label}</div>
            </div>
            <span style={styles.download}>↓</span>
          </a>
        )
      })}
    </div>
  )
}

const styles = {
  card: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '13px 16px',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'border-color 0.12s',
  },
  icon: { fontSize: '18px', flexShrink: 0 },
  info: { flex: 1 },
  title: { fontSize: '13.5px', fontWeight: 500, marginBottom: '3px' },
  meta: { fontSize: '12px', color: 'var(--color-text-3)' },
  download: { fontSize: '16px', color: 'var(--color-text-3)' },
  muted: { fontSize: '14px', color: 'var(--color-text-3)', padding: '20px 0' },
}
