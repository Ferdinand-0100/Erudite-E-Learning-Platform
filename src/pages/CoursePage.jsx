import { useParams } from 'react-router-dom'
import VideoList from '../components/VideoList'
import MaterialsList from '../components/MaterialsList'
import QuizEngine from '../components/QuizEngine'

/**
 * course prop: 'english' | 'mandarin' | 'computer'
 *
 * URL params:
 *   English  → /english/:section/:tab   (section = GET/IELTS/PTE, tab = videos/materials/quiz)
 *   Mandarin → /mandarin/:tab
 *   Computer → /computer/:tab
 */
export default function CoursePage({ course }) {
  const { section, tab } = useParams()

  let courseKey, activeTab

  if (course === 'english') {
    courseKey = `english_${section?.toUpperCase()}`
    activeTab = tab
  } else {
    // For mandarin/computer the :tab param is in the "section" slot
    courseKey = course
    activeTab = section
  }

  if (!activeTab) return null

  return (
    <div>
      {activeTab === 'videos'    && <VideoList     courseKey={courseKey} />}
      {activeTab === 'materials' && <MaterialsList courseKey={courseKey} />}
      {activeTab === 'quiz'      && <QuizEngine    courseKey={courseKey} />}
    </div>
  )
}
