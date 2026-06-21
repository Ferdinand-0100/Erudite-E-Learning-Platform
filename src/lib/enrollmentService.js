/**
 * enrollmentService.js
 * Functions for reading and writing student enrollment records.
 * Enrollment is tracked at the full course_key level (e.g. 'english_ielts_band5').
 *
 * Enrollments use soft-delete (is_active flag) so that course_start_date and
 * week_override are preserved across deactivation/reactivation cycles. When a
 * student is re-enrolled in a course they previously left, their week progress
 * resumes from where it was rather than resetting to week 1.
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
 * Fetches all active course_key values enrolled for a given student.
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
      .eq('is_active', true)
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
 * Assigns a course_key to a student using soft-upsert logic:
 * - If an enrollment row already exists (active or inactive), reactivate it,
 *   preserving the original course_start_date and week_override.
 *   If the row was paused, course_start_date is slid forward by the number of
 *   days it was inactive so the week clock resumes from the same week (frozen
 *   clock behaviour).
 * - If no row exists, insert a fresh one with course_start_date = today.
 * Throws on Supabase error.
 * @param {object} supabase
 * @param {string} studentId
 * @param {string} courseKey
 */
export async function assignEnrollment(supabase, studentId, courseKey) {
  // Check if a row already exists (may be inactive from a previous removal)
  const { data: existing, error: fetchErr } = await supabase
    .from('enrollments')
    .select('id, is_active, course_start_date, paused_at')
    .eq('student_id', studentId)
    .eq('course_key', courseKey)
    .maybeSingle()
  if (fetchErr) throw fetchErr

  if (existing) {
    // Row exists — reactivate it.
    // If it was paused, shift course_start_date forward by the inactive duration
    // so the week calculator returns the same week as before the pause.
    let newStartDate = existing.course_start_date
    if (existing.paused_at) {
      const pausedAt = new Date(existing.paused_at)
      const now = new Date()
      const pausedDays = Math.floor((now - pausedAt) / 86400000)
      if (pausedDays > 0 && newStartDate) {
        const start = new Date(newStartDate + 'T00:00:00Z')
        start.setUTCDate(start.getUTCDate() + pausedDays)
        newStartDate = start.toISOString().slice(0, 10)
      }
    }
    const { error } = await supabase
      .from('enrollments')
      .update({ is_active: true, paused_at: null, course_start_date: newStartDate })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    // Brand new enrollment — insert with today as the start date
    const { error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_key: courseKey,
        course_start_date: new Date().toISOString().slice(0, 10),
        is_active: true,
        paused_at: null,
      })
    if (error) throw error
  }
}

/**
 * Deactivates a course enrollment for a student (soft delete).
 * Records paused_at = now() so that on reactivation the inactive duration can
 * be added back to course_start_date (frozen-clock behaviour).
 * Throws on Supabase error.
 * @param {object} supabase
 * @param {string} studentId
 * @param {string} courseKey
 */
export async function removeEnrollment(supabase, studentId, courseKey) {
  const { error } = await supabase
    .from('enrollments')
    .update({ is_active: false, paused_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('course_key', courseKey)
  if (error) throw error
}
