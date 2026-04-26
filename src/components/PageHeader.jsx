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
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-3)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  title: {
    fontSize: 'var(--font-size-display)',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: 'var(--color-text)',
  },
}