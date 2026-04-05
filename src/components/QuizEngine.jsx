import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function QuizEngine({ courseKey }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [courseKey])

  const fetchQuestions = async () => {
    setLoading(true)
    setCurrent(0); setSelected(null); setScore(0); setFinished(false)

    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('course_key', courseKey)
      .order('created_at')

    if (!error && data) setQuestions(data)
    setLoading(false)
  }

  const handleSelect = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    if (idx === questions[current].correct_answer_index) {
      setScore(s => s + 1)
    }
    // Record attempt in DB
    supabase.from('quiz_attempts').insert({
      student_id: user.id,
      question_id: questions[current].id,
      chosen_index: idx,
    }).then(() => {})
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  if (loading) return <p style={styles.muted}>Loading questions…</p>
  if (questions.length === 0) return <p style={styles.muted}>No questions available yet for this section.</p>

  const q = questions[current]
  const letters = ['A', 'B', 'C', 'D']

  if (finished) {
    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>{score === questions.length ? '🎉' : score > questions.length / 2 ? '👍' : '📚'}</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Quiz complete!</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-2)', marginBottom: '20px' }}>
            You scored <strong>{score}</strong> out of <strong>{questions.length}</strong>
          </div>
          <button style={styles.btn} onClick={fetchQuestions}>Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <div style={styles.progress}>Question {current + 1} of {questions.length}</div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>
      <p style={styles.question}>{q.question}</p>
      <div key={current} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {q.options.map((opt, i) => {
          let optStyle = { ...styles.option }
          if (selected !== null) {
            if (i === q.correct_answer_index) optStyle = { ...optStyle, ...styles.optionCorrect }
            else if (i === selected) optStyle = { ...optStyle, ...styles.optionWrong }
          } else if (i === selected) optStyle = { ...optStyle, ...styles.optionSelected }
          return (
            <div key={i} style={optStyle} onClick={() => handleSelect(i)}>
              <span style={styles.letter}>{letters[i]}</span>
              {opt}
            </div>
          )
        })}
      </div>
      {selected !== null && (
        <button style={{ ...styles.btn, marginTop: '16px' }} onClick={handleNext}>
          {current + 1 < questions.length ? 'Next question →' : 'See results →'}
        </button>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    maxWidth: '560px',
  },
  progress: { fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '8px' },
  progressBar: { height: '3px', background: 'var(--color-border)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--color-accent)', borderRadius: '2px', transition: 'width 0.3s' },
  question: { fontSize: '15px', fontWeight: 500, lineHeight: 1.5, marginBottom: '18px' },
  option: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 14px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13.5px',
    cursor: 'pointer',
    transition: 'border-color 0.12s, background 0.12s',
  },
  optionSelected: { borderColor: 'var(--color-accent)', background: 'var(--color-surface-2)' },
  optionCorrect: { borderColor: '#16a34a', background: '#dcfce7', color: '#166534' },
  optionWrong: { borderColor: '#dc2626', background: '#fee2e2', color: '#991b1b' },
  letter: {
    width: '22px', height: '22px', borderRadius: '50%',
    border: '1px solid var(--color-border-strong)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 600, flexShrink: 0,
  },
  btn: {
    padding: '9px 20px',
    background: 'var(--color-accent)',
    color: 'var(--color-accent-fg)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  muted: { fontSize: '14px', color: 'var(--color-text-3)', padding: '20px 0' },
}
