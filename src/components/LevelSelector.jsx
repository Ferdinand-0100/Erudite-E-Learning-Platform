import { useNavigate } from 'react-router-dom'

export default function LevelSelector({ levels, activeLevel, basePath }) {
  const navigate = useNavigate()

  return (
    <div style={styles.pills}>
      {levels.map(level => (
        <button
          key={level.key}
          style={{ ...styles.pill, ...(activeLevel === level.key ? styles.pillActive : {}) }}
          onClick={() => navigate(`${basePath}/${level.key}/videos`)}
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
    border: '1px solid var(--color-border-strong)',
    borderRadius: '20px',
    fontSize: '13px',
    background: 'rgba(255,255,255,0.6)',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  pillActive: {
    background: 'var(--color-accent)',
    color: 'var(--color-accent-fg)',
    borderColor: 'var(--color-accent)',
  },
}
