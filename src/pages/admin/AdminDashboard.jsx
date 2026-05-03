import { useEffect, useState } from 'react'
import { Video, FileText, HelpCircle, Users, PenLine } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const stats = [
  { key: 'videos',         label: 'Total Videos',    icon: Video,      accent: '#ff4d4d' },
  { key: 'materials',      label: 'Materials',        icon: FileText,   accent: '#2d5da1' },
  { key: 'quiz_questions', label: 'Quiz Questions',   icon: HelpCircle, accent: '#d97706' },
  { key: 'essay_prompts',  label: 'Essay Prompts',    icon: PenLine,    accent: '#166534' },
  { key: 'students',       label: 'Students',         icon: Users,      accent: '#7c3aed' },
]

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ videos: 0, materials: 0, quiz_questions: 0, essay_prompts: 0, students: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true)
      setError(null)
      try {
        const [videos, materials, quiz_questions, essay_prompts, students] = await Promise.all([
          supabase.from('videos').select('*', { count: 'exact', head: true }),
          supabase.from('materials').select('*', { count: 'exact', head: true }),
          supabase.from('quiz_questions').select('*', { count: 'exact', head: true }),
          supabase.from('essay_prompts').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
        ])

        const results = { videos, materials, quiz_questions, essay_prompts, students }
        for (const [, result] of Object.entries(results)) {
          if (result.error) {
            setError(result.error.message || 'Failed to load dashboard data')
            setLoading(false)
            return
          }
        }

        setCounts({
          videos:         videos.count         ?? 0,
          materials:      materials.count       ?? 0,
          quiz_questions: quiz_questions.count  ?? 0,
          essay_prompts:  essay_prompts.count   ?? 0,
          students:       students.count        ?? 0,
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
    <div style={{ padding: '32px 24px', maxWidth: 960 }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 32 }}>
        Platform overview at a glance
      </p>

      {error && (
        <div style={{
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: '2px solid var(--color-danger)',
          borderRadius: 'var(--radius-wobbly-sm)',
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
          {stats.map(({ key, label, icon: Icon, accent }) => (
            <div
              key={key}
              style={{
                background: 'var(--color-surface)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-wobbly-md)',
                boxShadow: 'var(--shadow-card)',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Icon badge */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-wobbly-sm)',
                border: '2px solid var(--color-border)',
                background: 'var(--color-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
              }}>
                <Icon size={20} strokeWidth={2.5} />
              </div>

              {/* Count */}
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 40,
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1,
              }}>
                {counts[key]}
              </div>

              {/* Label */}
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-2)',
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
