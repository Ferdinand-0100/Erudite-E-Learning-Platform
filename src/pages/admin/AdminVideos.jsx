import { useState, useEffect } from 'react'
import {
  DndContext, closestCenter, DragOverlay,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import TagInput from '../../components/admin/TagInput'
import SortableRow from '../../components/admin/SortableRow'
import { validateEmbedUrl } from '../../lib/adminValidators'
import { normaliseVideoUrl, detectVideoSource } from '../../lib/videoUrl'
import { useAppState } from '../../lib/AppStateContext'
import { useDraggableList } from '../../lib/useDraggableList'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyForm = { title: '', embed_url: '', duration_label: '', difficulty: 'Beginner', tags: [], is_private: false, week_number: 1 }

const inputStyle = { width: '100%', padding: '8px 10px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', background: 'var(--color-surface)', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--color-text-2)' }
const btnPrimary = { padding: '8px 16px', background: 'var(--color-accent)', color: '#fff', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer' }
const btnSecondary = { padding: '8px 16px', background: 'var(--color-surface)', color: 'var(--color-text-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer' }
const btnDanger = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-danger)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer' }
const btnEdit = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-secondary)', border: '2px solid var(--color-secondary)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer' }

export default function AdminVideos() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [videos, setVideos] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm, clearForm] = useAppState('admin-videos-form', emptyForm)
  const [editingId, setEditingId, clearEditingId] = useAppState('admin-videos-editing-id', null)
  const [submitting, setSubmitting] = useState(false)
  // View mode: 'public' | 'private'
  const [viewMode, setViewMode] = useAppState('admin-videos-view-mode', 'public')

  useEffect(() => { fetchVideos() }, [courseKey, viewMode])

  // Fetch all tags across all videos for autocomplete
  useEffect(() => {
    supabase.from('videos').select('tags').then(({ data }) => {
      const tags = [...new Set((data || []).flatMap(v => v.tags || []))].sort()
      setAllTags(tags)
    })
  }, [videos])

  async function fetchVideos() {
    setLoading(true)
    setError(null)
    let query = supabase.from('videos').select('*').eq('is_private', viewMode === 'private').order('sort_order').order('created_at', { ascending: false })
    if (viewMode === 'public') query = query.eq('course_key', courseKey)
    const { data, error: err } = await query
    if (err) setError(err.message)
    else setVideos(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function handleUrlBlur() {
    if (!form.embed_url) return
    const normalised = normaliseVideoUrl(form.embed_url)
    if (normalised !== form.embed_url) {
      setForm(f => ({ ...f, embed_url: normalised }))
    }
  }

  function handleTags(tags) {
    setForm(f => ({ ...f, tags }))
  }

  function startEdit(video) {
    setEditingId(video.id)
    const f = { title: video.title, embed_url: video.embed_url, duration_label: video.duration_label || '', difficulty: video.difficulty, tags: video.tags || [], is_private: video.is_private ?? false, week_number: video.week_number ?? 1 }
    setForm(f)
    setError(null)
  }

  function cancelEdit() { clearForm(); clearEditingId(); setForm(emptyForm); setError(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    const urlCheck = validateEmbedUrl(form.embed_url)
    if (!urlCheck.valid) { setError(urlCheck.error); return }
    setSubmitting(true)
    setError(null)
    const nextOrder = editingId ? undefined : videos.length
    const payload = {
      is_private: form.is_private,
      course_key: form.is_private ? null : courseKey,
      title: form.title,
      embed_url: normaliseVideoUrl(form.embed_url),
      duration_label: form.duration_label || null,
      difficulty: form.difficulty,
      tags: form.tags || [],
      ...(nextOrder !== undefined ? { sort_order: nextOrder } : {}),
      ...(!form.is_private ? { week_number: Math.max(1, parseInt(form.week_number) || 1) } : {}),
    }
    let err
    if (editingId) { ;({ error: err } = await supabase.from('videos').update(payload).eq('id', editingId)) }
    else { ;({ error: err } = await supabase.from('videos').insert(payload)) }
    if (err) { setError(err.message) }
    else { clearForm(); clearEditingId(); await fetchVideos() }
    setSubmitting(false)
  }

  async function handleReorder(reordered) {
    setVideos(reordered)
    await Promise.all(
      reordered.map(v => supabase.from('videos').update({ sort_order: v.sort_order }).eq('id', v.id))
    )
  }

  const { sensors, items, activeItem, handleDragStart, handleDragEnd, handleDragCancel } =
    useDraggableList(videos, handleReorder)

  async function handleDelete(id) {
    if (!window.confirm('Delete this video?')) return
    const { error: err } = await supabase.from('videos').delete().eq('id', id)
    if (err) setError(err.message)
    else await fetchVideos()
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Videos</h1>

      {/* Public / Private switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-4)' }}>
        {['public', 'private'].map(mode => (
          <button key={mode} type="button" onClick={() => { setViewMode(mode); cancelEdit(); setForm(f => ({ ...f, is_private: mode === 'private' })) }} style={{ padding: '6px 18px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: viewMode === mode ? 'var(--color-accent)' : 'var(--color-surface)', color: viewMode === mode ? '#fff' : 'var(--color-text-2)', boxShadow: viewMode === mode ? 'var(--shadow-hover)' : 'none', transform: viewMode === mode ? 'translate(2px,2px)' : 'none', transition: 'all var(--transition-base)' }}>
            {mode === 'public' ? 'Public' : 'Private'}
          </button>
        ))}
      </div>

      {/* Course selector — only for public */}
      {viewMode === 'public' && (
        <div style={{ marginBottom: 'var(--space-6)' }}><CourseKeySelector value={courseKey} onChange={setCourseKey} /></div>
      )}
      {viewMode === 'private' && (
        <div style={{ marginBottom: 'var(--space-4)', padding: '10px 14px', background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: 13, color: 'var(--color-text-2)' }}>
          Private videos are not tied to a course. They can only be accessed by students through assigned Study Guides.
        </div>
      )}

      {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{editingId ? 'Edit Video' : `Add ${viewMode === 'private' ? 'Private' : 'Public'} Video`}</h2>

        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} name="title" value={form.title} onChange={handleField} required placeholder="Video title" />
        </div>

        <div>
          <label style={labelStyle}>Video URL</label>
          <div style={{ position: 'relative' }}>
            <input style={inputStyle} name="embed_url" value={form.embed_url} onChange={handleField} onBlur={handleUrlBlur} placeholder="YouTube, Google Drive share link, or embed URL" />
            {form.embed_url && (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, ...({ youtube: { background: '#fee2e2', color: '#991b1b' }, drive: { background: '#dcfce7', color: '#166534' }, embed: { background: '#dbeafe', color: '#1e40af' }, unknown: { background: 'var(--color-surface-2)', color: 'var(--color-text-3)' } }[detectVideoSource(form.embed_url)]) }}>
                {detectVideoSource(form.embed_url) === 'youtube' ? 'YouTube' : detectVideoSource(form.embed_url) === 'drive' ? 'Google Drive' : detectVideoSource(form.embed_url) === 'embed' ? 'Embed' : 'Unknown'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>Paste a YouTube link, Google Drive share link, or direct embed URL. Drive links are converted automatically.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Duration label</label>
            <input style={inputStyle} name="duration_label" value={form.duration_label} onChange={handleField} placeholder="e.g. 12 min" />
          </div>
          <div>
            <label style={labelStyle}>Difficulty</label>
            <select style={inputStyle} name="difficulty" value={form.difficulty} onChange={handleField}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        {viewMode === 'public' && (
          <div>
            <label style={labelStyle}>Week</label>
            <input style={inputStyle} type="number" min={1} name="week_number" value={form.week_number ?? 1} onChange={handleField} />
          </div>
        )}

        <div>
          <label style={labelStyle}>Tags</label>
          <TagInput value={form.tags || []} onChange={handleTags} existingTags={allTags} placeholder="Add tags (e.g. Grammar, Vocabulary)…" />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting}>{editingId ? 'Update Video' : 'Add Video'}</button>
          {editingId && <button type="button" style={btnSecondary} onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : videos.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No {viewMode} videos{viewMode === 'public' ? ' for this course key' : ''}.</p>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'auto', boxShadow: 'var(--shadow-card)' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px', width: 28 }} />
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Difficulty</th>
                  {viewMode === 'public' && <th style={{ padding: '8px 10px', fontWeight: 600 }}>Week</th>}
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Tags</th>
                  <th style={{ padding: '8px 10px' }} />
                </tr>
              </thead>
              <SortableContext items={items.map(v => v.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {items.map(v => (
                    <SortableRow key={v.id} id={v.id}>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{v.title}</td>
                      <td style={{ padding: '8px 10px' }}>{v.difficulty}</td>
                      {viewMode === 'public' && <td style={{ padding: '8px 10px' }}>{v.week_number ?? 1}</td>}
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(v.tags || []).map(t => (
                            <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(37,99,235,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.15)' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button style={btnEdit} onClick={() => startEdit(v)}>Edit</button>
                          <button style={btnDanger} onClick={() => handleDelete(v.id)}>Delete</button>
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
                      <td style={{ padding: '8px 10px' }}>{activeItem.difficulty}</td>
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
