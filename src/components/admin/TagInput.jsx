import { useState, useEffect, useRef } from 'react'
import { X, Plus } from 'lucide-react'

/**
 * TagInput
 * Allows admin to add/remove tags. Shows autocomplete from existing tags.
 *
 * Props:
 *   value: string[]          — current tags
 *   onChange(tags): void
 *   existingTags: string[]   — all tags used across the platform for autocomplete
 *   placeholder?: string
 */
export default function TagInput({ value = [], onChange, existingTags = [], placeholder = 'Add tag…' }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  const suggestions = existingTags.filter(t =>
    t.toLowerCase().includes(input.toLowerCase()) && !value.includes(t)
  )

  function addTag(tag) {
    const trimmed = tag.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function removeTag(tag) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.tagArea}>
        {value.map(tag => (
          <span key={tag} style={styles.tag}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)} style={styles.removeBtn} aria-label={`Remove ${tag}`}>
              <X size={10} />
            </button>
          </span>
        ))}
        <div style={{ position: 'relative', flex: 1, minWidth: 120 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={value.length === 0 ? placeholder : ''}
            style={styles.input}
          />
          {showSuggestions && (input || suggestions.length > 0) && (
            <div style={styles.dropdown}>
              {input.trim() && !value.includes(input.trim()) && !suggestions.includes(input.trim()) && (
                <div style={styles.dropdownItem} onMouseDown={() => addTag(input)}>
                  <Plus size={12} style={{ marginRight: 6, color: 'var(--color-accent)' }} />
                  Create "<strong>{input.trim()}</strong>"
                </div>
              )}
              {suggestions.map(s => (
                <div key={s} style={styles.dropdownItem} onMouseDown={() => addTag(s)}>
                  {s}
                </div>
              ))}
              {suggestions.length === 0 && !input.trim() && (
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--color-text-3)' }}>
                  Type to create a new tag
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>
        Press Enter or comma to add. Click × to remove.
      </p>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column' },
  tagArea: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '6px 10px',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface)',
    minHeight: 42,
    alignItems: 'center',
    cursor: 'text',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    background: 'rgba(37,99,235,0.1)',
    color: 'var(--color-accent)',
    border: '1px solid rgba(37,99,235,0.2)',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-accent)',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    lineHeight: 1,
  },
  input: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    fontFamily: 'inherit',
    width: '100%',
    padding: '2px 0',
    color: 'var(--color-text)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-elevated)',
    zIndex: 100,
    maxHeight: 200,
    overflowY: 'auto',
    marginTop: 4,
  },
  dropdownItem: {
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.1s',
    color: 'var(--color-text)',
  },
}
