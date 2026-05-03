import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, ChevronRight, LogOut, Settings, BookOpen } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useEnrollment } from '../lib/EnrollmentContext'
import { COURSE_CONFIG, defaultPath, defaultSubclassPath } from '../lib/courseConfig'
import styles from './Layout.module.css'

export default function Layout() {
  const { user, signOut, profile } = useAuth()
  const { enrollments, loading: enrollmentLoading } = useEnrollment()
  const isAdmin = profile?.role === 'admin'
  const navigate = useNavigate()
  const location = useLocation()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [openMenus, setOpenMenus] = useState(
    Object.fromEntries(Object.keys(COURSE_CONFIG).map(k => [k, false]))
  )

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
            <Home size={14} aria-hidden />
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
                  <span className={`${styles.chevronWrap} ${courseExpanded ? styles.chevronOpen : ''}`}><ChevronRight size={12} /></span>
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
                              const enrolled = isAdmin || enrollmentLoading || enrollments.some(k => k.startsWith(`${courseKey}_${subclassKey}_`.toLowerCase()))
                              if (!enrolled) return
                              // Navigate to the first enrolled level, not just the default
                              const subclassCfg = COURSE_CONFIG[courseKey]?.subclasses[subclassKey]
                              const firstEnrolledLevel = subclassCfg?.levels.find(l =>
                                isAdmin || enrollmentLoading || enrollments.includes(`${courseKey}_${subclassKey}_${l.key}`.toLowerCase())
                              )
                              const path = firstEnrolledLevel
                                ? `/${courseKey}/${subclassKey}/${firstEnrolledLevel.key}/videos`
                                : defaultSubclassPath(courseKey, subclassKey)
                              navigate(path)
                              setIsSidebarOpen(false)
                            }}
                            style={{
                              cursor: isAdmin || enrollmentLoading || enrollments.some(k => k.startsWith(`${courseKey}_${subclassKey}_`.toLowerCase())) ? 'pointer' : 'default',
                              opacity: !isAdmin && !enrollmentLoading && !enrollments.some(k => k.startsWith(`${courseKey}_${subclassKey}_`.toLowerCase())) ? 0.4 : 1,
                            }}
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
                                        {['videos', 'materials', 'quiz', 'essay'].map(tab => (
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

        {/* Extra section */}
        <div className={styles.sectionLabel} style={{ marginTop: 8 }}>Extra</div>
        <NavLink
          to="/extra"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        >
          <BookOpen size={14} aria-hidden />
          <span>Study Guides</span>
        </NavLink>

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
                <Settings size={13} aria-hidden />
              </button>
            )}
            <button
              className={styles.signOutBtn}
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={15} aria-hidden />
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

