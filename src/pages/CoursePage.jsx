import { useParams } from 'react-router-dom'
import { buildCourseKey } from '../lib/courseConfig'
import VideoList from '../components/VideoList'
import MaterialsList from '../components/MaterialsList'
import QuizEngine from '../components/QuizEngine'
import EssayChecker from '../components/EssayChecker'

export default function CoursePage() {
  const { course, subclass, level, tab } = useParams()
  const courseKey = buildCourseKey(course, subclass, level)

  if (tab === 'videos')    return <VideoList     courseKey={courseKey} />
  if (tab === 'materials') return <MaterialsList courseKey={courseKey} />
  if (tab === 'quiz')      return <QuizEngine    courseKey={courseKey} />
  if (tab === 'essay')     return <EssayChecker  courseKey={courseKey} />

  return null
}
