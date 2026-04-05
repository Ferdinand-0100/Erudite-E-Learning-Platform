import { useNavigate, useParams, Outlet, Navigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import Tabs from '../../components/Tabs'

const SECTIONS = ['GET', 'IELTS', 'PTE']
const TABS = [
  { key: 'videos', label: 'Tutorial videos' },
  { key: 'materials', label: 'Written materials' },
  { key: 'quiz', label: 'Quiz system' },
]

export default function EnglishSection() {
  const { section, tab } = useParams()
  const navigate = useNavigate()

  // Default redirect
  if (!section) return <Navigate to="/english/GET/videos" replace />

  const activeSection = SECTIONS.includes(section?.toUpperCase()) ? section.toUpperCase() : 'GET'

  return (
    <div style={styles.page}>
      <PageHeader title="English" breadcrumb="Courses › English" />

      {/* Section pills */}
      <div style={styles.pills}>
        {SECTIONS.map(sec => (
          <button
            key={sec}
            style={{ ...styles.pill, ...(activeSection === sec ? styles.pillActive : {}) }}
            onClick={() => navigate(`/english/${sec}/${tab || 'videos'}`)}
          >
            {sec}
          </button>
        ))}
      </div>

      <Tabs basePath={`/english/${activeSection}`} tabs={TABS} />
      <Outlet />
    </div>
  )
}

const styles = {
  page: { padding: '28px 32px', maxWidth: '860px' },
  pills: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  pill: {
    padding: '6px 16px',
    border: '1px solid var(--color-border-strong)',
    borderRadius: '20px',
    fontSize: '13px',
    background: 'var(--color-surface)',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  pillActive: {
    background: 'var(--color-accent)',
    color: 'var(--color-accent-fg)',
    borderColor: 'var(--color-accent)',
  },
}
