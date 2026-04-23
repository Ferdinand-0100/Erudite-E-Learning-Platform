import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { filterStudents } from '../../lib/adminValidators'
import EnrollmentPicker from '../../components/admin/EnrollmentPicker'
import { fetchEnrollments, assignEnrollment, removeEnrollment } from '../../lib/enrollmentService'

const PAGE_SIZE = 20

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  background: 'var(--color-surface)',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '4px',
  color: 'var(--color-text-2)',
}

const btnPrimary = {
  padding: '8px 16px',
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: '14px',
  cursor: 'pointer',
}

const btnSecondary = {
  padding: '6px 12px',
  background: 'transparent',
  color: 'var(--color-text-2)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  cursor: 'pointer',
}

const btnDanger = {
  padding: '6px 12px',
  background: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  cursor: 'pointer',
}

const emptyForm = { email: '', password: '', fullName: '' }

function loadDraft() {
  try {
    const raw = sessionStorage.getItem('create-student-draft')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDraft(form, enrollmentKeys) {
  try {
    sessionStorage.setItem('create-student-draft', JSON.stringify({ form, enrollmentKeys }))
  } catch {}
}

function clearDraft() {
  try { sessionStorage.removeItem('create-student-draft') } catch {}
}

export default function AdminStudents() {
  const draft = loadDraft()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(draft?.form ?? emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(0)
  const [enrollmentKeys, setEnrollmentKeys] = useState(draft?.enrollmentKeys ?? [])

  // Manage Enrollments modal state
  const [managingStudent, setManagingStudent] = useState(null)
  const [managingKeys, setManagingKeys] = useState([])
  const [managingLoading, setManagingLoading] = useState(false)
  const [managingError, setManagingError] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setStudents(data || [])
    setLoading(false)
  }

  function handleField(e) {
    const { name, value } = e.target
    setForm(f => {
      const next = { ...f, [name]: value }
      saveDraft(next, enrollmentKeys)
      return next
    })
  }

  function handleEnrollmentChange(keys) {
    setEnrollmentKeys(keys)
    saveDraft(form, keys)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { data, error: fnErr } = await supabase.functions.invoke('create-student', {
      body: { email: form.email, password: form.password, fullName: form.fullName },
    })
    console.log('[create-student] response:', { data, fnErr })
    if (fnErr || data?.error) {
      setError(fnErr?.message || data?.error || JSON.stringify(fnErr))
    } else {
      if (data?.userId) {
        // Ensure the profiles row exists with role: 'student'
        await supabase.from('profiles').upsert({
          id: data.userId,
          email: form.email,
          full_name: form.fullName || '',
          role: 'student',
          is_active: true,
        }, { onConflict: 'id' })

        for (const key of enrollmentKeys) {
          try {
            await assignEnrollment(supabase, data.userId, key)
          } catch (err) {
            setError(`Account created but failed to assign enrollment "${key}": ${err.message}`)
          }
        }
      }
      setForm(emptyForm)
      setEnrollmentKeys([])
      clearDraft()
      await fetchStudents()
    }
    setSubmitting(false)
  }

  async function handleDeactivate(student) {
    if (!window.confirm('Deactivate this student?')) return
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', student.id)
    if (err) setError(err.message)
    else await fetchStudents()
  }

  async function handleReactivate(student) {
    if (!window.confirm('Reactivate this student?')) return
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', student.id)
    if (err) setError(err.message)
    else await fetchStudents()
  }

  async function handleOpenManage(student) {
    setManagingStudent(student)
    setManagingError(null)
    setManagingLoading(true)
    const keys = await fetchEnrollments(supabase, student.id)
    setManagingKeys(keys)
    setManagingLoading(false)
  }

  async function handleManagingChange(newKeys) {
    const added = newKeys.filter(k => !managingKeys.includes(k))
    const removed = managingKeys.filter(k => !newKeys.includes(k))
    setManagingError(null)
    try {
      for (const key of added) {
        await assignEnrollment(supabase, managingStudent.id, key)
      }
      for (const key of removed) {
        await removeEnrollment(supabase, managingStudent.id, key)
      }
      setManagingKeys(newKeys)
    } catch (err) {
      setManagingError(err.message)
    }
  }

  const filtered = filterStudents(
    students.filter(s => s.role === 'student' || s.role === null || s.role === undefined),
    search,
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSearchChange(e) {
    setSearch(e.target.value)
    setPage(0)
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 960 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Students</h1>

      {error && (
        <div style={{
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-4)',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Create Student form */}
      <form onSubmit={handleCreate} style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Create Student</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              style={inputStyle}
              type="email"
              name="email"
              value={form.email}
              onChange={handleField}
              required
              placeholder="student@example.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Password *</label>
            <input
              style={inputStyle}
              type="password"
              name="password"
              value={form.password}
              onChange={handleField}
              required
              placeholder="Password"
            />
          </div>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleField}
              placeholder="Full name (optional)"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Enrollments</label>
          <EnrollmentPicker selectedKeys={enrollmentKeys} onChange={handleEnrollmentChange} />
        </div>

        <div>
          <button type="submit" style={btnPrimary} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Student'}
          </button>
        </div>
      </form>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          style={{ ...inputStyle, maxWidth: 320 }}
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Student list */}
      {loading ? (
        <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: '14px' }}>No students found.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-strong)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Full Name</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Created</th>
                <th style={{ padding: '8px 10px' }} />
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 10px' }}>{s.full_name || '—'}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--color-text-2)' }}>{s.email}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <RoleBadge role={s.role} />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <ActiveBadge active={s.is_active} />
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--color-text-2)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button style={btnSecondary} onClick={() => handleOpenManage(s)}>Enrollments</button>
                    {s.is_active ? (
                      <button style={btnDanger} onClick={() => handleDeactivate(s)}>Deactivate</button>
                    ) : (
                      <button style={btnSecondary} onClick={() => handleReactivate(s)}>Reactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', alignItems: 'center' }}>
              <button
                style={btnSecondary}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Prev
              </button>
              <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                style={btnSecondary}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Manage Enrollments Modal */}
      {managingStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            width: '100%',
            maxWidth: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Manage Enrollments — {managingStudent.full_name || managingStudent.email}
              </h2>
              <button
                onClick={() => setManagingStudent(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-2)', lineHeight: 1 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {managingError && (
              <div style={{
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid var(--color-danger)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-3)',
                marginBottom: 'var(--space-3)',
                fontSize: '13px',
              }}>
                {managingError}
              </div>
            )}

            {managingLoading ? (
              <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>Loading enrollments…</p>
            ) : (
              <EnrollmentPicker selectedKeys={managingKeys} onChange={handleManagingChange} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role }) {
  const colors = {
    admin: { background: '#ede9fe', color: '#6d28d9' },
    student: { background: '#dbeafe', color: '#1d4ed8' },
  }
  const style = colors[role] || { background: 'var(--color-surface-2)', color: 'var(--color-text-2)' }
  return (
    <span style={{
      ...style,
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {role}
    </span>
  )
}

function ActiveBadge({ active }) {
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      background: active ? '#dcfce7' : '#fee2e2',
      color: active ? '#15803d' : '#b91c1c',
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
