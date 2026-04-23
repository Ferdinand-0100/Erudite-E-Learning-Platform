import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import FillBlankEditor from '../../components/admin/FillBlankEditor'
import { validateQuestion, validateAnswerIndex } from '../../lib/adminValidators'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyMCQ = {
  question: '',
  options: ['', '', '', ''],
  correct_answer_index: 0,
  explanation: '',
  sort_order: 0,
}

const emptyFITB = {
  paragraph: '',
  answers: [],
  sort_order: 0,
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  background: 'var(--color-surface)',
  boxSizing: 'border-box',
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

const OPTION_LABELS = ['Option A', 'Option B', 'Option C', 'Option D']

export default function AdminQuiz() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Question type tab
  const [questionType, setQuestionType] = useState('mcq') // 'mcq' | 'fitb'

  // MCQ form state
  const [mcqForm, setMcqForm] = useState(emptyMCQ)

  // FITB form state
  const [fitbForm, setFitbForm] = useState(emptyFITB)

  useEffect(() => {
    fetchQuestions()
  }, [courseKey])

  async function fetchQuestions() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('course_key', courseKey)
      .order('sort_order')
    if (err) setError(err.message)
    else setQuestions(data || [])
    setLoading(false)
  }

  function handleMCQField(e) {
    const { name, value } = e.target
    if (name === 'sort_order') setMcqForm(f => ({ ...f, sort_order: Number(value) }))
    else if (name === 'correct_answer_index') setMcqForm(f => ({ ...f, correct_answer_index: Number(value) }))
    else setMcqForm(f => ({ ...f, [name]: value }))
  }

  function handleOption(index, value) {
    setMcqForm(f => {
      const options = [...f.options]
      options[index] = value
      return { ...f, options }
    })
  }

  function startEdit(q) {
    setEditingId(q.id)
    setError(null)
    const type = q.question_type || 'mcq'
    setQuestionType(type)
    if (type === 'fitb') {
      setFitbForm({
        paragraph: q.question,
        answers: Array.isArray(q.options) ? [...q.options] : [],
        sort_order: q.sort_order,
      })
    } else {
      setMcqForm({
        question: q.question,
        options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation || '',
        sort_order: q.sort_order,
      })
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setMcqForm(emptyMCQ)
    setFitbForm(emptyFITB)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    let payload

    if (questionType === 'mcq') {
      const qCheck = validateQuestion(mcqForm)
      if (!qCheck.valid) { setError(qCheck.error); return }
      const aCheck = validateAnswerIndex(mcqForm.correct_answer_index)
      if (!aCheck.valid) { setError(aCheck.error); return }
      payload = {
        course_key: courseKey,
        question_type: 'mcq',
        question: mcqForm.question.trim(),
        options: mcqForm.options,
        correct_answer_index: mcqForm.correct_answer_index,
        explanation: mcqForm.explanation.trim() || null,
        sort_order: mcqForm.sort_order,
      }
    } else {
      if (!fitbForm.paragraph.trim()) { setError('Paragraph text is required.'); return }
      if (fitbForm.answers.length === 0) { setError('Add at least one blank.'); return }
      if (fitbForm.answers.some(a => !a.trim())) { setError('All blanks must have an answer.'); return }
      payload = {
        course_key: courseKey,
        question_type: 'fitb',
        question: fitbForm.paragraph.trim(),
        options: fitbForm.answers,
        correct_answer_index: 0, // not used for fitb
        explanation: null,
        sort_order: fitbForm.sort_order,
      }
    }

    setSubmitting(true)
    let err
    if (editingId) {
      ;({ error: err } = await supabase.from('quiz_questions').update(payload).eq('id', editingId))
    } else {
      ;({ error: err } = await supabase.from('quiz_questions').insert(payload))
    }

    if (err) {
      setError(err.message)
    } else {
      setEditingId(null)
      setMcqForm(emptyMCQ)
      setFitbForm(emptyFITB)
      await fetchQuestions()
    }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this question?')) return
    const { error: err } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (err) setError(err.message)
    else await fetchQuestions()
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 960 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Quiz Questions</h1>

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
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
            {editingId ? 'Edit Question' : 'Add Question'}
          </h2>

          {/* Question type tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            {[
              { key: 'mcq', label: 'Multiple Choice' },
              { key: 'fitb', label: 'Fill in the Blank' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setQuestionType(key); setError(null) }}
                style={{
                  padding: '5px 14px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: questionType === key ? 'var(--color-accent)' : 'transparent',
                  color: questionType === key ? 'white' : 'var(--color-text-2)',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* MCQ fields */}
        {questionType === 'mcq' && (
          <>
            <div>
              <label style={labelStyle}>Question *</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                name="question"
                value={mcqForm.question}
                onChange={handleMCQField}
                required
                placeholder="Enter question text"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {OPTION_LABELS.map((label, i) => (
                <div key={i}>
                  <label style={labelStyle}>{label} *</label>
                  <input
                    style={inputStyle}
                    value={mcqForm.options[i]}
                    onChange={e => handleOption(i, e.target.value)}
                    required
                    placeholder={label}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 'var(--space-3)' }}>
              <div>
                <label style={labelStyle}>Correct Answer</label>
                <select style={inputStyle} name="correct_answer_index" value={mcqForm.correct_answer_index} onChange={handleMCQField}>
                  <option value={0}>0 (A)</option>
                  <option value={1}>1 (B)</option>
                  <option value={2}>2 (C)</option>
                  <option value={3}>3 (D)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Explanation (optional)</label>
                <textarea style={{ ...inputStyle, minHeight: 38, resize: 'vertical' }} name="explanation" value={mcqForm.explanation} onChange={handleMCQField} placeholder="Optional explanation" />
              </div>
              <div>
                <label style={labelStyle}>Sort order</label>
                <input style={inputStyle} type="number" name="sort_order" value={mcqForm.sort_order} onChange={handleMCQField} />
              </div>
            </div>
          </>
        )}

        {/* FITB fields */}
        {questionType === 'fitb' && (
          <>
            <FillBlankEditor
              value={{ paragraph: fitbForm.paragraph, answers: fitbForm.answers }}
              onChange={({ paragraph, answers }) => setFitbForm(f => ({ ...f, paragraph, answers }))}
            />
            <div style={{ maxWidth: 120 }}>
              <label style={labelStyle}>Sort order</label>
              <input
                style={inputStyle}
                type="number"
                value={fitbForm.sort_order}
                onChange={e => setFitbForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" style={btnPrimary} disabled={submitting}>
            {editingId ? 'Update Question' : 'Add Question'}
          </button>
          {editingId && (
            <button type="button" style={btnSecondary} onClick={cancelEdit}>Cancel</button>
          )}
        </div>
      </form>

      {/* Question list */}
      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : questions.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No questions for this course key.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
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
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: q.question_type === 'fitb' ? '#fef3c7' : '#dbeafe',
                    color: q.question_type === 'fitb' ? '#92400e' : '#1e40af',
                  }}>
                    {q.question_type === 'fitb' ? 'Fill Blank' : 'MCQ'}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', maxWidth: 400 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.question}
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>{q.sort_order}</td>
                <td style={{ padding: '8px 10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button style={btnEdit} onClick={() => startEdit(q)}>Edit</button>
                  <button style={btnDanger} onClick={() => handleDelete(q.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
