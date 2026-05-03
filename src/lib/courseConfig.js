// src/lib/courseConfig.js
// Single source of truth for all course structure data.

function computerLevels() {
  return [
    { key: 'beginner',     label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced',     label: 'Advanced' },
  ]
}

export const COURSE_CONFIG = {
  english: {
    label: 'English',
    icon: 'A',
    defaultSubclass: 'GET',
    subclasses: {
      GET: {
        label: 'GE',
        defaultLevel: 'beginner',
        levels: [
          { key: 'beginner',           label: 'Beginner' },
          { key: 'elementary',         label: 'Elementary' },
          { key: 'pre_intermediate',   label: 'Pre-Intermediate' },
          { key: 'intermediate',       label: 'Intermediate' },
          { key: 'upper_intermediate', label: 'Upper-Intermediate' },
          { key: 'advanced',           label: 'Advanced' },
        ],
      },
      IELTS: {
        label: 'IELTS',
        defaultLevel: 'band4',
        levels: [
          { key: 'band4',  label: 'Band 4' },
          { key: 'band5',  label: 'Band 5' },
          { key: 'band6',  label: 'Band 6' },
          { key: 'band7',  label: 'Band 7' },
          { key: 'band75', label: 'Band 7.5+' },
        ],
      },
      PTE: {
        label: 'PTE',
        defaultLevel: 'pte_core',
        levels: [
          { key: 'pte_core',        label: 'PTE Core' },
          { key: 'pte_academic_50', label: 'PTE Academic (50)' },
          { key: 'pte_academic_65', label: 'PTE Academic (65)' },
          { key: 'pte_academic_79', label: 'PTE Academic (79+)' },
        ],
      },
    },
  },
  mandarin: {
    label: 'Mandarin',
    icon: '文',
    defaultSubclass: 'GM',
    subclasses: {
      GM: {
        label: 'GM',
        defaultLevel: 'hsk1',
        levels: [
          { key: 'hsk1', label: 'HSK 1' },
          { key: 'hsk2', label: 'HSK 2' },
          { key: 'hsk3', label: 'HSK 3' },
          { key: 'hsk4', label: 'HSK 4' },
          { key: 'hsk5', label: 'HSK 5' },
          { key: 'hsk6', label: 'HSK 6' },
        ],
      },
      HSK: {
        label: 'HSK',
        defaultLevel: 'hsk1',
        levels: [
          { key: 'hsk1', label: 'HSK 1' },
          { key: 'hsk2', label: 'HSK 2' },
          { key: 'hsk3', label: 'HSK 3' },
          { key: 'hsk4', label: 'HSK 4' },
          { key: 'hsk5', label: 'HSK 5' },
          { key: 'hsk6', label: 'HSK 6' },
        ],
      },
      TOCFL: {
        label: 'TOCFL',
        defaultLevel: 'band_a',
        levels: [
          { key: 'band_a', label: 'Band A' },
          { key: 'band_b', label: 'Band B' },
          { key: 'band_c', label: 'Band C' },
        ],
      },
    },
  },
  computer: {
    label: 'Computer',
    icon: '⌨',
    defaultSubclass: 'IOT',
    subclasses: {
      IOT:         { label: 'IOT',       defaultLevel: 'beginner', levels: computerLevels() },
      '3D_Design': { label: '3D Design', defaultLevel: 'beginner', levels: computerLevels() },
      Web:         { label: 'Web',       defaultLevel: 'beginner', levels: computerLevels() },
      Desktop:     { label: 'Desktop',   defaultLevel: 'beginner', levels: computerLevels() },
      Mobile:      { label: 'Mobile',    defaultLevel: 'beginner', levels: computerLevels() },
      Database:    { label: 'Database',  defaultLevel: 'beginner', levels: computerLevels() },
    },
  },
}

/** Builds the database course_key from 3 URL params */
export function buildCourseKey(course, subclass, level) {
  return `${course}_${subclass}_${level}`.toLowerCase()
}

/** Returns the default path for a course */
export function defaultPath(course) {
  const c = COURSE_CONFIG[course]
  const sub = c.defaultSubclass
  const lvl = c.subclasses[sub].defaultLevel
  return `/${course}/${sub}/${lvl}/videos`
}

/** Returns the default path for a subclass */
export function defaultSubclassPath(course, subclass) {
  const lvl = COURSE_CONFIG[course].subclasses[subclass].defaultLevel
  return `/${course}/${subclass}/${lvl}/videos`
}
