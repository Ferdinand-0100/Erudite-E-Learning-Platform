import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import SortableRow from '../../components/admin/SortableRow'
import { useAppState } from '../../lib/AppStateContext'
import { useDraggableList } from '../../lib/useDraggableList'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyForm = { title: '', prompt: '', min_words: 150, max_words: 500, time_limit_minutes: '', essay_type: 'general', is_private: false, week_number: 1 }

// Essay type options — maps to the edge function rubric keys
const ESSAY_TYPE_OPTIONS = [
  { value: 'general',              label: 'General English (GET)',                    short: 'GET' },
  { value: 'ielts_task1_academic', label: 'IELTS Task 1 — Academic (graph/chart)',    short: 'IELTS T1 Academic' },
  { value: 'ielts_task1_general',  label: 'IELTS Task 1 — General Training (letter)', short: 'IELTS T1 General' },
  { value: 'ielts_task2',          label: 'IELTS Task 2 — Essay',                     short: 'IELTS T2' },
  { value: 'pte_summarize',        label: 'PTE — Summarize Written Text',             short: 'PTE Summarize' },
  { value: 'pte_essay',            label: 'PTE — Write Essay',                        short: 'PTE Essay' },
]

// ── Draft persistence ─────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '8px 10px',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px',
  background: 'var(--color-surface)', boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--color-text-2)' }
const btnPrimary = { padding: '8px 16px', background: 'var(--color-accent)', color: '#fff', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer' }
const btnSecondary = { padding: '8px 16px', background: 'var(--color-surface)', color: 'var(--color-text-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer' }
const btnDanger = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-danger)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer' }
const btnEdit = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-secondary)', border: '2px solid var(--color-secondary)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer' }

export default function AdminEssay() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm, clearForm] = useAppState('admin-essay-form', emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useAppState('admin-essay-view-mode', 'public')

  // Image upload state
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef(null)

  function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearImageSelection() {
    setImageFile(null)
    setImagePreview(null)
  }

  // Submissions viewer
  const [selectedPromptId, setSelectedPromptId] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [expandedSub, setExpandedSub] = useState(null)

  useEffect(() => { fetchPrompts() }, [courseKey, viewMode])

  async function fetchSubmissions(promptId) {
    setSelectedPromptId(promptId)
    setSubsLoading(true)
    setExpandedSub(null)
    const { data } = await supabase
      .from('essay_submissions')
      .select('*, profiles(full_name, email)')
      .eq('prompt_id', promptId)
      .order('submitted_at', { ascending: false })
    setSubmissions(data || [])
    setSubsLoading(false)
  }

  async function fetchPrompts() {
    setLoading(true)
    let query = supabase
      .from('essay_prompts')
      .select('*')
      .eq('is_private', viewMode === 'private')
      .order('sort_order')
      .order('created_at', { ascending: false })
    if (viewMode === 'public') query = query.eq('course_key', courseKey)
    const { data, error: err } = await query
    if (err) setError(err.message)
    else setPrompts(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: ['min_words', 'max_words'].includes(name) ? Number(value) : name === 'time_limit_minutes' ? (value === '' ? null : Number(value)) : value }))
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({ title: p.title, prompt: p.prompt, min_words: p.min_words, max_words: p.max_words, time_limit_minutes: p.time_limit_minutes ?? '', essay_type: p.essay_type ?? 'general', is_private: p.is_private ?? false, week_number: p.week_number ?? 1 })
    setExistingImageUrl(p.image_url ?? null)
    clearImageSelection()
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null); clearForm(); setForm(emptyForm)
    setExistingImageUrl(null); clearImageSelection(); setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.prompt.trim()) { setError('Title and prompt are required.'); return }
    setSubmitting(true)
    setError(null)

    // Upload image to Storage if a new file was selected
    let imageUrl = existingImageUrl ?? null
    if (imageFile) {
      setUploadingImage(true)
      const ext = imageFile.name.split('.').pop()
      const path = `essay-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('essay-images')
        .upload(path, imageFile, { upsert: false, contentType: imageFile.type })
      setUploadingImage(false)
      if (uploadErr) { setError(`Image upload failed: ${uploadErr.message}`); setSubmitting(false); return }
      const { data: urlData } = supabase.storage.from('essay-images').getPublicUrl(path)
      imageUrl = urlData.publicUrl
    }

    const payload = { course_key: form.is_private ? null : courseKey, is_private: form.is_private ?? false, ...form, title: form.title.trim(), prompt: form.prompt.trim(), image_url: imageUrl, ...(!form.is_private ? { week_number: Math.max(1, parseInt(form.week_number) || 1) } : {}), sort_order: editingId ? undefined : prompts.length }
    // remove undefined keys
    if (payload.sort_order === undefined) delete payload.sort_order
    let err
    if (editingId) {
      ;({ error: err } = await supabase.from('essay_prompts').update(payload).eq('id', editingId))
    } else {
      ;({ error: err } = await supabase.from('essay_prompts').insert(payload))
    }
    if (err) setError(err.message)
    else {
      setEditingId(null); clearForm(); setForm(emptyForm)
      setExistingImageUrl(null); clearImageSelection()
      await fetchPrompts()
    }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this prompt?')) return
    const { error: err } = await supabase.from('essay_prompts').delete().eq('id', id)
    if (err) setError(err.message)
    else await fetchPrompts()
  }

  async function handleReorder(reordered) {
    setPrompts(reordered)
    await Promise.all(
      reordered.map(p => supabase.from('essay_prompts').update({ sort_order: p.sort_order }).eq('id', p.id))
    )
  }

  const { sensors, items, activeItem, handleDragStart, handleDragEnd, handleDragCancel } =
    useDraggableList(prompts, handleReorder)

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Essay Prompts</h1>

      {/* Public / Private switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-4)' }}>
        {['public', 'private'].map(mode => (
          <button key={mode} type="button" onClick={() => { setViewMode(mode); cancelEdit(); setForm(f => ({ ...f, is_private: mode === 'private' })) }} style={{ padding: '6px 18px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: viewMode === mode ? 'var(--color-accent)' : 'var(--color-surface)', color: viewMode === mode ? '#fff' : 'var(--color-text-2)', boxShadow: viewMode === mode ? 'var(--shadow-hover)' : 'none', transform: viewMode === mode ? 'translate(2px,2px)' : 'none', transition: 'all var(--transition-base)' }}>
            {mode === 'public' ? 'Public' : 'Private'}
          </button>
        ))}
      </div>

      {viewMode === 'public' && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <CourseKeySelector value={courseKey} onChange={setCourseKey} />
        </div>
      )}
      {viewMode === 'private' && (
        <div style={{ marginBottom: 'var(--space-4)', padding: '10px 14px', background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 13, color: 'var(--color-text-2)' }}>
          Private essay prompts are not tied to a course. They can only be accessed by students through assigned Study Guides.
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{editingId ? 'Edit Prompt' : `Add ${viewMode === 'private' ? 'Private' : 'Public'} Prompt`}</h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} name="title" value={form.title} onChange={handleField} required placeholder="e.g. IELTS Task 2 — Opinion Essay" />
        </div>

        <div>
          <label style={labelStyle}>Prompt *</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} name="prompt" value={form.prompt} onChange={handleField} required placeholder="Write the full essay question here..." />
        </div>

        <div>
          <label style={labelStyle}>Essay type</label>
          <select style={inputStyle} name="essay_type" value={form.essay_type ?? 'general'} onChange={handleField}>
            {ESSAY_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Image upload — only for IELTS Task 1 Academic */}
        {(form.essay_type === 'ielts_task1_academic') && (
          <div>
            <label style={labelStyle}>Chart / graph / diagram image</label>
            <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
            {(imagePreview || existingImageUrl) ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreview ?? existingImageUrl}
                  alt="Prompt chart"
                  style={{ maxWidth: '100%', maxHeight: 240, border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', display: 'block', boxShadow: 'var(--shadow-card)' }}
                />
                <button
                  type="button"
                  onClick={() => { clearImageSelection(); setExistingImageUrl(null) }}
                  style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, border: '2px solid var(--color-border)', borderRadius: '50%', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-hover)' }}
                  title="Remove image"
                >
                  <X size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{ ...btnSecondary, marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ImagePlus size={13} /> Replace image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', background: 'var(--color-muted)', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}
              >
                <ImagePlus size={15} /> Upload chart, graph, or diagram
              </button>
            )}
            <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 6 }}>
              Students will see this image alongside the prompt. The AI will also use it to evaluate their description.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Min words</label>
            <input style={inputStyle} type="number" name="min_words" value={form.min_words} onChange={handleField} />
          </div>
          <div>
            <label style={labelStyle}>Max words</label>
            <input style={inputStyle} type="number" name="max_words" value={form.max_words} onChange={handleField} />
          </div>
          <div>
            <label style={labelStyle}>Time limit (minutes)</label>
            <input style={inputStyle} type="number" name="time_limit_minutes" value={form.time_limit_minutes ?? ''} onChange={handleField} placeholder="No limit" min={1} />
          </div>
        </div>

        {viewMode === 'public' && (
          <div>
            <label style={labelStyle}>Week</label>
            <input style={inputStyle} type="number" min={1} name="week_number" value={form.week_number ?? 1} onChange={handleField} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting || uploadingImage}>
            {uploadingImage ? 'Uploading image…' : submitting ? 'Saving…' : editingId ? 'Update' : 'Add Prompt'}
          </button>
          {editingId && <button type="button" style={btnSecondary} onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : prompts.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No {viewMode} prompts{viewMode === 'public' ? ' for this course key' : ''}.</p>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'auto', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'auto', boxShadow: 'var(--shadow-card)' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px', width: 28 }} />
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>Type</th>
                  {viewMode === 'public' && <th style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>Week</th>}
                  <th style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>Words</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>Time</th>
                  <th style={{ padding: '8px 10px' }} />
                </tr>
              </thead>
              <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {items.map(p => (
                    <SortableRow key={p.id} id={p.id}>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 500 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{p.prompt}</div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', background: 'var(--color-muted)', color: 'var(--color-text-2)', whiteSpace: 'nowrap' }}>
                          {ESSAY_TYPE_OPTIONS.find(o => o.value === (p.essay_type ?? 'general'))?.short ?? p.essay_type}
                        </span>
                      </td>
                      {viewMode === 'public' && <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-secondary)', whiteSpace: 'nowrap' }}>{p.week_number ?? 1}</td>}
                      <td style={{ padding: '8px 10px', color: 'var(--color-text-2)', whiteSpace: 'nowrap' }}>{p.min_words}–{p.max_words}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--color-text-2)', whiteSpace: 'nowrap' }}>
                        {p.time_limit_minutes ? `${p.time_limit_minutes} min` : <span style={{ color: 'var(--color-text-3)' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button style={{ ...btnEdit, fontSize: 12 }} onClick={() => fetchSubmissions(p.id)}>Submissions</button>
                          <button style={btnEdit} onClick={() => startEdit(p)}>Edit</button>
                          <button style={btnDanger} onClick={() => handleDelete(p.id)}>Delete</button>
                        </div>
                      </td>
                    </SortableRow>
                  ))}
                </tbody>
              </SortableContext>
            </table>
            <DragOverlay>
              {activeItem && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-wobbly-sm)', boxShadow: 'var(--shadow-elevated)' }}>
                  <tbody>
                    <SortableRow id={activeItem.id} isOverlay>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{activeItem.title}</td>
                      <td style={{ padding: '8px 10px' }} />
                      <td style={{ padding: '8px 10px' }} />
                      <td style={{ padding: '8px 10px' }} />
                      <td style={{ padding: '8px 10px' }} />
                    </SortableRow>
                  </tbody>
                </table>
              )}
            </DragOverlay>
          </DndContext>
        </div>
        </div>
      )}

      {/* Submissions panel */}
      {selectedPromptId && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              Student Submissions — {prompts.find(p => p.id === selectedPromptId)?.title}
            </h2>
            <button style={btnSecondary} onClick={() => setSelectedPromptId(null)}>Close</button>
          </div>

          {subsLoading ? (
            <p style={{ color: 'var(--color-text-2)', fontSize: 14 }}>Loading…</p>
          ) : submissions.length === 0 ? (
            <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No submissions yet for this prompt.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {submissions.map(sub => (
                <div key={sub.id} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {sub.profiles?.full_name || sub.profiles?.email || 'Unknown student'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>
                        {new Date(sub.submitted_at).toLocaleString()} ·{' '}
                        Score: <strong>{sub.feedback?.overall_score ?? '—'}/10</strong> ·{' '}
                        {sub.feedback?.band_estimate ?? ''}
                      </div>
                    </div>
                    {expandedSub === sub.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedSub === sub.id && (
                    <div style={{ borderTop: '1px solid var(--color-border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Essay</div>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-2)', whiteSpace: 'pre-wrap', margin: 0 }}>{sub.essay_text}</p>
                      </div>
                      {sub.feedback?.summary && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>AI Feedback Summary</div>
                          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-2)', margin: 0 }}>{sub.feedback.summary}</p>
                        </div>
                      )}
                      {sub.feedback?.categories && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {Object.entries(sub.feedback.categories).map(([key, val]) => (
                            <div key={key} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'capitalize', marginBottom: 2 }}>{key.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{val.score}/10</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
