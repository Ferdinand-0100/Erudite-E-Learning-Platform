// src/lib/courseConfig.js
// Single source of truth for all course structure data.

function computerLevels() {
  return [
    { key: 'beginner',     label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced',     label: 'Advanced' },
  ]
}

function gmLevels() {
  return Array.from({ length: 12 }, (_, i) => ({
    key: `level_${i + 1}`,
    label: `Level ${i + 1}`,
  }))
}

export const COURSE_CONFIG = {
  english: {
    label: 'English',
    icon: 'A',
    defaultSubclass: 'GET',
    subclasses: {
      GET: {
        label: 'GE',
        defaultLevel: 'starter',
        levels: [
          { key: 'starter',           label: 'Starter' },
          { key: 'elementary',        label: 'Elementary' },
          { key: 'pre_intermediate',  label: 'Pre-Intermediate' },
          { key: 'intermediate',      label: 'Intermediate' },
          { key: 'upper_intermediate',label: 'Upper-Intermediate' },
          { key: 'advanced',          label: 'Advanced' },
          { key: 'proficient',        label: 'Proficient' },
        ],
      },
      IELTS: {
        label: 'IELTS',
        defaultLevel: 'ac',
        levels: [
          { key: 'ac',        label: 'AC' },
          { key: 'gt',        label: 'GT' },
          { key: 'ukvii',     label: 'UKVII' },
          { key: 'lifestyle', label: 'Lifestyle' },
        ],
      },
      PTE: {
        label: 'PTE',
        defaultLevel: 'pte_academic',
        levels: [
          { key: 'pte_academic',      label: 'PTE Academic' },
          { key: 'pte_academic_ukvii',label: 'PTE Academic UKVII' },
          { key: 'pte_core',          label: 'PTE Core' },
          { key: 'pte_home',          label: 'PTE Home' },
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
        defaultLevel: 'level_1',
        levels: gmLevels(),
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
        defaultLevel: 'a1',
        levels: [
          { key: 'a1', label: 'A1' },
          { key: 'a2', label: 'A2' },
          { key: 'b1', label: 'B1' },
          { key: 'b2', label: 'B2' },
          { key: 'c1', label: 'C1' },
          { key: 'c2', label: 'C2' },
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
