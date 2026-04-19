import { COURSE_CONFIG } from '../../lib/courseConfig'
import { buildCourseKey } from '../../lib/enrollmentService'

/**
 * EnrollmentPicker
 * Renders a checkbox tree (course → subclass → level) for selecting enrollments.
 *
 * Props:
 *   selectedKeys: string[]          — currently selected full course_key values
 *   onChange(keys: string[]): void  — called with the full updated selection
 */
export default function EnrollmentPicker({ selectedKeys = [], onChange }) {
  function toggle(key) {
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter(k => k !== key))
    } else {
      onChange([...selectedKeys, key])
    }
  }

  return (
    <div style={styles.container}>
      {Object.entries(COURSE_CONFIG).map(([courseKey, course]) => (
        <div key={courseKey} style={styles.courseBlock}>
          <div style={styles.courseLabel}>{course.label}</div>
          {Object.entries(course.subclasses).map(([subclassKey, subclass]) => (
            <div key={subclassKey} style={styles.subclassBlock}>
              <div style={styles.subclassLabel}>{subclass.label}</div>
              <div style={styles.levelRow}>
                {subclass.levels.map(level => {
                  const key = buildCourseKey(courseKey, subclassKey, level.key)
                  const checked = selectedKeys.includes(key)
                  return (
                    <label key={key} style={styles.levelLabel}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        style={styles.checkbox}
                      />
                      {level.label}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '4px 0',
  },
  courseBlock: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    background: 'var(--color-surface)',
  },
  courseLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-text)',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  subclassBlock: {
    marginBottom: '10px',
  },
  subclassLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    marginBottom: '6px',
  },
  levelRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  levelLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: 'var(--color-text-2)',
    cursor: 'pointer',
    padding: '3px 8px',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    background: 'var(--color-surface-2)',
    userSelect: 'none',
  },
  checkbox: {
    cursor: 'pointer',
    accentColor: 'var(--color-accent)',
  },
}
