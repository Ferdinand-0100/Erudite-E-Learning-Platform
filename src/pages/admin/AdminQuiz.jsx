import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import TagInput from '../../components/admin/TagInput'
import FillBlankEditor from '../../components/admin/FillBlankEditor'
import { validateQuestion, validateAnswerIndex } from '../../lib/adminValidators'
import { useAppState } from '../../lib/AppStateContext'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyPackageForm = { title: '', description: '', difficulty: 'Beginner', tags: [], sort_order: 0 }
const emptyMCQ = { question: '', options: ['', '', '', ''], correct_answer_index: 0, explanation: '', sort_order: 0 }
const emptyFITB = { paragraph: '', answers: [], sort_order: 0 }

// ── Draft persistence helpers ─────────────────────────────────────────────────

const inputStyle = { width: '100%', padding: '8px 10px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', background: 'var(--color-surface)', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--color-text-2)' }
const btnPrimary = { padding: '8px 16px', background: 'var(--color-accent)', color: '#fff', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }
const btnSecondary = { padding: '8px 16px', background: 'var(--color-surface)', color: 'var(--color-text-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }
const btnDanger = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-danger)', border: '2px solid var(--color-danger)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
const btnEdit = { padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-secondary)', border: '2px solid var(--color-secondary)', borderRadius: 'var(--radius-wobbly-sm)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
const OPTION_LABELS = ['Option A', 'Option B', 'Option C', 'Option D']

export default function AdminQuiz() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [packages, setPackages] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Package form
  const [pkgForm, setPkgForm, clearPkgForm] = useAppState('admin-quiz-pkg-form', emptyPackageForm)
  const [editingPkgId, setEditingPkgId] = useState(null)
  const [pkgSubmitting, setPkgSubmitting] = useState(false)

  // Selected package (drill-in view) — restored from sessionStorage on mount
  const [selectedPkg, setSelectedPkg, clearSelectedPkg] = useAppState('admin-quiz-selected-pkg', null)
  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)

  // Question form
  const [questionType, setQuestionType] = useAppState('admin-quiz-q-type', 'mcq')
  const [mcqForm, setMcqForm, clearMcqForm] = useAppState('admin-quiz-mcq-form', emptyMCQ)
  const [fitbForm, setFitbForm, clearFitbForm] = useAppState('admin-quiz-fitb-form', emptyFITB)
  const [editingQId, setEditingQId] = useState(null)
  const [qSubmitting, setQSubmitting] = useState(false)
  const [qError, setQError] = useState(null)

  useEffect(() => { fetchPackages() }, [courseKey])

  // Re-fetch questions when selectedPkg changes
  useEffect(() => {
    if (selectedPkg?.id) fetchQuestions(selectedPkg.id)
  }, [selectedPkg?.id])

  useEffect(() => {
    supabase.from('quiz_packages').select('tags').then(({ data }) => {
      setAllTags([...new Set((data || []).flatMap(p => p.tags || []))].sort())
    })
  }, [packages])

  async function fetchPackages() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('quiz_packages')
      .select('*, quiz_questions(count)')
      .eq('course_key', courseKey)
      .order('sort_order')
    if (err) setError(err.message)
    else setPackages((data || []).map(p => ({ ...p, question_count: p.quiz_questions?.[0]?.count ?? 0 })))
    setLoading(false)
  }

  async function fetchQuestions(pkgId) {
    setQLoading(true)
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('package_id', pkgId)
      .order('sort_order')
    setQuestions(data || [])
    setQLoading(false)
  }

  function openPackage(pkg) {
    setSelectedPkg(pkg)
    setEditingQId(null)
    setQError(null)
    fetchQuestions(pkg.id)
  }

  function closePackage() {
    clearSelectedPkg()
    setQuestions([])
    setEditingQId(null)
    setQError(null)
  }

  // ── Package CRUD ──────────────────────────────────────────

  async function handlePkgSubmit(e) {
    e.preventDefault()
    if (!pkgForm.title.trim()) { setError('Title is required'); return }
    setPkgSubmitting(true)
    setError(null)
    const payload = { course_key: courseKey, title: pkgForm.title.trim(), description: pkgForm.description.trim() || null, difficulty: pkgForm.difficulty, tags: pkgForm.tags, sort_order: pkgForm.sort_order }
    let err
    if (editingPkgId) { ;({ error: err } = await supabase.from('quiz_packages').update(payload).eq('id', editingPkgId)) }
    else { ;({ error: err } = await supabase.from('quiz_packages').insert(payload)) }
    if (err) setError(err.message)
    else { setEditingPkgId(null); clearPkgForm(); await fetchPackages() }
    setPkgSubmitting(false)
  }

  function startEditPkg(pkg) {
    setEditingPkgId(pkg.id)
    setPkgForm({ title: pkg.title, description: pkg.description || '', difficulty: pkg.difficulty, tags: pkg.tags || [], sort_order: pkg.sort_order })
    setError(null)
  }

  async function handleDeletePkg(id) {
    if (!window.confirm('Delete this quiz package and all its questions?')) return
    const { error: err } = await supabase.from('quiz_packages').delete().eq('id', id)
    if (err) setError(err.message)
    else await fetchPackages()
  }

  // ── Question CRUD ─────────────────────────────────────────

  async function handleQSubmit(e) {
    e.preventDefault()
    setQError(null)
    let payload
    if (questionType === 'mcq') {
      const qCheck = validateQuestion(mcqForm)
      if (!qCheck.valid) { setQError(qCheck.error); return }
      const aCheck = validateAnswerIndex(mcqForm.correct_answer_index)
      if (!aCheck.valid) { setQError(aCheck.error); return }
      payload = { package_id: selectedPkg.id, course_key: courseKey, question_type: 'mcq', question: mcqForm.question.trim(), options: mcqForm.options, correct_answer_index: mcqForm.correct_answer_index, explanation: mcqForm.explanation.trim() || null, sort_order: mcqForm.sort_order }
    } else {
      if (!fitbForm.paragraph.trim()) { setQError('Paragraph text is required.'); return }
      if (fitbForm.answers.length === 0) { setQError('Add at least one blank.'); return }
      if (fitbForm.answers.some(a => !a.trim())) { setQError('All blanks must have an answer.'); return }
      payload = { package_id: selectedPkg.id, course_key: courseKey, question_type: 'fitb', question: fitbForm.paragraph.trim(), options: fitbForm.answers, correct_answer_index: 0, explanation: null, sort_order: fitbForm.sort_order }
    }
    setQSubmitting(true)
    let err
    if (editingQId) { ;({ error: err } = await supabase.from('quiz_questions').update(payload).eq('id', editingQId)) }
    else { ;({ error: err } = await supabase.from('quiz_questions').insert(payload)) }
    if (err) setQError(err.message)
    else { setEditingQId(null); clearMcqForm(); clearFitbForm(); await fetchQuestions(selectedPkg.id) }
    setQSubmitting(false)
  }

  function startEditQ(q) {
    setEditingQId(q.id)
    setQError(null)
    const type = q.question_type || 'mcq'
    setQuestionType(type)
    if (type === 'fitb') setFitbForm({ paragraph: q.question, answers: Array.isArray(q.options) ? [...q.options] : [], sort_order: q.sort_order })
    else setMcqForm({ question: q.question, options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''], correct_answer_index: q.correct_answer_index, explanation: q.explanation || '', sort_order: q.sort_order })
  }

  function cancelEditQ() { setEditingQId(null); clearMcqForm(); clearFitbForm(); setQError(null) }

  async function handleDeleteQ(id) {
    if (!window.confirm('Delete this question?')) return
    const { error: err } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (err) setQError(err.message)
    else await fetchQuestions(selectedPkg.id)
  }

  const difficultyColors = { Beginner: { bg: '#dcfce7', color: '#166534' }, Intermediate: { bg: '#fef3c7', color: '#92400e' }, Advanced: { bg: '#fee2e2', color: '#991b1b' } }

  // ── RENDER: Package drill-in ──────────────────────────────

  if (selectedPkg) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: 960 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={closePackage} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedPkg.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: 0 }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {qError && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{qError}</div>}

        {/* Add/Edit question form */}
        <form onSubmit={handleQSubmit} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{editingQId ? 'Edit Question' : 'Add Question'}</h2>
            <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
              {[{ key: 'mcq', label: 'Multiple Choice' }, { key: 'fitb', label: 'Fill in the Blank' }].map(({ key, label }) => (
                <button key={key} type="button" onClick={() => { setQuestionType(key); setQError(null) }} style={{ padding: '5px 14px', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: questionType === key ? 'var(--color-accent)' : 'transparent', color: questionType === key ? 'white' : 'var(--color-text-2)', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {questionType === 'mcq' && (
            <>
              <div>
                <label style={labelStyle}>Question *</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} name="question" value={mcqForm.question} onChange={e => { const v = e.target.value; setMcqForm(f => ({ ...f, question: v })) }} required placeholder="Enter question text" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                {OPTION_LABELS.map((label, i) => (
                  <div key={i}>
                    <label style={labelStyle}>{label} *</label>
                    <input style={inputStyle} value={mcqForm.options[i]} onChange={e => { const opts = [...mcqForm.options]; opts[i] = e.target.value; setMcqForm(f => ({ ...f, options: opts })) }} required placeholder={label} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 'var(--space-3)' }}>
                <div>
                  <label style={labelStyle}>Correct Answer</label>
                  <select style={inputStyle} value={mcqForm.correct_answer_index} onChange={e => { const v = Number(e.target.value); setMcqForm(f => ({ ...f, correct_answer_index: v })) }}>
                    <option value={0}>0 (A)</option><option value={1}>1 (B)</option><option value={2}>2 (C)</option><option value={3}>3 (D)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Explanation (optional)</label>
                  <textarea style={{ ...inputStyle, minHeight: 38, resize: 'vertical' }} value={mcqForm.explanation} onChange={e => { const v = e.target.value; setMcqForm(f => ({ ...f, explanation: v })) }} placeholder="Optional explanation" />
                </div>
                <div>
                  <label style={labelStyle}>Sort order</label>
                  <input style={inputStyle} type="number" value={mcqForm.sort_order} onChange={e => { const v = Number(e.target.value); setMcqForm(f => ({ ...f, sort_order: v })) }} />
                </div>
              </div>
            </>
          )}

          {questionType === 'fitb' && (
            <>
              <FillBlankEditor value={{ paragraph: fitbForm.paragraph, answers: fitbForm.answers }} onChange={({ paragraph, answers }) => { setFitbForm(f => ({ ...f, paragraph, answers })) }} />
              <div style={{ maxWidth: 120 }}>
                <label style={labelStyle}>Sort order</label>
                <input style={inputStyle} type="number" value={fitbForm.sort_order} onChange={e => { const v = Number(e.target.value); setFitbForm(f => ({ ...f, sort_order: v })) }} />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="submit" style={btnPrimary} disabled={qSubmitting}>{editingQId ? 'Update Question' : 'Add Question'}</button>
            {editingQId && <button type="button" style={btnSecondary} onClick={cancelEditQ}>Cancel</button>}
          </div>
        </form>

        {/* Question list */}
        {qLoading ? (
          <p style={{ color: 'var(--color-text-2)', fontSize: 14 }}>Loading…</p>
        ) : questions.length === 0 ? (
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No questions yet. Add your first question above.</p>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Question</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Order</th>
                  <th style={{ padding: '8px 10px' }} />
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: q.question_type === 'fitb' ? '#fef3c7' : '#dbeafe', color: q.question_type === 'fitb' ? '#92400e' : '#1e40af' }}>
                        {q.question_type === 'fitb' ? 'Fill Blank' : 'MCQ'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', maxWidth: 400 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>{q.sort_order}</td>
                    <td style={{ padding: '8px 10px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button style={btnEdit} onClick={() => startEditQ(q)}>Edit</button>
                      <button style={btnDanger} onClick={() => handleDeleteQ(q.id)}>Delete</button>
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

  // ── RENDER: Package list ──────────────────────────────────

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 960 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Quiz Packages</h1>
      <div style={{ marginBottom: 'var(--space-6)' }}><CourseKeySelector value={courseKey} onChange={setCourseKey} /></div>

      {error && <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 14 }}>{error}</div>}

      {/* Package form */}
      <form onSubmit={handlePkgSubmit} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{editingPkgId ? 'Edit Package' : 'Create Quiz Package'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Package name *</label>
            <input style={inputStyle} value={pkgForm.title} onChange={e => { const v = e.target.value; setPkgForm(f => ({ ...f, title: v })) }} required placeholder="e.g. Grammar Fundamentals" />
          </div>
          <div>
            <label style={labelStyle}>Difficulty</label>
            <select style={inputStyle} value={pkgForm.difficulty} onChange={e => { const v = e.target.value; setPkgForm(f => ({ ...f, difficulty: v })) }}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Description (optional)</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={pkgForm.description} onChange={e => { const v = e.target.value; setPkgForm(f => ({ ...f, description: v })) }} placeholder="Brief description of this quiz package" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Tags</label>
            <TagInput value={pkgForm.tags} onChange={tags => { setPkgForm(f => ({ ...f, tags })) }} existingTags={allTags} placeholder="Add tags…" />
          </div>
          <div>
            <label style={labelStyle}>Sort order</label>
            <input style={inputStyle} type="number" value={pkgForm.sort_order} onChange={e => { const v = Number(e.target.value); setPkgForm(f => ({ ...f, sort_order: v })) }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={pkgSubmitting}>{editingPkgId ? 'Update Package' : 'Create Package'}</button>
          {editingPkgId && <button type="button" style={btnSecondary} onClick={() => { setEditingPkgId(null); clearPkgForm() }}>Cancel</button>}
        </div>
      </form>

      {/* Package list */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 130 }} />)}
        </div>
      ) : packages.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No quiz packages yet. Create your first one above.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {packages.map(pkg => {
            const dc = difficultyColors[pkg.difficulty] || difficultyColors.Beginner
            return (
              <div key={pkg.id} style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-wobbly-sm)', padding: 18, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{pkg.title}</div>
                    {pkg.description && <div style={{ fontSize: 12, color: 'var(--color-text-3)', lineHeight: 1.5 }}>{pkg.description}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: dc.bg, color: dc.color, flexShrink: 0 }}>{pkg.difficulty}</span>
                </div>
                {(pkg.tags || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {pkg.tags.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: 'rgba(37,99,235,0.08)', color: 'var(--color-accent)', border: '1px solid rgba(37,99,235,0.15)' }}>{t}</span>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button style={{ ...btnPrimary, flex: 1, fontSize: 13, padding: '7px 12px' }} onClick={() => openPackage(pkg)}>
                    Open ({pkg.question_count ?? '…'} Qs)
                  </button>
                  <button style={{ ...btnEdit, padding: '7px 10px' }} onClick={() => startEditPkg(pkg)} title="Edit package"><Edit2 size={13} /></button>
                  <button style={{ ...btnDanger, padding: '7px 10px' }} onClick={() => handleDeletePkg(pkg.id)} title="Delete package"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
