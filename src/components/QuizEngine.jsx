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
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setFinished(false)

    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('course_key', courseKey)
      .order('created_at')

    setQuestions(data || [])
    setLoading(false)
  }

  const handleSelect = (idx) => {

    if (selected !== null) return

    setSelected(idx)

    if (idx === questions[current].correct_answer_index) {
      setScore(s => s + 1)
    }

    supabase.from('quiz_attempts').insert({
      student_id: user.id,
      question_id: questions[current].id,
      chosen_index: idx,
    })
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

  if (questions.length === 0)
    return <p style={styles.muted}>No questions available yet for this section.</p>

  const q = questions[current]

  const letters = ['A', 'B', 'C', 'D']

  if (finished) {

    return (
      <div style={styles.card}>

        <div style={styles.resultIcon}>
          {score === questions.length ? '🎉' : score > questions.length / 2 ? '👍' : '📚'}
        </div>

        <div style={styles.resultTitle}>Quiz complete!</div>

        <div style={styles.resultScore}>
          You scored <strong>{score}</strong> out of <strong>{questions.length}</strong>
        </div>

        <button style={styles.btn} onClick={fetchQuestions}>
          Try again
        </button>

      </div>
    )
  }

  return (

    <div style={styles.card}>

      <div style={styles.progressText}>
        Question {current + 1} of {questions.length}
      </div>

      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${((current + 1) / questions.length) * 100}%`
          }}
        />
      </div>

      <p style={styles.question}>{q.question}</p>

      <div style={styles.options}>

        {q.options.map((opt, i) => {

          let optStyle = { ...styles.option }

          if (selected !== null) {
            if (i === q.correct_answer_index)
              optStyle = { ...optStyle, ...styles.correct }
            else if (i === selected)
              optStyle = { ...optStyle, ...styles.wrong }
          }

          return (
            <div
              key={i}
              style={optStyle}
              onClick={() => handleSelect(i)}
            >
              <span style={styles.letter}>{letters[i]}</span>
              {opt}
            </div>
          )
        })}

      </div>

      {selected !== null && (
        <button style={styles.btnNext} onClick={handleNext}>
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
    padding: '28px',
    maxWidth: '560px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  },

  progressText: {
    fontSize: '12px',
    color: 'var(--color-text-3)',
    marginBottom: '8px'
  },

  progressBar: {
    height: '4px',
    background: 'var(--color-border)',
    borderRadius: '999px',
    marginBottom: '22px',
    overflow: 'hidden'
  },

  progressFill: {
    height: '100%',
    background: 'var(--color-accent)',
    transition: 'width 0.3s ease'
  },

  question: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.6,
    marginBottom: '20px'
  },

  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  correct: {
    border: '1px solid var(--color-success)',
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  },

  wrong: {
    border: '1px solid var(--color-danger)',
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
  },

  letter: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600
  },

  btnNext: {
    marginTop: '18px',
    padding: '10px 18px',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },

  btn: {
    marginTop: '18px',
    padding: '10px 18px',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },

  resultIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },

  resultTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '6px'
  },

  resultScore: {
    fontSize: '14px',
    color: 'var(--color-text-2)',
    marginBottom: '16px'
  },

  muted: {
    fontSize: '14px',
    color: 'var(--color-text-3)',
    padding: '24px 0'
  }
}