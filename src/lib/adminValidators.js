export function validateEmbedUrl(url) {
  if (!url || !url.startsWith('https://www.youtube.com/embed/')) {
    return { valid: false, error: 'URL must start with https://www.youtube.com/embed/' }
  }
  return { valid: true }
}

export function validateFile(file) {
  if (!file) return { valid: false, error: 'No file selected' }
  if (file.type !== 'application/pdf') return { valid: false, error: 'File must be a PDF' }
  if (file.size > 20 * 1024 * 1024) return { valid: false, error: 'File must be under 20 MB' }
  return { valid: true }
}

export function validateQuestion(q) {
  if (!q.question?.trim()) return { valid: false, error: 'Question text is required' }
  const nonEmpty = (q.options || []).filter(o => o?.trim())
  if (nonEmpty.length < 4) return { valid: false, error: 'All 4 options are required' }
  return { valid: true }
}

export function validateAnswerIndex(idx) {
  if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
    return { valid: false, error: 'Correct answer must be 0, 1, 2, or 3' }
  }
  return { valid: true }
}

export function filterStudents(students, query) {
  if (!query) return students
  const q = query.toLowerCase()
  return students.filter(s =>
    s.full_name?.toLowerCase().includes(q) ||
    s.email?.toLowerCase().includes(q)
  )
}
