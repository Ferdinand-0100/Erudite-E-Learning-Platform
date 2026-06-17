/**
 * WeekFilter
 *
 * Always renders all 24 weeks plus an "All" pill, regardless of which weeks
 * have content. Mirrors the subclass/level pill style in CourseShell:
 *   - Unlocked weeks (≤ currentWeek): fully interactive
 *   - Locked weeks (> currentWeek): dimmed, shows Lock icon, not clickable
 *   - Active week: accent fill + push shadow (same as active level pill)
 *
 * The pill row scrolls horizontally instead of wrapping so it never
 * pushes content down.
 *
 * Props:
 *   selected:    number | 'all'
 *   onChange:    (week: number | 'all') => void
 *   currentWeek: number  — student's current week
 *   totalWeeks:  number  — how many weeks to show (default 24)
 */
import { Lock } from 'lucide-react'

const TOTAL_WEEKS = 24

export default function WeekFilter({ selected, onChange, currentWeek, totalWeeks = TOTAL_WEEKS }) {
  return (
    <div style={styles.wrapper} className="week-filter-row">
      {/* "All" pill */}
      <button
        onClick={() => onChange('all')}
        style={pillStyle(selected === 'all', false, false)}
      >
        All
      </button>

      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
        const locked = w > currentWeek
        const active = selected === w
        return (
          <button
            key={w}
            onClick={() => { if (!locked) onChange(w) }}
            style={pillStyle(active, locked, !locked)}
            aria-label={locked ? `Week ${w} — locked` : `Week ${w}`}
            aria-pressed={active}
          >
            {locked && <Lock size={10} style={{ marginRight: 3, flexShrink: 0 }} />}
            Week {w}
          </button>
        )
      })}
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    gap: 6,
    // Horizontal scroll — never wraps
    overflowX: 'auto',
    overflowY: 'hidden',
    // Hide scrollbar visually but keep it functional
    scrollbarWidth: 'none',        // Firefox
    msOverflowStyle: 'none',       // IE/Edge
    paddingBottom: 2,              // room for the active pill shadow
    marginBottom: 14,
    // Prevent flex children from shrinking below their natural size
    flexShrink: 0,
  },
}

// Webkit scrollbar hidden via global style below
const _hideScrollbarStyle = `
.week-filter-row::-webkit-scrollbar { display: none; }
`

function pillStyle(active, locked, unlocked) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,               // don't shrink — keeps pills readable at any count
    padding: '6px 13px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    cursor: locked ? 'not-allowed' : 'pointer',
    // Active = accent fill + push, matching the level pill in CourseShell
    background: active
      ? 'var(--color-accent)'
      : locked
      ? 'var(--color-muted)'
      : 'var(--color-surface)',
    color: active ? 'white' : locked ? 'var(--color-text-3)' : 'var(--color-text-2)',
    boxShadow: active ? 'var(--shadow-hover)' : 'var(--shadow-card)',
    transform: active ? 'translate(2px, 2px)' : 'none',
    opacity: locked && !active ? 0.5 : 1,
    transition: 'all var(--transition-base)',
    outline: 'none',
    whiteSpace: 'nowrap',
  }
}
