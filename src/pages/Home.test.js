/**
 * Property-based tests for Home.jsx pure helpers.
 *
 * Feature: progress-tracking
 * Property 4: Course progress averaging
 * Validates: Requirements 5.2, 5.4
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { aggregateProgress, relativeTime } from './Home.jsx'

// Minimal courseConfig fixture that mirrors the real shape
const MOCK_CONFIG = {
  english: { subclasses: {} },
  mandarin: { subclasses: {} },
  computer: { subclasses: {} },
}

describe('aggregateProgress', () => {
  /**
   * Property 4: Course progress averaging
   * Validates: Requirements 5.2, 5.4
   *
   * For any array of {course_key, percent} rows, aggregateProgress SHALL return,
   * for each top-level course, the arithmetic mean of all matching percent values
   * rounded to the nearest integer, and SHALL return 0 for any course with no
   * matching rows.
   */
  it('Property 4: averages matching rows and returns 0 for missing courses', () => {
    const courseKeys = Object.keys(MOCK_CONFIG) // ['english', 'mandarin', 'computer']

    // Generator: rows whose course_key starts with one of the known prefixes
    const rowArb = fc.array(
      fc.record({
        course_key: fc.oneof(
          // rows that match a known course
          fc.constantFrom('english_get_beginner', 'english_ielts_band4', 'mandarin_gm_hsk1', 'computer_iot_beginner'),
          // rows that don't match any course
          fc.constant('unknown_course_level'),
        ),
        percent: fc.integer({ min: 0, max: 100 }),
      }),
      { maxLength: 50 }
    )

    fc.assert(
      fc.property(rowArb, (rows) => {
        const result = aggregateProgress(rows, MOCK_CONFIG)

        // Result must have exactly the same keys as courseConfig
        expect(Object.keys(result).sort()).toEqual(courseKeys.sort())

        for (const courseKey of courseKeys) {
          const matching = rows.filter(r => r.course_key.startsWith(`${courseKey}_`))

          if (matching.length === 0) {
            // No matching rows → must return 0
            expect(result[courseKey]).toBe(0)
          } else {
            // Must return the arithmetic mean rounded to nearest integer
            const sum = matching.reduce((acc, r) => acc + r.percent, 0)
            const expected = Math.round(sum / matching.length)
            expect(result[courseKey]).toBe(expected)
          }
        }
      }),
      { numRuns: 200 }
    )
  })

  it('returns 0 for all courses when rows array is empty', () => {
    const result = aggregateProgress([], MOCK_CONFIG)
    for (const key of Object.keys(MOCK_CONFIG)) {
      expect(result[key]).toBe(0)
    }
  })

  it('correctly averages multiple rows for the same course', () => {
    const rows = [
      { course_key: 'english_get_beginner', percent: 40 },
      { course_key: 'english_ielts_band4', percent: 60 },
    ]
    const result = aggregateProgress(rows, MOCK_CONFIG)
    expect(result.english).toBe(50)
    expect(result.mandarin).toBe(0)
    expect(result.computer).toBe(0)
  })

  it('rounds to nearest integer', () => {
    const rows = [
      { course_key: 'english_get_beginner', percent: 0 },
      { course_key: 'english_ielts_band4', percent: 1 },
    ]
    const result = aggregateProgress(rows, MOCK_CONFIG)
    // (0 + 1) / 2 = 0.5 → rounds to 1
    expect(result.english).toBe(1)
  })
})

describe('relativeTime', () => {
  it('returns "Just now" for times less than 1 hour ago', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    expect(relativeTime(thirtyMinsAgo)).toBe('Just now')
  })

  it('returns "Xh ago" for times between 1 and 24 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(relativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns "Yesterday" for times between 24 and 48 hours ago', () => {
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
    expect(relativeTime(thirtyHoursAgo)).toBe('Yesterday')
  })

  it('returns "X days ago" for times older than 48 hours', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(relativeTime(threeDaysAgo)).toBe('3 days ago')
  })
})
