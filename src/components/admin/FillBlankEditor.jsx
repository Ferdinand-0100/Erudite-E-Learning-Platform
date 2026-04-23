import { useRef, useState } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'

/**
 * FillBlankEditor
 * Rich editor for fill-in-the-blank questions.
 *
 * Props:
 *   value: { paragraph: string, answers: string[] }
 *   onChange({ paragraph, answers }): void
 *
 * The paragraph uses {{1}}, {{2}}, ... as blank tokens.
 */
export default function FillBlankEditor({ value, onChange }) {
  const textareaRef = useRef(null)
  const { paragraph = '', answers = [] } = value

  function insertBlank() {
    const ta = textareaRef.current
    if (!ta) return

    const nextIndex = answers.length + 1
    const token = `{{${nextIndex}}}`
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newParagraph = paragraph.slice(0, start) + token + paragraph.slice(end)

    onChange({
      paragraph: newParagraph,
      answers: [...answers, ''],
    })

    // Restore cursor after the inserted token
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function updateAnswer(index, val) {
    const next = [...answers]
    next[index] = val
    onChange({ paragraph, answers: next })
  }

  function removeBlank(index) {
    // Remove the {{n}} token from paragraph and shift subsequent tokens
    const tokenToRemove = `{{${index + 1}}}`
    let newParagraph = paragraph.replace(tokenToRemove, '')

    // Shift all higher-numbered tokens down by 1
    for (let i = index + 2; i <= answers.length; i++) {
      newParagraph = newParagraph.replace(`{{${i}}}`, `{{${i - 1}}}`)
    }

    const newAnswers = answers.filter((_, i) => i !== index)
    onChange({ paragraph: newParagraph, answers: newAnswers })
  }

  // Parse paragraph into segments for preview
  const previewSegments = parseParagraph(paragraph, answers.length)

  return (
    <div style={styles.container}>
      {/* Paragraph editor */}
      <div style={styles.editorHeader}>
        <label style={styles.label}>Paragraph text</label>
        <button
          type="button"
          onClick={insertBlank}
          style={styles.insertBtn}
          title="Insert a blank at cursor position"
        >
          <PlusCircle size={14} style={{ marginRight: 5 }} />
          Insert Blank
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={paragraph}
        onChange={e => onChange({ paragraph: e.target.value, answers })}
        style={styles.textarea}
        placeholder="Type your paragraph here, then click 'Insert Blank' to add a blank at the cursor position..."
        rows={5}
      />
      <p style={styles.hint}>
        Blanks appear as <code style={styles.code}>{'{{1}}'}</code>, <code style={styles.code}>{'{{2}}'}</code>, etc. Click "Insert Blank" with your cursor in the text to place one.
      </p>

      {/* Answer fields */}
      {answers.length > 0 && (
        <div style={styles.answersSection}>
          <div style={styles.label}>Answers for each blank</div>
          <div style={styles.answerList}>
            {answers.map((ans, i) => (
              <div key={i} style={styles.answerRow}>
                <div style={styles.blankBadge}>Blank {i + 1}</div>
                <input
                  style={styles.answerInput}
                  value={ans}
                  onChange={e => updateAnswer(i, e.target.value)}
                  placeholder={`Answer for blank ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeBlank(i)}
                  style={styles.removeBtn}
                  title="Remove this blank"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live preview */}
      {paragraph && (
        <div style={styles.preview}>
          <div style={styles.previewLabel}>Preview</div>
          <div style={styles.previewText}>
            {previewSegments.map((seg, i) =>
              seg.type === 'text' ? (
                <span key={i}>{seg.value}</span>
              ) : (
                <span key={i} style={styles.previewBlank}>
                  {answers[seg.index] || `blank ${seg.index + 1}`}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Splits a paragraph string into text and blank segments */
export function parseParagraph(paragraph, blankCount) {
  const segments = []
  let remaining = paragraph
  let pos = 0

  while (remaining.length > 0) {
    // Find the next {{n}} token
    const match = remaining.match(/\{\{(\d+)\}\}/)
    if (!match) {
      segments.push({ type: 'text', value: remaining })
      break
    }
    const before = remaining.slice(0, match.index)
    if (before) segments.push({ type: 'text', value: before })
    segments.push({ type: 'blank', index: parseInt(match[1]) - 1 })
    remaining = remaining.slice(match.index + match[0].length)
  }

  return segments
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 12 },
  editorHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)' },
  insertBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    fontFamily: 'inherit',
    lineHeight: 1.7,
    resize: 'vertical',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxSizing: 'border-box',
  },
  hint: { fontSize: 12, color: 'var(--color-text-3)', margin: 0 },
  code: {
    background: 'rgba(37,99,235,0.08)',
    color: 'var(--color-accent)',
    padding: '1px 5px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  answersSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  answerList: { display: 'flex', flexDirection: 'column', gap: 8 },
  answerRow: { display: 'flex', alignItems: 'center', gap: 10 },
  blankBadge: {
    flexShrink: 0,
    padding: '4px 10px',
    background: 'rgba(37,99,235,0.1)',
    color: 'var(--color-accent)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    fontWeight: 700,
    minWidth: 64,
    textAlign: 'center',
  },
  answerInput: {
    flex: 1,
    padding: '7px 10px',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    fontFamily: 'inherit',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
  },
  removeBtn: {
    flexShrink: 0,
    background: 'none',
    border: '1px solid var(--color-danger)',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  preview: {
    background: 'rgba(37,99,235,0.04)',
    border: '1px solid rgba(37,99,235,0.15)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
  },
  previewLabel: { fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' },
  previewText: { fontSize: 15, lineHeight: 1.8, color: 'var(--color-text)' },
  previewBlank: {
    display: 'inline-block',
    minWidth: 80,
    padding: '1px 10px',
    background: 'rgba(37,99,235,0.12)',
    color: 'var(--color-accent)',
    borderRadius: 4,
    fontWeight: 600,
    border: '1px dashed rgba(37,99,235,0.4)',
    margin: '0 2px',
  },
}
