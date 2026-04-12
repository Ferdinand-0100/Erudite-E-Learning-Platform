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
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    background: 'rgba(255,255,255,0.85)',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    boxShadow: 'none',
  },
  pillActive: {
    background: 'var(--color-accent)',
    color: 'var(--color-accent-fg)',
    border: 'none',
  },
}
