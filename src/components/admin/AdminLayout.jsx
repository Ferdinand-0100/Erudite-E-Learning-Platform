import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin', icon: '📊', end: true },
  { label: 'Videos', to: '/admin/videos', icon: '🎬' },
  { label: 'Materials', to: '/admin/materials', icon: '📄' },
  { label: 'Quiz Questions', to: '/admin/quiz', icon: '❓' },
  { label: 'Students', to: '/admin/students', icon: '👥' },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const displayName =
    user?.user_metadata?.full_name || user?.email || 'Admin'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>

        {/* Header */}
        <div className={styles.logo}>
          <span className={styles.logoMark}>ADMIN PANEL</span>
          <span className={styles.logoSub}>Erudite English</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ label, to, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.footerInfo}>
            <div className={styles.footerName}>{displayName}</div>
            <span className={styles.badge}>Admin</span>
          </div>
          <button
            className={styles.signOutBtn}
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
          >
            ↩
          </button>
        </div>

      </aside>

      {/* OVERLAY (mobile) */}
      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {/* Hamburger (mobile only) */}
        <button
          className={styles.hamburger}
          onClick={() => setIsSidebarOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isSidebarOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <Outlet />
      </main>

    </div>
  )
}
