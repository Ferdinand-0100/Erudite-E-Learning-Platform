import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyForm = { title: '', prompt: '', min_words: 150, max_words: 500, sort_order: 0 }

const inputStyle = {
  width: '100%', padding: '8px 10px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-sm)', fontSize: '14px',
  background: 'var(--color-surface)', boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--color-text-2)' }
const btnPrimary = { padding: '8px 16px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '14px', cursor: 'pointer' }
const btnSecondary = { padding: '8px 16px', background: 'transparent', color: 'var(--color-text-2)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: '14px', cursor: 'pointer' }
const btnDanger = { padding: '6px 12px', background: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '13px', cursor: 'pointer' }
const btnEdit = { padding: '6px 12px', background: 'transparent', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-sm)', fontSize: '13px', cursor: 'pointer' }

export default function AdminEssay() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchPrompts() }, [courseKey])

  async function fetchPrompts() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('essay_prompts')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
    if (err) setError(err.message)
    else setPrompts(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: ['min_words', 'max_words', 'sort_order'].includes(name) ? Number(value) : value }))
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({ title: p.title, prompt: p.prompt, min_words: p.min_words, max_words: p.max_words, sort_order: p.sort_order })
    setError(null)
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); setError(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.prompt.trim()) { setError('Title and prompt are required.'); return }
    setSubmitting(true)
    setError(null)
    const payload = { course_key: courseKey, ...form, title: form.title.trim(), prompt: form.prompt.trim() }
    let err
    if (editingId) {
      ;({ error: err } = await supabase.from('essay_prompts').update(payload).eq('id', editingId))
    } else {
      ;({ error: err } = await supabase.from('essay_prompts').insert(payload))
    }
    if (err) setError(err.message)
    else { setEditingId(null); setForm(emptyForm); await fetchPrompts() }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this prompt?')) return
    const { error: err } = await supabase.from('essay_prompts').delete().eq('id', id)
    if (err) setError(err.message)
    else await fetchPrompts()
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Essay Prompts</h1>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <CourseKeySelector value={courseKey} onChange={setCourseKey} />
      </div>

      {error && (
        <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.55)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{editingId ? 'Edit Prompt' : 'Add Prompt'}</h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} name="title" value={form.title} onChange={handleField} required placeholder="e.g. IELTS Task 2 — Opinion Essay" />
        </div>

        <div>
          <label style={labelStyle}>Prompt *</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} name="prompt" value={form.prompt} onChange={handleField} required placeholder="Write the full essay question here..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Min words</label>
            <input style={inputStyle} type="number" name="min_words" value={form.min_words} onChange={handleField} />
          </div>
          <div>
            <label style={labelStyle}>Max words</label>
            <input style={inputStyle} type="number" name="max_words" value={form.max_words} onChange={handleField} />
          </div>
          <div>
            <label style={labelStyle}>Sort order</label>
            <input style={inputStyle} type="number" name="sort_order" value={form.sort_order} onChange={handleField} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting}>{editingId ? 'Update' : 'Add Prompt'}</button>
          {editingId && <button type="button" style={btnSecondary} onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : prompts.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No prompts for this course key.</p>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.55)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Words</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Order</th>
                <th style={{ padding: '8px 10px' }} />
              </tr>
            </thead>
            <tbody>
              {prompts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 10px', maxWidth: 400 }}>
                    <div style={{ fontWeight: 500 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>{p.prompt}</div>
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--color-text-2)' }}>{p.min_words}–{p.max_words}</td>
                  <td style={{ padding: '8px 10px' }}>{p.sort_order}</td>
                  <td style={{ padding: '8px 10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button style={btnEdit} onClick={() => startEdit(p)}>Edit</button>
                    <button style={btnDanger} onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
