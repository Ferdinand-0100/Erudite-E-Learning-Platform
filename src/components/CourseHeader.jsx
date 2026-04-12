/**
 * CourseHeader
 * Frosted glass band that spans the full width of the main content area,
 * containing the PageHeader (breadcrumb + title) and the Tabs bar.
 * Everything below this component renders on the transparent background.
 */
export default function CourseHeader({ children }) {
  return (
    <div style={styles.band}>
      <div style={styles.inner}>
        {children}
      </div>
    </div>
  )
}

const styles = {
  band: {
    /* Bleed out of the main area's 42px side padding */
    margin: '0 -42px',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.55)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.35)',
    boxShadow: '0 2px 24px rgba(0, 0, 0, 0.2)',
  },
  inner: {
    /* Re-apply horizontal padding + top padding */
    padding: '28px 42px 0',
  },
}
