import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function VideoList({ courseKey }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)

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

  if (loading) return <p style={styles.muted}>Loading videos…</p>
  if (!videos.length) return <p style={styles.muted}>No videos available yet for this section.</p>

  return (
    <div>
      {active && (
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
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {videos.map(v => (
          <div key={v.id} style={{ ...styles.card, ...(active?.id === v.id ? styles.cardActive : {}) }} onClick={() => setActive(v)}>
            <div style={styles.thumb}>▶</div>
            <div style={styles.info}>
              <div style={styles.title}>{v.title}</div>
              <div style={styles.meta}>{v.duration_label} · {v.difficulty}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  player: { width: '100%', aspectRatio: '16/9', marginBottom: '20px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' },
  card: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    cursor: 'pointer',
    transition: 'border-color 0.12s',
  },
  cardActive: { borderColor: 'var(--color-accent)' },
  thumb: {
    width: '80px', height: '50px',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', flexShrink: 0, color: 'var(--color-text-2)',
  },
  info: { flex: 1 },
  title: { fontSize: '13.5px', fontWeight: 500, marginBottom: '4px' },
  meta: { fontSize: '12px', color: 'var(--color-text-3)' },
  muted: { fontSize: '14px', color: 'var(--color-text-3)', padding: '20px 0' },
}
