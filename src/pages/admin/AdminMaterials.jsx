import { useState, useEffect } from 'react'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase } from '../../lib/supabase'
import { uploadFile, deleteFile, storagePathFromUrl } from '../../lib/hostingerStorage'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import TagInput from '../../components/admin/TagInput'
import SortableRow from '../../components/admin/SortableRow'
import { validateFile } from '../../lib/adminValidators'
import { useAppState } from '../../lib/AppStateContext'
import { useDraggableList } from '../../lib/useDraggableList'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyForm = { title: '', file: null, tags: [], difficulty: 'Beginner', is_private: false, week_number: 1 }

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
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
  const [viewMode, setViewMode] = useAppState('admin-materials-view-mode', 'public')

  useEffect(() => {
    fetchMaterials()
  }, [courseKey, viewMode])

  useEffect(() => {
    supabase.from('materials').select('tags').then(({ data }) => {
      const tags = [...new Set((data || []).flatMap(m => m.tags || []))].sort()
      setAllTags(tags)
    })
  }, [materials])

  async function fetchMaterials() {
    setLoading(true)
    setError(null)
    let query = supabase.from('materials').select('*').eq('is_private', viewMode === 'private').order('sort_order').order('created_at', { ascending: false })
    if (viewMode === 'public') query = query.eq('course_key', courseKey)
    const { data, error: err } = await query
    if (err) setError(err.message)
    else setMaterials(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value, type, files } = e.target
    if (type === 'file') {
      setForm(f => ({ ...f, file: files[0] || null }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  function startEdit(material) {
    setEditingId(material.id)
    const f = { title: material.title, file: null, tags: material.tags || [], difficulty: material.difficulty || 'Beginner', is_private: material.is_private ?? false, week_number: material.week_number ?? 1 }
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
      // Edit: title + tags only
      setSubmitting(true)
      const { error: err } = await supabase
        .from('materials')
        .update({ title: form.title, tags: form.tags || [], difficulty: form.difficulty, is_private: form.is_private, course_key: form.is_private ? null : courseKey, ...(!form.is_private ? { week_number: Math.max(1, parseInt(form.week_number) || 1) } : {}) })
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
    const prefix = form.is_private ? 'private' : courseKey
    const path = `${prefix}/${file.name}`

    const { publicUrl, error: uploadErr } = await uploadFile('materials', path, file)

    if (uploadErr) {
      setError(uploadErr)
      setUploading(false)
      setSubmitting(false)
      return
    }

    const fileUrl = publicUrl

    const { error: insertErr } = await supabase.from('materials').insert({
      course_key: form.is_private ? null : courseKey,
      is_private: form.is_private,
      title: form.title,
      file_url: fileUrl,
      file_size_label: formatSize(file.size),
      sort_order: materials.length,
      tags: form.tags || [],
      difficulty: form.difficulty,
      ...(!form.is_private ? { week_number: Math.max(1, parseInt(form.week_number) || 1) } : {}),
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

    const storagePath = storagePathFromUrl(material.file_url, 'materials')
    if (storagePath) {
      const { error: storageErr } = await deleteFile('materials', storagePath)
      if (storageErr) {
        // Per design: show warning but still remove from UI
        setError(`Warning: file not removed from storage — ${storageErr}`)
      }
    }

    const { error: dbErr } = await supabase.from('materials').delete().eq('id', material.id)
    if (dbErr) {
      setError(dbErr.message)
    } else {
      await fetchMaterials()
    }
  }

  async function handleReorder(reordered) {
    setMaterials(reordered)
    await Promise.all(
      reordered.map(m => supabase.from('materials').update({ sort_order: m.sort_order }).eq('id', m.id))
    )
  }

  const { sensors, items, activeItem, handleDragStart, handleDragEnd, handleDragCancel } =
    useDraggableList(materials, handleReorder)

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Materials</h1>

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
          Private materials are not tied to a course. They can only be accessed by students through assigned Study Guides.
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Add / Edit form */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
          {editingId ? 'Edit Material' : `Add ${viewMode === 'private' ? 'Private' : 'Public'} Material`}
        </h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} name="title" value={form.title} onChange={handleField} required placeholder="Material title" />
        </div>

        {!editingId && (
          <div>
            <label style={labelStyle}>PDF File *</label>
            <input style={inputStyle} type="file" accept="application/pdf" onChange={handleField} required />
          </div>
        )}

        <div>
          <label style={labelStyle}>Difficulty</label>
          <select style={inputStyle} name="difficulty" value={form.difficulty} onChange={handleField}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Tags</label>
          <TagInput value={form.tags || []} onChange={tags => setForm(f => ({ ...f, tags }))} existingTags={allTags} placeholder="Add tags (e.g. Grammar, Reading)…" />
        </div>

        {viewMode === 'public' && (
          <div>
            <label style={labelStyle}>Week</label>
            <input style={inputStyle} type="number" min={1} name="week_number" value={form.week_number ?? 1} onChange={handleField} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting || uploading}>
            {uploading ? 'Uploading…' : submitting ? 'Saving…' : editingId ? 'Update Material' : 'Add Material'}
          </button>
          {editingId && <button type="button" style={btnSecondary} onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {/* Materials list */}
      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : materials.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No {viewMode} materials{viewMode === 'public' ? ' for this course key' : ''}.</p>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'auto', boxShadow: 'var(--shadow-card)' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px', width: 28 }} />
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
                  {viewMode === 'public' && <th style={{ padding: '8px 10px', fontWeight: 600 }}>Week</th>}
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Tags</th>
                  <th style={{ padding: '8px 10px' }} />
                </tr>
              </thead>
              <SortableContext items={items.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {items.map(m => (
                    <SortableRow key={m.id} id={m.id}>
                      <td style={{ padding: '8px 10px' }}>{m.title}</td>
                      {viewMode === 'public' && <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-secondary)' }}>{m.week_number ?? 1}</td>}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(m.tags || []).map(t => (
                            <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(37,99,235,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.15)' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button style={btnEdit} onClick={() => startEdit(m)}>Edit</button>
                          <button style={btnDanger} onClick={() => handleDelete(m)}>Delete</button>
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
                    </SortableRow>
                  </tbody>
                </table>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  )
}
