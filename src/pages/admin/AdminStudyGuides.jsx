import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Video, FileText, HelpCircle, Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const inputStyle = { width: '100%', padding: '8px 10px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', background: 'var(--color-surface)', boxSizing: 'border-box', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--color-text-2)' }
const btnPrimary = { padding: '8px 16px', background: 'var(--color-accent)', color: '#fff', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }
const btnSecondary = { padding: '8px 16px', background: 'var(--color-surface)', color: 'var(--color-text-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }
const btnDanger = { padding: '6px 10px', background: 'var(--color-surface)', color: 'var(--color-danger)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }

const TYPE_ICONS = { video: Video, material: FileText, quiz_package: HelpCircle }
const TYPE_LABELS = { video: 'Video', material: 'Material', quiz_package: 'Quiz Package' }
const TYPE_COLORS = { video: { bg: '#dbeafe', color: '#1e40af' }, material: { bg: '#dcfce7', color: '#166534' }, quiz_package: { bg: '#fef3c7', color: '#92400e' } }

export default function AdminStudyGuides() {
  const [guides, setGuides] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)

  // Guide form
  const [guideForm, setGuideForm] = useState({ title: '', student_id: '', date_label: '' })
  const [editingGuideId, setEditingGuideId] = useState(null)
  const [guideSubmitting, setGuideSubmitting] = useState(false)

  // Items
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)

  // Item picker
  const [showPicker, setShowPicker] = useState(false)
  const [pickerType, setPickerType] = useState('video')
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerResults, setPickerResults] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)

  useEffect(() => { fetchGuides(); fetchStudents() }, [])

  async function fetchGuides() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('study_guides')
      .select('*, student:profiles!study_guides_student_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    setGuides(data || [])
    setLoading(false)
  }

  async function fetchStudents() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .neq('role', 'admin')
      .order('full_name')
    setStudents(data || [])
  }

  async function fetchItems(guideId) {
    setItemsLoading(true)
    const { data } = await supabase
      .from('study_guide_items')
      .select('*')
      .eq('guide_id', guideId)
      .order('sort_order')
    // Resolve item details
    const resolved = await Promise.all((data || []).map(async item => {
      let detail = null
      if (item.item_type === 'video') {
        const { data: d } = await supabase.from('videos').select('title, course_key').eq('id', item.item_id).single()
        detail = d
      } else if (item.item_type === 'material') {
        const { data: d } = await supabase.from('materials').select('title, course_key').eq('id', item.item_id).single()
        detail = d
      } else if (item.item_type === 'quiz_package') {
        const { data: d } = await supabase.from('quiz_packages').select('title, course_key').eq('id', item.item_id).single()
        detail = d
      }
      return { ...item, detail }
    }))
    setItems(resolved)
    setItemsLoading(false)
  }

  async function handleGuideSubmit(e) {
    e.preventDefault()
    if (!guideForm.title.trim() || !guideForm.student_id) { setError('Title and student are required'); return }
    setGuideSubmitting(true)
    setError(null)
    const payload = { title: guideForm.title.trim(), student_id: guideForm.student_id, date_label: guideForm.date_label.trim() || null }
    let err
    if (editingGuideId) { ;({ error: err } = await supabase.from('study_guides').update(payload).eq('id', editingGuideId)) }
    else { ;({ error: err } = await supabase.from('study_guides').insert(payload)) }
    if (err) setError(err.message)
    else { setEditingGuideId(null); setGuideForm({ title: '', student_id: '', date_label: '' }); await fetchGuides() }
    setGuideSubmitting(false)
  }

  async function handleDeleteGuide(id) {
    if (!window.confirm('Delete this study guide and all its items?')) return
    const { error: err } = await supabase.from('study_guides').delete().eq('id', id)
    if (err) setError(err.message)
    else await fetchGuides()
  }

  function openGuide(guide) {
    setSelectedGuide(guide)
    setShowPicker(false)
    fetchItems(guide.id)
  }

  async function handleRemoveItem(itemId) {
    await supabase.from('study_guide_items').delete().eq('id', itemId)
    fetchItems(selectedGuide.id)
  }

  // ── Picker ────────────────────────────────────────────────

  async function searchItems() {
    setPickerLoading(true)
    let query
    if (pickerType === 'video') query = supabase.from('videos').select('id, title, course_key, difficulty').ilike('title', `%${pickerSearch}%`).limit(20)
    else if (pickerType === 'material') query = supabase.from('materials').select('id, title, course_key, difficulty').ilike('title', `%${pickerSearch}%`).limit(20)
    else query = supabase.from('quiz_packages').select('id, title, course_key, difficulty').ilike('title', `%${pickerSearch}%`).limit(20)
    const { data, error: err } = await query
    if (err) console.error('[StudyGuides] picker search error:', err)
    setPickerResults(data || [])
    setPickerLoading(false)
  }

  useEffect(() => {
    if (showPicker) searchItems()
  }, [pickerType, pickerSearch, showPicker])

  async function addItem(item) {
    const alreadyAdded = items.some(i => i.item_id === item.id && i.item_type === pickerType)
    if (alreadyAdded) return
    const { error: err } = await supabase.from('study_guide_items').insert({
      guide_id: selectedGuide.id,
      item_type: pickerType,
      item_id: item.id,
      sort_order: items.length,
    })
    if (err) { console.error('[StudyGuides] addItem error:', err); setError(err.message); return }
    fetchItems(selectedGuide.id)
  }

  // ── RENDER: Guide drill-in ────────────────────────────────

  if (selectedGuide) {
    const student = students.find(s => s.id === selectedGuide.student_id)
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSelectedGuide(null)} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedGuide.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: 0 }}>
              {student?.full_name || student?.email || 'Unknown student'}
              {selectedGuide.date_label && ` · ${selectedGuide.date_label}`}
            </p>
          </div>
        </div>

        {/* Add items button */}
        <div style={{ marginBottom: 20 }}>
          {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 14 }}>{error}</div>}
          <button style={{ ...btnPrimary, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowPicker(v => !v)}>
            <Plus size={14} /> {showPicker ? 'Close picker' : 'Add items'}
          </button>
        </div>

        {/* Item picker */}
        {showPicker && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid rgba(0,0,0,0.3)', borderRadius: 'var(--radius-wobbly-sm)', padding: 16, marginBottom: 20, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['video', 'material', 'quiz_package'].map(type => {
                const Icon = TYPE_ICONS[type]
                return (
                  <button key={type} type="button" onClick={() => { setPickerType(type); setPickerSearch('') }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: pickerType === type ? 'var(--color-accent)' : 'var(--color-surface-2)', color: pickerType === type ? 'white' : 'var(--color-text-2)', fontFamily: 'inherit' }}>
                    <Icon size={13} /> {TYPE_LABELS[type]}s
                  </button>
                )
              })}
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
              <input style={{ ...inputStyle, paddingLeft: 30 }} value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder={`Search ${TYPE_LABELS[pickerType].toLowerCase()}s…`} />
            </div>
            {pickerLoading ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Searching…</p>
            ) : pickerResults.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>No results found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {pickerResults.map(item => {
                  const alreadyAdded = items.some(i => i.item_id === item.id && i.item_type === pickerType)
                  const tc = TYPE_COLORS[pickerType]
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: alreadyAdded ? 'var(--color-surface-2)' : 'white' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{item.course_key} {item.difficulty && `· ${item.difficulty}`}</div>
                      </div>
                      <button onClick={() => addItem(item)} disabled={alreadyAdded} style={{ padding: '4px 12px', background: alreadyAdded ? 'var(--color-surface-2)' : 'var(--color-accent)', color: alreadyAdded ? 'var(--color-text-3)' : 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: alreadyAdded ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                        {alreadyAdded ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Items list */}
        {itemsLoading ? (
          <p style={{ color: 'var(--color-text-2)', fontSize: 14 }}>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No items yet. Click "Add items" to get started.</p>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {items.map((item, idx) => {
              const Icon = TYPE_ICONS[item.item_type] || FileText
              const tc = TYPE_COLORS[item.item_type] || TYPE_COLORS.material
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: idx < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} style={{ color: tc.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.detail?.title || 'Unknown item'}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{TYPE_LABELS[item.item_type]} · {item.detail?.course_key}</div>
                  </div>
                  <button style={btnDanger} onClick={() => handleRemoveItem(item.id)} title="Remove"><Trash2 size={13} /></button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── RENDER: Guide list ────────────────────────────────────

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Study Guides</h1>

      {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 14 }}>{error}</div>}

      {/* Create/edit form */}
      <form onSubmit={handleGuideSubmit} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{editingGuideId ? 'Edit Study Guide' : 'Create Study Guide'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={guideForm.title} onChange={e => setGuideForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Week 3 Grammar Review" />
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input style={inputStyle} value={guideForm.date_label} onChange={e => setGuideForm(f => ({ ...f, date_label: e.target.value }))} placeholder="e.g. May 10 – May 16" />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Assign to student *</label>
          <select style={inputStyle} value={guideForm.student_id} onChange={e => setGuideForm(f => ({ ...f, student_id: e.target.value }))} required>
            <option value="">Select a student…</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={guideSubmitting}>{editingGuideId ? 'Update Guide' : 'Create Guide'}</button>
          {editingGuideId && <button type="button" style={btnSecondary} onClick={() => { setEditingGuideId(null); setGuideForm({ title: '', student_id: '', date_label: '' }) }}>Cancel</button>}
        </div>
      </form>

      {/* Guide list */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
      ) : guides.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No study guides yet. Create your first one above.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {guides.map(guide => (
            <div key={guide.id} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 18, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{guide.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                👤 {guide.student?.full_name || guide.student?.email || 'Unknown'}
              </div>
              {guide.date_label && (
                <div style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 500 }}>📅 {guide.date_label}</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button style={{ ...btnPrimary, flex: 1, fontSize: 13, padding: '7px 12px' }} onClick={() => openGuide(guide)}>Open</button>
                <button style={{ ...btnSecondary, padding: '7px 10px', fontSize: 13 }} onClick={() => { setEditingGuideId(guide.id); setGuideForm({ title: guide.title, student_id: guide.student_id, date_label: guide.date_label || '' }) }}>Edit</button>
                <button style={{ ...btnDanger, padding: '7px 10px' }} onClick={() => handleDeleteGuide(guide.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
