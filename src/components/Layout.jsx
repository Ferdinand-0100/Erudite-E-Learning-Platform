import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import styles from './Layout.module.css'

const ENGLISH_SECTIONS = ['GET', 'IELTS', 'PTE']
const SUB_TABS = ['videos', 'materials', 'quiz']

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openMenus, setOpenMenus] = useState({ english: false, mandarin: false, computer: false })

  const toggle = (key) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }))

  const isActive = (path) => location.pathname.startsWith(path)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>EduLearn</span>
          <span className={styles.logoSub}>Learning Platform</span>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <HomeIcon /> Home
          </NavLink>

          <div className={styles.sectionLabel}>Courses</div>

          {/* English */}
          <div
            className={`${styles.navItem} ${isActive('/english') ? styles.active : ''}`}
            onClick={() => { toggle('english'); if (!isActive('/english')) navigate('/english/GET/videos') }}
          >
            <span className={styles.courseIcon}>A</span>
            English
            <ChevronIcon open={openMenus.english || isActive('/english')} />
          </div>
          {(openMenus.english || isActive('/english')) && (
            <div className={styles.submenu}>
              {ENGLISH_SECTIONS.map(sec => (
                <div key={sec}>
                  <NavLink
                    to={`/english/${sec}/videos`}
                    className={({ isActive }) => `${styles.subItem} ${isActive || location.pathname.includes(`/english/${sec}`) ? styles.subActive : ''}`}
                  >
                    {sec}
                  </NavLink>
                  {location.pathname.includes(`/english/${sec}`) && (
                    <div className={styles.subSubmenu}>
                      {SUB_TABS.map(tab => (
                        <NavLink key={tab} to={`/english/${sec}/${tab}`} className={({ isActive }) => `${styles.subSubItem} ${isActive ? styles.subSubActive : ''}`}>
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Mandarin */}
          <div
            className={`${styles.navItem} ${isActive('/mandarin') ? styles.active : ''}`}
            onClick={() => { toggle('mandarin'); if (!isActive('/mandarin')) navigate('/mandarin/videos') }}
          >
            <span className={styles.courseIcon}>文</span>
            Mandarin
            <ChevronIcon open={openMenus.mandarin || isActive('/mandarin')} />
          </div>
          {(openMenus.mandarin || isActive('/mandarin')) && (
            <div className={styles.submenu}>
              {SUB_TABS.map(tab => (
                <NavLink key={tab} to={`/mandarin/${tab}`} className={({ isActive }) => `${styles.subItem} ${isActive ? styles.subActive : ''}`}>
                  {tab === 'videos' ? 'Tutorial videos' : tab === 'materials' ? 'Written materials' : 'Quiz system'}
                </NavLink>
              ))}
            </div>
          )}

          {/* Computer */}
          <div
            className={`${styles.navItem} ${isActive('/computer') ? styles.active : ''}`}
            onClick={() => { toggle('computer'); if (!isActive('/computer')) navigate('/computer/videos') }}
          >
            <span className={styles.courseIcon}>⌨</span>
            Computer
            <ChevronIcon open={openMenus.computer || isActive('/computer')} />
          </div>
          {(openMenus.computer || isActive('/computer')) && (
            <div className={styles.submenu}>
              {SUB_TABS.map(tab => (
                <NavLink key={tab} to={`/computer/${tab}`} className={({ isActive }) => `${styles.subItem} ${isActive ? styles.subActive : ''}`}>
                  {tab === 'videos' ? 'Tutorial videos' : tab === 'materials' ? 'Written materials' : 'Quiz system'}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.avatarInfo}>
            <div className={styles.avatarName}>{displayName}</div>
            <div className={styles.avatarRole}>Student</div>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out">↩</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 6L7 1l6 5v7H9V9H5v4H1V6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}
