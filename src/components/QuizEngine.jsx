import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Trophy, ThumbsUp, BookOpen, HelpCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { recordEvent } from '../lib/progressService'
import FillBlankEngine from './FillBlankEngine'

export default function QuizEngine({ courseKey }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [hoveredOption, setHoveredOption] = useState(null)

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
      recordEvent(supabase, user.id, courseKey, 'quiz_completed', `Quiz: ${courseKey}`)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setHoveredOption(null)
    }
  }
  if (loading) {
    return (
      <div style={styles.card}>
        <div className="skeleton" style={{ height: '16px', width: '80px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '6px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '24px', marginBottom: '20px' }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '10px' }} />
        ))}
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div style={{ ...styles.card, ...styles.emptyCard }}>
        <HelpCircle size={32} style={{ color: 'var(--color-text-3)', marginBottom: '10px' }} />
        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No questions yet</p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>Quiz questions for this section haven't been added yet.</p>
      </div>
    )
  }

  const q = questions[current]
  const letters = ['A', 'B', 'C', 'D']
  const pct = ((current + 1) / questions.length) * 100

  // Fill-in-the-blank question type
  if (q.question_type === 'fitb') {
    return (
      <FillBlankEngine
        question={q}
        current={current}
        total={questions.length}
        score={score}
        onComplete={(isCorrect) => {
          if (isCorrect) setScore(s => s + 1)
          // Auto-advance after a short delay
          setTimeout(() => {
            if (current + 1 >= questions.length) {
              setFinished(true)
              recordEvent(supabase, user.id, courseKey, 'quiz_completed', `Quiz: ${courseKey}`)
            } else {
              setCurrent(c => c + 1)
              setSelected(null)
              setHoveredOption(null)
            }
          }, 1800)
        }}
      />
    )
  }

  if (finished) {
    const isPerfect = score === questions.length
    const isGood = score > questions.length / 2
    const ResultIcon = isPerfect ? Trophy : isGood ? ThumbsUp : BookOpen
    const resultColor = isPerfect ? 'var(--color-accent)' : isGood ? '#166534' : 'var(--color-text-2)'

    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <ResultIcon size={48} style={{ color: resultColor, marginBottom: '14px' }} />
          <div style={styles.resultTitle}>Quiz complete!</div>
          <div style={styles.resultScore}>
            You scored{' '}
            <strong style={{ color: resultColor }}>{score}</strong>
            {' '}out of{' '}
            <strong>{questions.length}</strong>
          </div>
          {isPerfect && (
            <p style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '6px', fontWeight: 500 }}>
              Perfect score! Outstanding work 🎉
            </p>
          )}
        </div>
        <button style={styles.btn} onClick={fetchQuestions}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <div style={styles.progressHeader}>
        <span style={styles.progressText}>Question {current + 1} of {questions.length}</span>
        <span style={styles.scoreText}>{score} correct</span>
      </div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${pct}%` }} />
      </div>

      <p style={styles.question}>{q.question}</p>

      <div style={styles.options}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct_answer_index
          const isSelected = i === selected
          const isHovered = hoveredOption === i && selected === null

          let optStyle = { ...styles.option }
          let letterStyle = { ...styles.letter }

          if (selected !== null) {
            if (isCorrect) {
              optStyle = { ...optStyle, ...styles.optionCorrect }
              letterStyle = { ...letterStyle, ...styles.letterCorrect }
            } else if (isSelected) {
              optStyle = { ...optStyle, ...styles.optionWrong }
              letterStyle = { ...letterStyle, ...styles.letterWrong }
            }
          } else if (isHovered) {
            optStyle = { ...optStyle, ...styles.optionHover }
          }

          return (
            <div
              key={i}
              style={optStyle}
              onClick={() => handleSelect(i)}
              onMouseEnter={() => selected === null && setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <span style={letterStyle}>{letters[i]}</span>
              <span style={{ flex: 1 }}>{opt}</span>
              {selected !== null && isCorrect && (
                <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              )}
              {selected !== null && isSelected && !isCorrect && (
                <XCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              )}
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
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px',
    maxWidth: '580px',
    boxShadow: 'var(--shadow-elevated)',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '48px 28px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressText: { fontSize: '12px', color: 'var(--color-text-3)', fontWeight: 500 },
  scoreText: { fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 },
  progressBar: {
    height: '6px',
    background: 'rgba(0,0,0,0.08)',
    borderRadius: '999px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--color-accent), #0ea5e9)',
    borderRadius: '999px',
    transition: 'width var(--transition-progress)',
  },
  question: {
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.6,
    marginBottom: '20px',
    color: 'var(--color-text)',
  },
  options: { display: 'flex', flexDirection: 'column', gap: '10px' },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    background: 'rgba(255,255,255,0.5)',
    color: 'var(--color-text)',
  },
  optionHover: {
    background: 'rgba(37,99,235,0.06)',
    borderColor: 'rgba(37,99,235,0.3)',
  },
  optionCorrect: {
    border: '1px solid var(--color-success)',
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  },
  optionWrong: {
    border: '1px solid var(--color-danger)',
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
  },
  letter: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    border: '1.5px solid var(--color-border-strong)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
    transition: 'all var(--transition-fast)',
  },
  letterCorrect: {
    background: 'var(--color-success)',
    borderColor: 'var(--color-success)',
    color: 'white',
  },
  letterWrong: {
    background: 'var(--color-danger)',
    borderColor: 'var(--color-danger)',
    color: 'white',
  },
  btnNext: {
    marginTop: '20px',
    padding: '11px 20px',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'background var(--transition-base)',
    width: '100%',
  },
  btn: {
    marginTop: '8px',
    padding: '11px 20px',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'background var(--transition-base)',
    width: '100%',
  },
  resultTitle: { fontSize: '22px', fontWeight: 700, marginBottom: '8px' },
  resultScore: { fontSize: '15px', color: 'var(--color-text-2)', marginBottom: '4px' },
}
