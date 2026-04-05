import { NavLink } from 'react-router-dom'

export default function Tabs({ basePath, tabs }) {
  return (
    <div style={styles.tabs}>
      {tabs.map(tab => {
        const to = `${basePath}/${tab.key}`
        return (
          <NavLink
            key={tab.key}
            to={to}
            end
            style={({ isActive }) => ({ ...styles.tab, ...(isActive ? styles.tabActive : {}) })}
          >
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
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '24px',
    gap: '0',
  },
  tab: {
    padding: '10px 18px',
    fontSize: '13.5px',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    textDecoration: 'none',
    transition: 'color 0.12s',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: 'var(--color-text)',
    borderBottomColor: 'var(--color-text)',
    fontWeight: 500,
  },
}
