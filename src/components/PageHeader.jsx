export default function PageHeader({ title, breadcrumb }) {
  return (
    <div style={styles.header}>
      <div style={styles.breadcrumb}>{breadcrumb}</div>
      <h1 style={styles.title}>{title}</h1>
    </div>
  )
}

const styles = {
  header: {
    marginBottom: '28px'
  },

  breadcrumb: {
    fontSize: '12px',
    color: 'var(--color-text-3)',
    marginBottom: '6px'
  },

  title: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.4px'
  }
}