/**
 * enrollmentService.js
 * Functions for reading and writing student enrollment records.
 * Enrollment is tracked at the full course_key level (e.g. 'english_ielts_band5').
 */

/**
 * Builds a full 3-segment course_key from its parts.
 * @param {string} course
 * @param {string} subclass
 * @param {string} level
 * @returns {string}
 */
export function buildCourseKey(course, subclass, level) {
  return `${course}_${subclass}_${level}`.toLowerCase()
}

/**
 * Fetches all course_key values enrolled for a given student.
 * Returns an empty array on error.
 * @param {object} supabase
 * @param {string} studentId
 * @returns {Promise<string[]>}
 */
export async function fetchEnrollments(supabase, studentId) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_key')
      .eq('student_id', studentId)
    if (error) {
      console.error('[enrollmentService] fetchEnrollments error:', error)
      return []
    }
    return (data || []).map(r => r.course_key)
  } catch (err) {
    console.error('[enrollmentService] fetchEnrollments error:', err)
    return []
  }
}

/**
 * Assigns a course_key to a student (upsert — no error on duplicate).
 * Throws on Supabase error.
 * @param {object} supabase
 * @param {string} studentId
 * @param {string} courseKey
 */
export async function assignEnrollment(supabase, studentId, courseKey) {
  const { error } = await supabase
    .from('enrollments')
    .upsert({ student_id: studentId, course_key: courseKey }, { onConflict: 'student_id,course_key' })
  if (error) throw error
}

/**
 * Removes a course_key from a student (no error if not found).
 * Throws on Supabase error.
 * @param {object} supabase
 * @param {string} studentId
 * @param {string} courseKey
 */
export async function removeEnrollment(supabase, studentId, courseKey) {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('course_key', courseKey)
  if (error) throw error
}
