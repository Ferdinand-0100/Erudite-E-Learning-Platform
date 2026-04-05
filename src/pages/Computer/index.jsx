import { useParams, Outlet, Navigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import Tabs from '../../components/Tabs'

const TABS = [
  { key: 'videos', label: 'Tutorial videos' },
  { key: 'materials', label: 'Written materials' },
  { key: 'quiz', label: 'Quiz system' },
]

export default function ComputerSection() {
  const { tab } = useParams()
  if (!tab) return <Navigate to="/computer/videos" replace />

  return (
    <div style={styles.page}>
      <PageHeader title="Computer" breadcrumb="Courses › Computer" />
      <Tabs basePath="/computer" tabs={TABS} />
      <Outlet context={{ courseKey: 'computer' }} />
    </div>
  )
}

const styles = {
  page: { padding: '28px 32px', maxWidth: '860px' },
}
