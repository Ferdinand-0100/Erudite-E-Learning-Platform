import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import TagInput from '../../components/admin/TagInput'
import { validateFile } from '../../lib/adminValidators'
import { useAppState } from '../../lib/AppStateContext'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyForm = { title: '', file: null, sort_order: 0, tags: [], difficulty: 'Beginner' }

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

function storagePathFromUrl(url) {
  const marker = '/object/public/materials/'
  const idx = url.indexOf(marker)
  return idx >= 0 ? url.slice(idx + marker.length) : null
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-wobbly-sm)',
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
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-wobbly-sm)',
  fontSize: '14px',
  cursor: 'pointer',
}

const btnSecondary = {
  padding: '8px 16px',
  background: 'var(--color-surface)',
  color: 'var(--color-text-2)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-wobbly-sm)',
  fontSize: '14px',
  cursor: 'pointer',
}

const btnDanger = {
  padding: '6px 12px',
  background: 'var(--color-surface)',
  color: 'var(--color-danger)',
  border: '2px solid var(--color-danger)',
  borderRadius: 'var(--radius-wobbly-sm)',
  fontSize: '13px',
  cursor: 'pointer',
}

const btnEdit = {
  padding: '6px 12px',
  background: 'var(--color-surface)',
  color: 'var(--color-secondary)',
  border: '2px solid var(--color-secondary)',
  borderRadius: 'var(--radius-wobbly-sm)',
  fontSize: '13px',
  cursor: 'pointer',
}

export default function AdminMaterials() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [materials, setMaterials] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm, clearForm] = useAppState('admin-materials-form', emptyForm)
  const [editingId, setEditingId, clearEditingId] = useAppState('admin-materials-editing-id', null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchMaterials()
  }, [courseKey])

  useEffect(() => {
    supabase.from('materials').select('tags').then(({ data }) => {
      const tags = [...new Set((data || []).flatMap(m => m.tags || []))].sort()
      setAllTags(tags)
    })
  }, [materials])

  async function fetchMaterials() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('materials')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
    if (err) setError(err.message)
    else setMaterials(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      setForm(f => ({ ...f, file: files[0] || null }))
    } else {
      setForm(f => ({ ...f, [name]: name === 'sort_order' ? Number(value) : value }))
    }
  }

  function startEdit(material) {
    setEditingId(material.id)
    const f = { title: material.title, file: null, sort_order: material.sort_order, tags: material.tags || [], difficulty: material.difficulty || 'Beginner' }
    setForm(f)
    setError(null)
  }

  function cancelEdit() {
    clearForm()
    clearEditingId()
    setForm(emptyForm)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (editingId) {
      // Edit: title + sort_order + tags only
      setSubmitting(true)
      const { error: err } = await supabase
        .from('materials')
        .update({ title: form.title, sort_order: form.sort_order, tags: form.tags || [], difficulty: form.difficulty })
        .eq('id', editingId)
      if (err) {
        setError(err.message)
      } else {
        clearForm()
        clearEditingId()
        await fetchMaterials()
      }
      setSubmitting(false)
      return
    }

    // Add: validate + upload + insert
    const fileCheck = validateFile(form.file)
    if (!fileCheck.valid) {
      setError(fileCheck.error)
      return
    }

    setUploading(true)
    setSubmitting(true)

    const file = form.file
    const path = `${courseKey}/${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('materials')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      setSubmitting(false)
      return
    }

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path)
    const fileUrl = urlData.publicUrl

    const { error: insertErr } = await supabase.from('materials').insert({
      course_key: courseKey,
      title: form.title,
      file_url: fileUrl,
      file_size_label: formatSize(file.size),
      sort_order: form.sort_order,
      tags: form.tags || [],
      difficulty: form.difficulty,
    })

    if (insertErr) {
      setError(insertErr.message)
    } else {
      clearForm()
      clearEditingId()
      await fetchMaterials()
    }

    setUploading(false)
    setSubmitting(false)
  }

  async function handleDelete(material) {
    if (!window.confirm('Delete this material?')) return
    setError(null)

    const storagePath = storagePathFromUrl(material.file_url)
    if (storagePath) {
      const { error: storageErr } = await supabase.storage
        .from('materials')
        .remove([storagePath])
      if (storageErr) {
        // Per design: show warning but still remove from UI
        setError(`Warning: file not removed from storage — ${storageErr.message}`)
      }
    }

    const { error: dbErr } = await supabase.from('materials').delete().eq('id', material.id)
    if (dbErr) {
      setError(dbErr.message)
    } else {
      await fetchMaterials()
    }
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Materials</h1>

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
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-wobbly-sm)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        display: 'grid',
        gap: 'var(--space-3)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
          {editingId ? 'Edit Material' : 'Add Material'}
        </h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={inputStyle}
            name="title"
            value={form.title}
            onChange={handleField}
            required
            placeholder="Material title"
          />
        </div>

        {!editingId && (
          <div>
            <label style={labelStyle}>PDF File *</label>
            <input
              style={inputStyle}
              type="file"
              accept="application/pdf"
              onChange={handleField}
              required
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 'var(--space-3)' }}>
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

        <div>
          <label style={labelStyle}>Tags</label>
          <TagInput value={form.tags || []} onChange={tags => setForm(f => ({ ...f, tags }))} existingTags={allTags} placeholder="Add tags (e.g. Grammar, Reading)…" />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting || uploading}>
            {uploading ? 'Uploading…' : submitting ? 'Saving…' : editingId ? 'Update Material' : 'Add Material'}
          </button>
          {editingId && (
            <button type="button" style={btnSecondary} onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Materials list */}
      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : materials.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No materials for this course key.</p>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Tags</th>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Order</th>
              <th style={{ padding: '8px 10px' }} />
            </tr>
          </thead>
          <tbody>
            {materials.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 10px' }}>{m.title}</td>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(m.tags || []).map(t => (
                      <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(37,99,235,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.15)' }}>{t}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '8px 10px' }}>{m.sort_order}</td>
                <td style={{ padding: '8px 10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button style={btnEdit} onClick={() => startEdit(m)}>Edit</button>
                  <button style={btnDanger} onClick={() => handleDelete(m)}>Delete</button>
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
