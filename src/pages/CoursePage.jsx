import { useParams } from 'react-router-dom'
import { buildCourseKey } from '../lib/courseConfig'
import { useAuth } from '../lib/AuthContext'
import VideoList from '../components/VideoList'
import MaterialsList from '../components/MaterialsList'
import QuizEngine from '../components/QuizEngine'
import EssayChecker from '../components/EssayChecker'
import AudioList from '../components/AudioList'
import BooksList from '../components/BooksList'
import AnswerKeysList from '../components/AnswerKeysList'

export default function CoursePage() {
  const { course, subclass, level, tab } = useParams()
  const { profile } = useAuth()
  const courseKey = buildCourseKey(course, subclass, level)
  const isTeacher = profile?.role === 'teacher'

  // Teacher tabs
  if (isTeacher) {
    if (tab === 'audio')      return <AudioList      courseKey={courseKey} />
    if (tab === 'books')      return <BooksList       courseKey={courseKey} />
    if (tab === 'answerkeys') return <AnswerKeysList  courseKey={courseKey} />
    return null
  }

  // Student / admin tabs
  if (tab === 'videos')    return <VideoList     courseKey={courseKey} />
  if (tab === 'materials') return <MaterialsList courseKey={courseKey} />
  if (tab === 'quiz')      return <QuizEngine    courseKey={courseKey} />
  if (tab === 'essay')     return <EssayChecker  courseKey={courseKey} />

  return null
}
