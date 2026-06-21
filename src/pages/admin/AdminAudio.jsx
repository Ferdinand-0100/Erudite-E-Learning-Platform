import { useState, useEffect } from 'react'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase } from '../../lib/supabase'
import { uploadFile, deleteFile, storagePathFromUrl } from '../../lib/hostingerStorage'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import TagInput from '../../components/admin/TagInput'
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

const AUDIO_BUCKET = 'audio-files'

const emptyForm = { title: '', duration_label: '', difficulty: 'Beginner', tags: [], week_number: 1 }

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

const inputStyle = { width: '100%', padding: '8px 10px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', background: 'var(--color-surface)', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--color-text-2)' }
const btnPrimary = { padding: '8px 16px', background: 'var(--color-accent)', color: '#fff', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer' }
const btnSecondary = { padding: '8px 16px', background: 'var(--color-surface)', color: 'var(--color-text-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer' }
const btnDanger = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-danger)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer' }
const btnEdit = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-secondary)', border: '2px solid var(--color-secondary)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer' }

export default function AdminAudio() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [audioFiles, setAudioFiles] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm, clearForm] = useAppState('admin-audio-form', emptyForm)
  const [editingId, setEditingId, clearEditingId] = useAppState('admin-audio-editing-id', null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchAudio() }, [courseKey])

  useEffect(() => {
    supabase.from('audio_files').select('tags').then(({ data }) => {
      const tags = [...new Set((data || []).flatMap(a => a.tags || []))].sort()
      setAllTags(tags)
    })
  }, [audioFiles])

  async function fetchAudio() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('audio_files')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setAudioFiles(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value, type, files } = e.target
    if (type === 'file') setForm(f => ({ ...f, file: files[0] || null }))
    else setForm(f => ({ ...f, [name]: value }))
  }

  function startEdit(audio) {
    setEditingId(audio.id)
    setForm({ title: audio.title, duration_label: audio.duration_label || '', difficulty: audio.difficulty || 'Beginner', tags: audio.tags || [], week_number: audio.week_number ?? 1 })
    setError(null)
  }

  function cancelEdit() { clearForm(); clearEditingId(); setForm(emptyForm); setError(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (editingId) {
      setSubmitting(true)
      const { error: err } = await supabase.from('audio_files').update({
        title: form.title,
        duration_label: form.duration_label || null,
        difficulty: form.difficulty,
        tags: form.tags || [],
        course_key: courseKey,
        week_number: Math.max(1, parseInt(form.week_number) || 1),
      }).eq('id', editingId)
      if (err) setError(err.message)
      else { clearForm(); clearEditingId(); await fetchAudio() }
      setSubmitting(false)
      return
    }

    if (!form.file) { setError('Please select an audio file.'); return }
    setUploading(true)
    setSubmitting(true)

    const file = form.file
    const path = `${courseKey}/${Date.now()}_${file.name}`

    const { publicUrl, error: uploadErr } = await uploadFile(AUDIO_BUCKET, path, file)
    if (uploadErr) { setError(uploadErr); setUploading(false); setSubmitting(false); return }

    const { error: insertErr } = await supabase.from('audio_files').insert({
      course_key: courseKey,
      title: form.title,
      file_url: publicUrl,
      duration_label: form.duration_label || null,
      difficulty: form.difficulty,
      tags: form.tags || [],
      sort_order: audioFiles.length,
      week_number: Math.max(1, parseInt(form.week_number) || 1),
    })

    if (insertErr) setError(insertErr.message)
    else { clearForm(); clearEditingId(); await fetchAudio() }

    setUploading(false)
    setSubmitting(false)
  }

  async function handleDelete(audio) {
    if (!window.confirm('Delete this audio file?')) return
    const storagePath = storagePathFromUrl(audio.file_url, AUDIO_BUCKET)
    if (storagePath) await deleteFile(AUDIO_BUCKET, storagePath)
    const { error: err } = await supabase.from('audio_files').delete().eq('id', audio.id)
    if (err) setError(err.message)
    else await fetchAudio()
  }

  async function handleReorder(reordered) {
    setAudioFiles(reordered)
    await Promise.all(reordered.map(a => supabase.from('audio_files').update({ sort_order: a.sort_order }).eq('id', a.id)))
  }

  const { sensors, items, activeItem, handleDragStart, handleDragEnd, handleDragCancel } = useDraggableList(audioFiles, handleReorder)

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Audio Files</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 'var(--space-4)' }}>
        Teacher-only content — visible to teachers on the course page. Students never see these.
      </p>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <CourseKeySelector value={courseKey} onChange={k => { setCourseKey(k); cancelEdit() }} />
      </div>

      {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{editingId ? 'Edit Audio File' : 'Add Audio File'}</h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} name="title" value={form.title} onChange={handleField} required placeholder="Audio file title" />
        </div>

        {!editingId && (
          <div>
            <label style={labelStyle}>Audio File * <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>(MP3, WAV, M4A)</span></label>
            <input style={inputStyle} type="file" accept="audio/*" onChange={handleField} required />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Duration label</label>
            <input style={inputStyle} name="duration_label" value={form.duration_label} onChange={handleField} placeholder="e.g. 8 min" />
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
            <label style={labelStyle}>Week</label>
            <input style={inputStyle} type="number" min={1} name="week_number" value={form.week_number ?? 1} onChange={handleField} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Tags</label>
          <TagInput value={form.tags || []} onChange={tags => setForm(f => ({ ...f, tags }))} existingTags={allTags} placeholder="Add tags…" />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting || uploading}>{uploading ? 'Uploading…' : submitting ? 'Saving…' : editingId ? 'Update Audio' : 'Add Audio'}</button>
          {editingId && <button type="button" style={btnSecondary} onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : audioFiles.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No audio files for this course key.</p>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'auto', boxShadow: 'var(--shadow-card)' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px', width: 28 }} />
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Difficulty</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Week</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Tags</th>
                  <th style={{ padding: '8px 10px' }} />
                </tr>
              </thead>
              <SortableContext items={items.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {items.map(a => (
                    <SortableRow key={a.id} id={a.id}>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{a.title}</td>
                      <td style={{ padding: '8px 10px' }}>{a.difficulty}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-secondary)' }}>{a.week_number ?? 1}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(a.tags || []).map(t => (
                            <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(37,99,235,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.15)' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button style={btnEdit} onClick={() => startEdit(a)}>Edit</button>
                          <button style={btnDanger} onClick={() => handleDelete(a)}>Delete</button>
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
                      <td style={{ padding: '8px 10px' }} /><td style={{ padding: '8px 10px' }} /><td style={{ padding: '8px 10px' }} />
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
