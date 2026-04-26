import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import { validateEmbedUrl } from '../../lib/adminValidators'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyForm = {
  title: '',
  embed_url: '',
  duration_label: '',
  difficulty: 'Beginner',
  sort_order: 0,
}

function loadDraft() {
  try { return JSON.parse(sessionStorage.getItem('admin-videos-draft') || 'null') } catch { return null }
}
function saveDraft(form) {
  try { sessionStorage.setItem('admin-videos-draft', JSON.stringify(form)) } catch {}
}
function clearDraft() {
  try { sessionStorage.removeItem('admin-videos-draft') } catch {}
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  background: 'var(--color-surface)',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '4px',
  color: 'var(--color-text-2)',
}

const btnPrimary = {
  padding: '8px 16px',
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  cursor: 'pointer',
}

const btnSecondary = {
  padding: '8px 16px',
  background: 'transparent',
  color: 'var(--color-text-2)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  cursor: 'pointer',
}

const btnDanger = {
  padding: '6px 12px',
  background: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  cursor: 'pointer',
}

const btnEdit = {
  padding: '6px 12px',
  background: 'transparent',
  color: 'var(--color-accent)',
  border: '1px solid var(--color-accent)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  cursor: 'pointer',
}

export default function AdminVideos() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(() => loadDraft() ?? emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [courseKey])

  async function fetchVideos() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('videos')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
    if (err) setError(err.message)
    else setVideos(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value } = e.target
    setForm(f => {
      const next = { ...f, [name]: name === 'sort_order' ? Number(value) : value }
      saveDraft(next)
      return next
    })
  }

  function startEdit(video) {
    setEditingId(video.id)
    setForm({
      title: video.title,
      embed_url: video.embed_url,
      duration_label: video.duration_label || '',
      difficulty: video.difficulty,
      sort_order: video.sort_order,
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    clearDraft()
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const urlCheck = validateEmbedUrl(form.embed_url)
    if (!urlCheck.valid) {
      setError(urlCheck.error)
      return
    }
    setSubmitting(true)
    setError(null)

    const payload = {
      course_key: courseKey,
      title: form.title,
      embed_url: form.embed_url,
      duration_label: form.duration_label || null,
      difficulty: form.difficulty,
      sort_order: form.sort_order,
    }

    let err
    if (editingId) {
      ;({ error: err } = await supabase.from('videos').update(payload).eq('id', editingId))
    } else {
      ;({ error: err } = await supabase.from('videos').insert(payload))
    }

    if (err) {
      setError(err.message)
    } else {
      setEditingId(null)
      setForm(emptyForm)
      clearDraft()
      await fetchVideos()
    }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this video?')) return
    const { error: err } = await supabase.from('videos').delete().eq('id', id)
    if (err) setError(err.message)
    else await fetchVideos()
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Videos</h1>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <CourseKeySelector value={courseKey} onChange={setCourseKey} />
      </div>

      {error && (
        <div style={{
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-4)',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Add / Edit form */}
      <form onSubmit={handleSubmit} style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(0,0,0,0.55)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        display: 'grid',
        gap: 'var(--space-3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
          {editingId ? 'Edit Video' : 'Add Video'}
        </h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={inputStyle}
            name="title"
            value={form.title}
            onChange={handleField}
            required
            placeholder="Video title"
          />
        </div>

        <div>
          <label style={labelStyle}>Embed URL</label>
          <input
            style={inputStyle}
            name="embed_url"
            value={form.embed_url}
            onChange={handleField}
            placeholder="https://www.youtube.com/embed/..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Duration label</label>
            <input
              style={inputStyle}
              name="duration_label"
              value={form.duration_label}
              onChange={handleField}
              placeholder="e.g. 12 min"
            />
          </div>

          <div>
            <label style={labelStyle}>Difficulty</label>
            <select style={inputStyle} name="difficulty" value={form.difficulty} onChange={handleField}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Sort order</label>
            <input
              style={inputStyle}
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleField}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting}>
            {editingId ? 'Update Video' : 'Add Video'}
          </button>
          {editingId && (
            <button type="button" style={btnSecondary} onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Video list */}
      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : videos.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No videos for this course key.</p>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.55)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Embed URL</th>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Difficulty</th>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Order</th>
              <th style={{ padding: '8px 10px' }} />
            </tr>
          </thead>
          <tbody>
            {videos.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 10px' }}>{v.title}</td>
                <td style={{ padding: '8px 10px', color: 'var(--color-text-2)', maxWidth: 220 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.embed_url}
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>{v.difficulty}</td>
                <td style={{ padding: '8px 10px' }}>{v.sort_order}</td>
                <td style={{ padding: '8px 10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button style={btnEdit} onClick={() => startEdit(v)}>Edit</button>
                  <button style={btnDanger} onClick={() => handleDelete(v.id)}>Delete</button>
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
