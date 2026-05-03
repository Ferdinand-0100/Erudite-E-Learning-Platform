import { NavLink, useLocation } from 'react-router-dom'

export default function Tabs({ basePath, tabs }) {
  const location = useLocation()

  return (
    <div style={styles.tabs}>
      {tabs.map(tab => {
        const to = `${basePath}/${tab.key}`
        const isActive = location.pathname === to
        const Icon = tab.icon

        return (
          <NavLink
            key={tab.key}
            to={to}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : {}),
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = 'var(--color-muted)'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = 'transparent'
            }}
          >
            {Icon && <Icon size={14} style={{ marginRight: '6px', flexShrink: 0 }} />}
            {tab.label}
          </NavLink>
        )
      })}
    </div>
  )
}

const styles = {
  tabs: {
    display: 'flex',
    borderBottom: 'none',
    marginBottom: '0',
    gap: '4px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: '13.5px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-2)',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    transition: 'background var(--transition-base), color var(--transition-base)',
    borderRadius: 'var(--radius-wobbly-sm) var(--radius-wobbly-sm) 0 0',
    background: 'transparent',
  },
  tabActive: {
    background: 'var(--color-surface-2)',
    border: '2px solid var(--color-border)',
    borderBottom: '2px solid var(--color-surface-2)',
    boxShadow: 'var(--shadow-hover)',
    color: 'var(--color-text)',
    fontWeight: 700,
  },
}
