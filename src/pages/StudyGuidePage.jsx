import { useState, useEffect } from 'react'
import { ArrowLeft, Video, FileText, HelpCircle, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import VideoList from '../components/VideoList'
import MaterialsList from '../components/MaterialsList'
import QuizEngine from '../components/QuizEngine'

const TYPE_ICONS = { video: Video, material: FileText, quiz_package: HelpCircle }
const TYPE_LABELS = { video: 'Video', material: 'Material', quiz_package: 'Quiz' }
const TYPE_COLORS = {
  video:        { bg: 'rgba(37,99,235,0.1)',  color: 'var(--color-accent)' },
  material:     { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  quiz_package: { bg: 'rgba(249,115,22,0.1)', color: '#ea580c' },
}

export default function StudyGuidePage() {
  const { user } = useAuth()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [activeItem, setActiveItem] = useState(null) // { item, detail }

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('study_guides')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[StudyGuidePage] fetch error:', error)
        setGuides(data || [])
        setLoading(false)
      })
  }, [user?.id])

  async function openGuide(guide) {
    setSelectedGuide(guide)
    setActiveItem(null)
    setItemsLoading(true)
    const { data } = await supabase
      .from('study_guide_items')
      .select('*')
      .eq('guide_id', guide.id)
      .order('sort_order')

    const resolved = await Promise.all((data || []).map(async item => {
      let detail = null
      if (item.item_type === 'video') {
        const { data: d } = await supabase.from('videos').select('*').eq('id', item.item_id).single()
        detail = d
      } else if (item.item_type === 'material') {
        const { data: d } = await supabase.from('materials').select('*').eq('id', item.item_id).single()
        detail = d
      } else if (item.item_type === 'quiz_package') {
        const { data: d } = await supabase.from('quiz_packages').select('*').eq('id', item.item_id).single()
        detail = d
      }
      return { ...item, detail }
    }))
    setItems(resolved)
    setItemsLoading(false)
  }

  // ── Active item view ──────────────────────────────────────

  if (activeItem) {
    const { item, detail } = activeItem
    return (
      <div style={styles.page}>
        <button onClick={() => setActiveItem(null)} style={styles.backBtn}>
          <ArrowLeft size={14} style={{ marginRight: 6 }} />Back to guide
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, marginTop: 16 }}>{detail?.title}</h2>
        {item.item_type === 'video' && detail && (
          <div>
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'hidden', background: '#000', marginBottom: 16, border: '3px solid var(--color-border)', boxShadow: 'var(--shadow-elevated)' }}>
              <iframe src={detail.embed_url} title={detail.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        )}
        {item.item_type === 'material' && detail && (
          <div style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-wobbly-sm)', border: '2px solid var(--color-border)', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} style={{ color: '#059669' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{detail.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{detail.file_size_label}</div>
            </div>
            <a href={detail.file_url} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: 'var(--shadow-hover)' }}>
              Download
            </a>
          </div>
        )}
        {item.item_type === 'quiz_package' && detail && (
          <QuizEngine courseKey={detail.course_key} forcePkg={detail} />
        )}
      </div>
    )
  }

  // ── Guide items view ──────────────────────────────────────

  if (selectedGuide) {
    return (
      <div style={styles.page}>
        <button onClick={() => setSelectedGuide(null)} style={styles.backBtn}>
          <ArrowLeft size={14} style={{ marginRight: 6 }} />Back to study guides
        </button>
        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selectedGuide.title}</h1>
          {selectedGuide.date_label && (
            <div style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 500 }}> {selectedGuide.date_label}</div>
          )}
        </div>

        {itemsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 68 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
            <BookOpen size={32} style={{ color: 'var(--color-text-3)', marginBottom: 10 }} />
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No items yet</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Your teacher hasn't added any items to this guide yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => {
              const Icon = TYPE_ICONS[item.item_type] || FileText
              const tc = TYPE_COLORS[item.item_type] || TYPE_COLORS.material
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItem({ item, detail: item.detail })}
                  style={{
                    ...styles.card,
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer',
                    transition: 'transform var(--transition-slow), box-shadow var(--transition-slow)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-wobbly-sm)', border: '2px solid var(--color-border)', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color: tc.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{item.detail?.title || 'Unknown item'}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{TYPE_LABELS[item.item_type]}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>→</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Guide list ────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.banner}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-display)', fontWeight: 700, marginBottom: 6 }}>Study Guides</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)' }}>Personalised learning packages from your teacher</p>
        </div>
        <BookOpen size={32} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : guides.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <BookOpen size={32} style={{ color: 'var(--color-text-3)', marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No study guides yet</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Your teacher hasn't assigned any study guides to you yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {guides.map(guide => (
            <div
              key={guide.id}
              onClick={() => openGuide(guide)}
              style={{
                ...styles.card,
                cursor: 'pointer',
                transition: 'transform var(--transition-slow), box-shadow var(--transition-slow)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{guide.title}</div>
              {guide.date_label && (
                <div style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 500, marginBottom: 4 }}> {guide.date_label}</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 'auto' }}>Tap to open →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: '34px 32px', maxWidth: 860 },
  banner: {
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    boxShadow: 'var(--shadow-elevated)',
    padding: '24px 28px',
    marginBottom: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transform: 'rotate(-0.5deg)',
  },
  card: {
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-md)',
    padding: '18px 20px',
    boxShadow: 'var(--shadow-card)',
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', padding: '6px 14px',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-2)',
    fontFamily: 'var(--font-body)',
    transition: 'background var(--transition-base)',
  },
}
