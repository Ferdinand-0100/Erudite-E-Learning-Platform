import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { COURSE_CONFIG, defaultPath, defaultSubclassPath } from '../lib/courseConfig'
import styles from './Layout.module.css'

function ChevronIcon({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      aria-hidden
    >
      <path
        d="M4 2l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Layout() {
  const { user, signOut, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [openMenus, setOpenMenus] = useState(
    Object.fromEntries(Object.keys(COURSE_CONFIG).map(k => [k, false]))
  )

  const toggle = key =>
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }))

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>

        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoMark}>Erudite English</span>
          <span className={styles.logoSub}>Learning Platform</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            onClick={() => setIsSidebarOpen(false)}
          >
            <HomeIcon />
            <span>Home</span>
          </NavLink>

          <div className={styles.sectionLabel}>Courses</div>

          {Object.entries(COURSE_CONFIG).map(([courseKey, course]) => {
            const courseActive = location.pathname.startsWith(`/${courseKey}/`) || location.pathname === `/${courseKey}`
            // Only use openMenus state when course is NOT active — when active, URL drives expansion
            const courseExpanded = courseActive || openMenus[courseKey]

            return (
              <div key={courseKey}>
                {/* Level 1 — Course */}
                <div
                  className={`${styles.navItem} ${courseActive ? styles.active : ''}`}
                  onClick={() => {
                    // Close all other menus, toggle this one
                    setOpenMenus(prev => {
                      const next = Object.fromEntries(Object.keys(prev).map(k => [k, false]))
                      next[courseKey] = !prev[courseKey]
                      return next
                    })
                    navigate(defaultPath(courseKey))
                    setIsSidebarOpen(false)
                  }}
                >
                  <span className={styles.courseIcon}>{course.icon}</span>
                  <span>{course.label}</span>
                  <ChevronIcon open={courseExpanded} />
                </div>

                {courseExpanded && (
                  <div className={styles.submenu}>
                    {Object.entries(course.subclasses).map(([subclassKey, subclass]) => {
                      // Use exact segment matching to avoid partial matches
                      const subclassSegment = `/${courseKey}/${subclassKey}/`
                      const subclassActive = location.pathname.startsWith(subclassSegment) ||
                        location.pathname === `/${courseKey}/${subclassKey}`

                      return (
                        <div key={subclassKey}>
                          {/* Level 2 — Subclass */}
                          <div
                            className={`${styles.subItem} ${subclassActive ? styles.subActive : ''}`}
                            onClick={() => {
                              navigate(defaultSubclassPath(courseKey, subclassKey))
                              setIsSidebarOpen(false)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {subclass.label}
                          </div>

                          {subclassActive && (
                            <div className={styles.subSubmenu}>
                              {subclass.levels.map(level => {
                                // Exact segment match: must have /level.key/ or end with /level.key
                                const levelSegment = `/${courseKey}/${subclassKey}/${level.key}/`
                                const levelExact = `/${courseKey}/${subclassKey}/${level.key}`
                                const levelActive = location.pathname.startsWith(levelSegment) ||
                                  location.pathname === levelExact

                                return (
                                  <div key={level.key}>
                                    {/* Level 3 — Level */}
                                    <div
                                      className={`${styles.subSubItem} ${levelActive ? styles.subSubActive : ''}`}
                                      onClick={() => {
                                        navigate(`/${courseKey}/${subclassKey}/${level.key}/videos`)
                                        setIsSidebarOpen(false)
                                      }}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {level.label}
                                    </div>

                                    {levelActive && (
                                      <div>
                                        {/* Level 4 — Tab links */}
                                        {['videos', 'materials', 'quiz'].map(tab => (
                                          <NavLink
                                            key={tab}
                                            to={`/${courseKey}/${subclassKey}/${level.key}/${tab}`}
                                            className={({ isActive }) =>
                                              `${styles.tabItem} ${isActive ? styles.subSubActive : ''}`
                                            }
                                            onClick={() => setIsSidebarOpen(false)}
                                          >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                          </NavLink>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

        </nav>

        {/* Sidebar footer */}
        <div className={styles.sidebarFooter}>

          <div className={styles.avatar}>{initials}</div>

          <div className={styles.avatarInfo}>
            <div className={styles.avatarName}>{displayName}</div>
            <div className={styles.avatarRole}>{profile?.role === 'admin' ? 'Admin' : 'Student'}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            {profile?.role === 'admin' && (
              <button
                className={styles.signOutBtn}
                onClick={() => navigate('/admin')}
                title="Admin panel"
                aria-label="Go to admin panel"
                style={{ fontSize: '13px' }}
              >
                ⚙️
              </button>
            )}
            <button
              className={styles.signOutBtn}
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
            >
              ↩
            </button>
          </div>

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

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 6L7 1l6 5v7H9V9H5v4H1V6z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
