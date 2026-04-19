/**
 * progressService.js
 * Records activity events and recalculates progress percentages.
 * All functions are fire-and-forget — they never throw to the caller.
 */

/**
 * Clamps a number to [0, 100].
 * @param {number} n
 * @returns {number}
 */
export function clamp(n) {
  return Math.max(0, Math.min(100, n))
}

/**
 * Recalculates and upserts the progress percent for a (studentId, courseKey) pair.
 * Formula: clamp(round((dv + qc + dm) / (tv + tq + tm) * 100))
 * where dv = distinct videos watched, qc = quizzes completed, dm = distinct materials downloaded,
 * tv = total videos, tq = total quiz questions, tm = total materials.
 *
 * @param {object} supabase
 * @param {string} studentId
 * @param {string} courseKey
 */
export async function recalculateProgress(supabase, studentId, courseKey) {
  try {
    const [
      { count: tv },
      { count: tq },
      { count: tm },
      { count: dv },
      { count: qc },
      { count: dm },
    ] = await Promise.all([
      supabase.from('videos').select('*', { count: 'exact', head: true }).eq('course_key', courseKey),
      supabase.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('course_key', courseKey),
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('course_key', courseKey),
      supabase.from('activity_log').select('label', { count: 'exact', head: true })
        .eq('student_id', studentId).eq('course_key', courseKey).eq('event_type', 'video_watched'),
      supabase.from('activity_log').select('*', { count: 'exact', head: true })
        .eq('student_id', studentId).eq('course_key', courseKey).eq('event_type', 'quiz_completed'),
      supabase.from('activity_log').select('label', { count: 'exact', head: true })
        .eq('student_id', studentId).eq('course_key', courseKey).eq('event_type', 'material_downloaded'),
    ])

    const total = (tv ?? 0) + (tq ?? 0) + (tm ?? 0)
    if (total === 0) {
      await supabase.from('progress').upsert(
        { student_id: studentId, course_key: courseKey, percent: 0, updated_at: new Date().toISOString() },
        { onConflict: 'student_id,course_key' }
      )
      return
    }

    const done = (dv ?? 0) + (qc ?? 0) + (dm ?? 0)
    const percent = clamp(Math.round((done / total) * 100))
    console.log('[progressService] upserting percent:', { studentId, courseKey, done, total, percent })

    await supabase.from('progress').upsert(
      { student_id: studentId, course_key: courseKey, percent, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,course_key' }
    )
  } catch (err) {
    console.error('[progressService] recalculateProgress error:', err)
  }
}

/**
 * Records a single activity event and triggers progress recalculation.
 *
 * @param {object} supabase
 * @param {string} studentId
 * @param {string} courseKey
 * @param {'video_watched'|'quiz_completed'|'material_downloaded'} eventType
 * @param {string} label
 */
export async function recordEvent(supabase, studentId, courseKey, eventType, label) {
  try {
    console.log('[progressService] recordEvent called:', { studentId, courseKey, eventType, label })
    const { error } = await supabase.from('activity_log').insert({
      student_id: studentId,
      course_key: courseKey,
      event_type: eventType,
      label,
    })
    if (error) {
      console.error('[progressService] recordEvent insert error:', error)
      return
    }
    console.log('[progressService] activity_log insert success, recalculating...')
    await recalculateProgress(supabase, studentId, courseKey)
  } catch (err) {
    console.error('[progressService] recordEvent error:', err)
  }
}
