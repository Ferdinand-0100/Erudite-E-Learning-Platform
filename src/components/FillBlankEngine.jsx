import { useState } from 'react'
import { CheckCircle, XCircle, Trophy, ThumbsUp, BookOpen } from 'lucide-react'
import { parseParagraph } from './admin/FillBlankEditor'

/**
 * FillBlankEngine
 * Student-facing fill-in-the-blank question renderer.
 *
 * Props:
 *   question: quiz_questions row with question_type = 'fitb'
 *             question field: paragraph with {{1}}, {{2}}, ... tokens
 *             options field: ["answer1", "answer2", ...]
 *   onComplete(isCorrect: boolean): void
 */
export default function FillBlankEngine({ question, onComplete, current, total, score }) {
  const answers = Array.isArray(question.options) ? question.options : []
  const segments = parseParagraph(question.question, answers.length)
  const blankCount = answers.length

  const [inputs, setInputs] = useState(() => Array(blankCount).fill(''))
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState([]) // per-blank: true/false

  const pct = ((current + 1) / total) * 100

  function handleInput(index, val) {
    if (submitted) return
    setInputs(prev => {
      const next = [...prev]
      next[index] = val
      return next
    })
  }

  function handleSubmit() {
    if (submitted) return
    const res = answers.map((ans, i) =>
      inputs[i].trim().toLowerCase() === ans.trim().toLowerCase()
    )
    setResults(res)
    setSubmitted(true)
    const allCorrect = res.every(Boolean)
    onComplete(allCorrect)
  }

  const allFilled = inputs.every(v => v.trim().length > 0)

  return (
    <div style={styles.card}>
      {/* Progress */}
      <div style={styles.progressHeader}>
        <span style={styles.progressText}>Question {current + 1} of {total}</span>
        <span style={styles.scoreText}>{score} correct</span>
      </div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${pct}%` }} />
      </div>

      {/* Instruction */}
      <p style={styles.instruction}>Fill in the blanks</p>

      {/* Paragraph with inline inputs */}
      <div style={styles.paragraph}>
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i}>{seg.value}</span>
          }
          const idx = seg.index
          const isCorrect = submitted ? results[idx] : null
          return (
            <span key={i} style={styles.blankWrapper}>
              <input
                value={inputs[idx] ?? ''}
                onChange={e => handleInput(idx, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && allFilled && !submitted && handleSubmit()}
                disabled={submitted}
                style={{
                  ...styles.blankInput,
                  ...(submitted && isCorrect ? styles.blankCorrect : {}),
                  ...(submitted && !isCorrect ? styles.blankWrong : {}),
                  width: Math.max(80, (answers[idx]?.length ?? 6) * 11) + 'px',
                }}
                placeholder={`blank ${idx + 1}`}
                aria-label={`Blank ${idx + 1}`}
              />
              {submitted && isCorrect && (
                <CheckCircle size={14} style={{ color: 'var(--color-success)', marginLeft: 3, verticalAlign: 'middle', flexShrink: 0 }} />
              )}
              {submitted && !isCorrect && (
                <span style={styles.correctHint}>{answers[idx]}</span>
              )}
            </span>
          )
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          style={{ ...styles.btn, opacity: allFilled ? 1 : 0.5, cursor: allFilled ? 'pointer' : 'not-allowed' }}
          onClick={handleSubmit}
          disabled={!allFilled}
          onMouseEnter={e => { if (allFilled) { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.transform = 'translate(2px, 2px)' } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = '' }}
        >
          Check answers
        </button>
      )}

      {/* Result summary */}
      {submitted && (
        <div style={styles.resultSummary}>
          {results.every(Boolean) ? (
            <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={16} /> All correct!
            </span>
          ) : (
            <span style={{ color: 'var(--color-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={16} />
              {results.filter(Boolean).length} of {blankCount} correct — correct answers shown in green
            </span>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--color-surface)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-md)',
    padding: '28px',
    maxWidth: '680px',
    boxShadow: 'var(--shadow-elevated)',
  },
  progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 },
  scoreText: { fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 },
  progressBar: {
    height: 10,
    background: 'var(--color-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: 'var(--radius-wobbly-sm)',
    transition: 'width var(--transition-progress)',
  },
  instruction: { fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 },
  paragraph: {
    fontSize: 16,
    lineHeight: 2.4,
    color: 'var(--color-text)',
    marginBottom: 20,
    padding: '16px 18px',
    background: 'var(--color-surface-2)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
  },
  blankWrapper: { display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', margin: '0 2px' },
  blankInput: {
    display: 'inline-block',
    padding: '3px 8px',
    border: '2px solid var(--color-accent)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    outline: 'none',
    textAlign: 'center',
    transition: 'border-color var(--transition-base), background var(--transition-base)',
    verticalAlign: 'middle',
  },
  blankCorrect: {
    borderColor: 'var(--color-success)',
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  },
  blankWrong: {
    borderColor: 'var(--color-danger)',
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
  },
  correctHint: {
    display: 'inline-block',
    marginLeft: 4,
    padding: '1px 7px',
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1.5px solid var(--color-success)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 13,
    fontWeight: 600,
    verticalAlign: 'middle',
  },
  btn: {
    padding: '12px 20px',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '3px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 14,
    width: '100%',
    boxShadow: 'var(--shadow-card)',
    transition: 'background var(--transition-base), color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base)',
    cursor: 'pointer',
  },
  resultSummary: {
    marginTop: 16,
    padding: '12px 14px',
    background: 'var(--color-muted)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 14,
  },
}
