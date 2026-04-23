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
              ...(isActive ? styles.tabActive : {})
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
    borderBottom: '1px solid var(--glass-border)',
    marginBottom: '0',
    gap: '2px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: '13.5px',
    color: 'var(--color-text-2)',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    transition: 'all var(--transition-base)',
    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
  },
  tabActive: {
    color: 'var(--color-accent)',
    borderBottom: '2px solid var(--color-accent)',
    fontWeight: 600,
    background: 'rgba(37,99,235,0.06)',
  }
}
