import { NavLink, useLocation } from 'react-router-dom'

export default function Tabs({ basePath, tabs }) {
  const location = useLocation()

  return (
    <div style={styles.tabs}>
      {tabs.map(tab => {
        const to = `${basePath}/${tab.key}`
        const isActive = location.pathname === to

        return (
          <NavLink
            key={tab.key}
            to={to}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : {})
            }}
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
    marginBottom: '28px'
  },

  tab: {
    padding: '10px 18px',
    fontSize: '13.5px',
    color: 'var(--color-text-2)',
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    transition: 'all .18s ease'
  },

  tabActive: {
    color: 'var(--color-text)',
    borderBottom: '2px solid var(--color-accent)',
    fontWeight: 500
  }
}