/**
 * weekCalculator.js
 * Computes a student's current week number for an enrollment.
 * Formula: floor(daysSinceStart / 7) + 1
 * week_override supersedes the formula when set.
 * All dates treated as UTC.
 */

export function calcCurrentWeek(courseStartDate, weekOverride) {
  if (weekOverride != null && Number.isInteger(weekOverride) && weekOverride >= 1) {
    return weekOverride
  }
  if (!courseStartDate) return 1
  const start = new Date(courseStartDate + 'T00:00:00Z')
  const now = new Date()
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const days = Math.floor((nowUtc - startUtc) / 86400000)
  return Math.max(1, Math.floor(days / 7) + 1)
}
