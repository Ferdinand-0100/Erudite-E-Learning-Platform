import { useState, useEffect } from 'react'
import { COURSE_CONFIG, buildCourseKey } from '../../lib/courseConfig'

const courseKeys = Object.keys(COURSE_CONFIG)

/**
 * Parses a course_key string (e.g. 'english_ielts_band5') into { course, subclass, level }.
 * Subclass keys in COURSE_CONFIG are uppercase, so we match case-insensitively.
 */
function parseCourseKey(value) {
  if (!value) return null

  for (const courseKey of courseKeys) {
    if (!value.toLowerCase().startsWith(courseKey + '_')) continue

    const rest = value.slice(courseKey.length + 1) // e.g. 'ielts_band5'
    const subclasses = COURSE_CONFIG[courseKey].subclasses

    for (const subKey of Object.keys(subclasses)) {
      const subLower = subKey.toLowerCase()
      if (!rest.toLowerCase().startsWith(subLower + '_')) continue

      const level = rest.slice(subLower.length + 1) // e.g. 'band5'
      return { course: courseKey, subclass: subKey, level }
    }
  }

  return null
}

const selectStyle = {
  padding: '8px 12px',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-wobbly-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-hover)',
  outline: 'none',
}

export default function CourseKeySelector({ value, onChange }) {
  const defaultCourse = courseKeys[0]
  const defaultSubclass = COURSE_CONFIG[defaultCourse].defaultSubclass
  const defaultLevel = COURSE_CONFIG[defaultCourse].subclasses[defaultSubclass].defaultLevel

  const [course, setCourse] = useState(defaultCourse)
  const [subclass, setSubclass] = useState(defaultSubclass)
  const [level, setLevel] = useState(defaultLevel)

  // Sync state when `value` prop changes
  useEffect(() => {
    const parsed = parseCourseKey(value)
    if (parsed) {
      setCourse(parsed.course)
      setSubclass(parsed.subclass)
      setLevel(parsed.level)
    }
  }, [value])

  function handleCourseChange(e) {
    const newCourse = e.target.value
    const newSubclass = COURSE_CONFIG[newCourse].defaultSubclass
    const newLevel = COURSE_CONFIG[newCourse].subclasses[newSubclass].defaultLevel
    setCourse(newCourse)
    setSubclass(newSubclass)
    setLevel(newLevel)
    onChange(buildCourseKey(newCourse, newSubclass, newLevel))
  }

  function handleSubclassChange(e) {
    const newSubclass = e.target.value
    const newLevel = COURSE_CONFIG[course].subclasses[newSubclass].defaultLevel
    setSubclass(newSubclass)
    setLevel(newLevel)
    onChange(buildCourseKey(course, newSubclass, newLevel))
  }

  function handleLevelChange(e) {
    const newLevel = e.target.value
    setLevel(newLevel)
    onChange(buildCourseKey(course, subclass, newLevel))
  }

  const subclasses = COURSE_CONFIG[course].subclasses
  const levels = subclasses[subclass]?.levels ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flexWrap: 'wrap' }}>
      {/* Course */}
      <select value={course} onChange={handleCourseChange} style={selectStyle}>
        {courseKeys.map(k => (
          <option key={k} value={k}>{COURSE_CONFIG[k].label}</option>
        ))}
      </select>

      {/* Subclass */}
      <select value={subclass} onChange={handleSubclassChange} style={selectStyle}>
        {Object.keys(subclasses).map(k => (
          <option key={k} value={k}>{subclasses[k].label}</option>
        ))}
      </select>

      {/* Level */}
      <select value={level} onChange={handleLevelChange} style={selectStyle}>
        {levels.map(l => (
          <option key={l.key} value={l.key}>{l.label}</option>
        ))}
      </select>
    </div>
  )
}
