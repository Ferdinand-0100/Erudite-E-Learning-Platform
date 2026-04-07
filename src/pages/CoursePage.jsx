import { useParams } from 'react-router-dom'
import { buildCourseKey } from '../lib/courseConfig'
import VideoList from '../components/VideoList'
import MaterialsList from '../components/MaterialsList'
import QuizEngine from '../components/QuizEngine'

/**
 * Reads course, subclass, level, tab from URL params.
 * Derives courseKey = buildCourseKey(course, subclass, level).
 * Renders the active tab component, or null for unrecognised tabs.
 */
export default function CoursePage() {
  const { course, subclass, level, tab } = useParams()

  const courseKey = buildCourseKey(course, subclass, level)

  if (tab === 'videos')    return <VideoList     courseKey={courseKey} />
  if (tab === 'materials') return <MaterialsList courseKey={courseKey} />
  if (tab === 'quiz')      return <QuizEngine    courseKey={courseKey} />

  return null
}
