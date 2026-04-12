import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'
import CourseKeySelector from '../../components/admin/CourseKeySelector'
import { validateQuestion, validateAnswerIndex } from '../../lib/adminValidators'

const courseKeys = Object.keys(COURSE_CONFIG)
const firstKey = (() => {
  const c = courseKeys[0]
  const sub = COURSE_CONFIG[c].defaultSubclass
  const lvl = COURSE_CONFIG[c].subclasses[sub].defaultLevel
  return buildCourseKey(c, sub, lvl)
})()

const emptyForm = {
  question: '',
  options: ['', '', '', ''],
  correct_answer_index: 0,
  explanation: '',
  sort_order: 0,
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

const OPTION_LABELS = ['Option A', 'Option B', 'Option C', 'Option D']

export default function AdminQuiz() {
  const [courseKey, setCourseKey] = useState(firstKey)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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

  function handleField(e) {
    const { name, value } = e.target
    if (name === 'sort_order') {
      setForm(f => ({ ...f, sort_order: Number(value) }))
    } else if (name === 'correct_answer_index') {
      setForm(f => ({ ...f, correct_answer_index: Number(value) }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  function handleOption(index, value) {
    setForm(f => {
      const options = [...f.options]
      options[index] = value
      return { ...f, options }
    })
  }

  function startEdit(q) {
    setEditingId(q.id)
    setForm({
      question: q.question,
      options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
      correct_answer_index: q.correct_answer_index,
      explanation: q.explanation || '',
      sort_order: q.sort_order,
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const qCheck = validateQuestion(form)
    if (!qCheck.valid) {
      setError(qCheck.error)
      return
    }
    const aCheck = validateAnswerIndex(form.correct_answer_index)
    if (!aCheck.valid) {
      setError(aCheck.error)
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      course_key: courseKey,
      question: form.question.trim(),
      options: form.options,
      correct_answer_index: form.correct_answer_index,
      explanation: form.explanation.trim() || null,
      sort_order: form.sort_order,
    }

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
      setForm(emptyForm)
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
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
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
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
          {editingId ? 'Edit Question' : 'Add Question'}
        </h2>

        <div>
          <label style={labelStyle}>Question *</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            name="question"
            value={form.question}
            onChange={handleField}
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
                value={form.options[i]}
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
            <select
              style={inputStyle}
              name="correct_answer_index"
              value={form.correct_answer_index}
              onChange={handleField}
            >
              <option value={0}>0 (A)</option>
              <option value={1}>1 (B)</option>
              <option value={2}>2 (C)</option>
              <option value={3}>3 (D)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Explanation (optional)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 38, resize: 'vertical' }}
              name="explanation"
              value={form.explanation}
              onChange={handleField}
              placeholder="Optional explanation"
            />
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
            {editingId ? 'Update Question' : 'Add Question'}
          </button>
          {editingId && (
            <button type="button" style={btnSecondary} onClick={cancelEdit}>
              Cancel
            </button>
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
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Question</th>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Correct</th>
              <th style={{ padding: '8px 10px', fontWeight: 600 }}>Order</th>
              <th style={{ padding: '8px 10px' }} />
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px 10px', maxWidth: 400 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.question}
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>{q.correct_answer_index} ({['A','B','C','D'][q.correct_answer_index]})</td>
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
