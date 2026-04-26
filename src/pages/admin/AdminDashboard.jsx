import { useEffect, useState } from 'react'
import { Video, FileText, HelpCircle, Users, PenLine } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const stats = [
  {
    key: 'videos',
    label: 'Total Videos',
    icon: Video,
    gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    glow: 'rgba(59,130,246,0.3)',
  },
  {
    key: 'materials',
    label: 'Materials',
    icon: FileText,
    gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    key: 'quiz_questions',
    label: 'Quiz Questions',
    icon: HelpCircle,
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
    glow: 'rgba(249,115,22,0.3)',
  },
  {
    key: 'essay_prompts',
    label: 'Essay Prompts',
    icon: PenLine,
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
    glow: 'rgba(14,165,233,0.3)',
  },
  {
    key: 'students',
    label: 'Students',
    icon: Users,
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
    glow: 'rgba(139,92,246,0.3)',
  },
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
          essay_prompts: essay_prompts.count ?? 0,
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
    <div style={{ padding: '32px 24px', maxWidth: 960 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 28 }}>
        Platform overview at a glance
      </p>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {stats.map(({ key, label, icon: Icon, gradient, glow }) => (
            <div key={key} style={{
              background: gradient,
              borderRadius: 'var(--radius-lg)',
              padding: '24px 22px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 4px 20px ${glow}, 0 1px 3px rgba(0,0,0,0.1)`,
              border: '1px solid rgba(0,0,0,0.35)',
              minHeight: 130,
            }}>
              <div style={{
                position: 'absolute',
                bottom: -10,
                right: -10,
                opacity: 0.15,
                transform: 'rotate(-12deg)',
                pointerEvents: 'none',
              }}>
                <Icon size={100} color="white" />
              </div>

              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon size={18} color="white" />
              </div>

              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1,
                marginBottom: 6,
                letterSpacing: '-1px',
              }}>
                {counts[key]}
              </div>

              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                fontWeight: 500,
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
