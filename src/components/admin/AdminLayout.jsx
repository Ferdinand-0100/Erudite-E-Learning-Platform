import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Video, FileText, HelpCircle, Users, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { label: 'Dashboard',     to: '/admin',           icon: LayoutDashboard, end: true },
  { label: 'Videos',        to: '/admin/videos',    icon: Video },
  { label: 'Materials',     to: '/admin/materials', icon: FileText },
  { label: 'Quiz Questions',to: '/admin/quiz',      icon: HelpCircle },
  { label: 'Students',      to: '/admin/students',  icon: Users },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email || 'Admin'
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

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
          <div className={styles.logoIcon}>
            <LayoutDashboard size={16} />
          </div>
          <div>
            <span className={styles.logoMark}>Admin Panel</span>
            <span className={styles.logoSub}>Erudite English</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className={styles.navIcon}><Icon size={15} /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.avatar}>{initials}</div>
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
            <LogOut size={15} />
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
        <button
          className={styles.hamburger}
          onClick={() => setIsSidebarOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={isSidebarOpen}
        >
          <span /><span /><span />
        </button>
        <Outlet />
      </main>

    </div>
  )
}
