import { useState } from 'react'
import { Search, X } from 'lucide-react'

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

const difficultyColors = {
  Beginner:     { bg: '#dcfce7', color: '#166534' },
  Intermediate: { bg: '#fef3c7', color: '#92400e' },
  Advanced:     { bg: '#fee2e2', color: '#991b1b' },
}

export default function FilterBar({
  search = '',
  onSearchChange,
  activeDifficulties = [],
  onDifficultyToggle,
  availableTags = [],
  activeTags = [],
  onTagToggle,
  onClear,
  placeholder = 'Search…',
}) {
  const [focusedSearch, setFocusedSearch] = useState(false)
  const hasActiveFilters = search || activeDifficulties.length > 0 || activeTags.length > 0

  return (
    <div style={styles.container}>

      {/* Search */}
      <div style={styles.searchWrap}>
        <Search size={14} style={styles.searchIcon} />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={placeholder}
          style={{
            ...styles.searchInput,
            borderColor: focusedSearch ? 'var(--color-secondary)' : 'var(--color-border)',
          }}
          onFocus={() => setFocusedSearch(true)}
          onBlur={() => setFocusedSearch(false)}
        />
        {search && (
          <button onClick={() => onSearchChange('')} style={styles.clearSearch} aria-label="Clear search">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Difficulty chips — single select */}
      <div style={styles.chipRow}>
        {DIFFICULTIES.map(d => {
          const isActive = activeDifficulties.includes(d)
          const dc = difficultyColors[d]
          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                // Radio behaviour: clicking active deselects, clicking inactive selects only this one
                if (isActive) {
                  onDifficultyToggle(d) // deselect
                } else {
                  // Deselect any currently active difficulty first, then select this one
                  activeDifficulties.forEach(active => onDifficultyToggle(active))
                  onDifficultyToggle(d)
                }
              }}
              style={{
                ...styles.chip,
                background: isActive ? dc.bg : 'var(--color-surface)',
                color: isActive ? dc.color : 'var(--color-text-2)',
                boxShadow: isActive ? 'var(--shadow-hover)' : 'none',
                transform: isActive ? 'translate(2px, 2px)' : 'none',
              }}
            >
              {d}
            </button>
          )
        })}
      </div>

      {/* Tag chips */}
      {availableTags.length > 0 && (
        <div style={styles.chipRow}>
          {availableTags.map(tag => {
            const isActive = activeTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagToggle(tag)}
                style={{
                  ...styles.chip,
                  background: isActive ? 'var(--color-secondary)' : 'var(--color-surface)',
                  color: isActive ? 'white' : 'var(--color-text-2)',
                  boxShadow: isActive ? 'var(--shadow-hover)' : 'none',
                  transform: isActive ? 'translate(2px, 2px)' : 'none',
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <button type="button" onClick={onClear} style={styles.clearAll}>
          <X size={11} style={{ marginRight: 4 }} />
          Clear filters
        </button>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
    padding: '14px 16px',
    background: 'var(--color-surface)',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    boxShadow: 'var(--shadow-card)',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    color: 'var(--color-text-3)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '8px 32px 8px 32px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--transition-base)',
  },
  clearSearch: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-3)',
    display: 'flex',
    alignItems: 'center',
    padding: 2,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    padding: '4px 12px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'all var(--transition-base)',
  },
  clearAll: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: 'var(--color-text-3)',
    padding: 0,
    fontFamily: 'var(--font-body)',
    alignSelf: 'flex-start',
  },
}
