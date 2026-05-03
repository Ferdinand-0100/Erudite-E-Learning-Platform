import { useNavigate } from 'react-router-dom'

export default function LevelSelector({ levels, activeLevel, basePath }) {
  const navigate = useNavigate()

  return (
    <div style={styles.pills}>
      {levels.map(level => (
        <button
          key={level.key}
          style={{ ...styles.pill, ...(activeLevel === level.key ? styles.pillActive : {}) }}
          onClick={e => { e.currentTarget.blur(); navigate(`${basePath}/${level.key}/videos`) }}
        >
          {level.label}
        </button>
      ))}
    </div>
  )
}

const styles = {
  pills: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  pill: {
    padding: '6px 16px',
    border: '2px solid var(--color-border)',
    borderRadius: 'var(--radius-wobbly-sm)',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    boxShadow: 'none',
  },
  pillActive: {
    background: 'var(--color-accent)',
    color: 'white',
    border: '2px solid var(--color-border)',
    boxShadow: 'var(--shadow-hover)',
  },
}
