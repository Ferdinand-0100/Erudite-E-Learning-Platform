import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Video, FileText, HelpCircle, Users, LogOut, PenLine, BookOpen, Headphones, BookMarked, Key } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import styles from './AdminLayout.module.css'

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard',     to: '/admin',              icon: LayoutDashboard, end: true },
  { label: 'Videos',        to: '/admin/videos',       icon: Video },
  { label: 'Materials',     to: '/admin/materials',    icon: FileText },
  { label: 'Quiz Packages', to: '/admin/quiz',         icon: HelpCircle },
  { label: 'Essay Prompts', to: '/admin/essay',        icon: PenLine },
  { label: 'Audio Files',   to: '/admin/audio',        icon: Headphones },
  { label: 'Books',         to: '/admin/books',        icon: BookMarked },
  { label: 'Answer Keys',   to: '/admin/answerkeys',   icon: Key },
  { label: 'Study Guides',  to: '/admin/studyguides',  icon: BookOpen },
  { label: 'Students',      to: '/admin/students',     icon: Users },
]

// Teachers only see Study Guides and Students (read-only)
const TEACHER_NAV_ITEMS = [
  { label: 'Study Guides',  to: '/admin/studyguides',  icon: BookOpen },
  { label: 'Students',      to: '/admin/students',     icon: Users },
]

export default function AdminLayout() {
  const { user, signOut, profile } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const isTeacher = profile?.role === 'teacher'
  const NAV_ITEMS = isTeacher ? TEACHER_NAV_ITEMS : ADMIN_NAV_ITEMS

  const displayName = user?.user_metadata?.full_name || user?.email || (isTeacher ? 'Teacher' : 'Admin')
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <LayoutDashboard size={16} />
          </div>
          <div>
            <span className={styles.logoMark}>{isTeacher ? 'Teacher Panel' : 'Admin Panel'}</span>
            <span className={styles.logoSub}>Erudite English</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className={styles.navIcon}><Icon size={15} /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.footerInfo}>
            <div className={styles.footerName}>{displayName}</div>
            <span className={styles.badge}>{isTeacher ? 'Teacher' : 'Admin'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            {/* Teachers can switch to the student-side view */}
            {isTeacher && (
              <button
                className={styles.signOutBtn}
                onClick={() => navigate('/')}
                title="Student view"
                aria-label="Go to student view"
                style={{ fontSize: '13px' }}
              >
                <BookOpen size={13} />
              </button>
            )}
            <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out" aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
      )}

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
