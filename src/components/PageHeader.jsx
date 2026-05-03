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
    marginBottom: '20px',
  },
  breadcrumb: {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-3)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--font-size-display)',
    fontWeight: 700,
    color: 'var(--color-text)',
  },
}