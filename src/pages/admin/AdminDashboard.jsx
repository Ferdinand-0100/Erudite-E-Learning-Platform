import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const stats = [
  { key: 'videos', label: 'Videos', icon: '🎬' },
  { key: 'materials', label: 'Materials', icon: '📄' },
  { key: 'quiz_questions', label: 'Quiz Questions', icon: '❓' },
  { key: 'students', label: 'Students', icon: '👥' },
]

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ videos: 0, materials: 0, quiz_questions: 0, students: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true)
      setError(null)
      try {
        const [videos, materials, quiz_questions, students] = await Promise.all([
          supabase.from('videos').select('*', { count: 'exact', head: true }),
          supabase.from('materials').select('*', { count: 'exact', head: true }),
          supabase.from('quiz_questions').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        ])

        const results = { videos, materials, quiz_questions, students }
        for (const [key, result] of Object.entries(results)) {
          if (result.error) {
            setError(result.error.message || 'Failed to load dashboard data')
            setLoading(false)
            return
          }
        }

        setCounts({
          videos: videos.count ?? 0,
          materials: materials.count ?? 0,
          quiz_questions: quiz_questions.count ?? 0,
          students: students.count ?? 0,
        })
      } catch (err) {
        setError(err.message || 'Unexpected error loading dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24, color: 'var(--color-text)' }}>
        Dashboard
      </h1>

      {error && (
        <div style={{
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--color-text-2)', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}>
          {stats.map(({ key, label, icon }) => (
            <div key={key} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
                {counts[key]}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
